export const FETCH_CONTACTS_BEGIN   = 'FETCH_CONTACTS_BEGIN';
export const FETCH_CONTACTS_SUCCESS = 'FETCH_CONTACTS_SUCCESS';
export const FETCH_CONTACTS_FAILURE = 'FETCH_CONTACTS_FAILURE';
export const SEARCH_CONTACTS_QUERY = 'SEARCH_CONTACTS_QUERY';
import * as Permissions from 'expo-permissions';
import * as Contacts from 'expo-contacts';

export function fetchContactsWithRedux(authGraphToken) {
	return (dispatch) => {

  	dispatch(fetchContactsBegin());
    return fetchContactsPermission(authGraphToken).then(async ([response, bool, authGraphToken]) => {
				if(!bool){

				}
        fetchNativeContacts(response, authGraphToken).then(([nativeContacts, success, authGraphToken]) => {
          const createBook = [];
          for (const contact of nativeContacts) {
            if (contact.hasOwnProperty('phoneNumbers')){

							const firstName = contact.firstName ? contact.firstName : '';
							const lastName = contact.lastName ? contact.lastName : '';
							let fullName = firstName + ' ' + lastName;
							fullName = fullName.trim();

              createBook[contact.id] = {
                'firstName' : firstName,
                'lastName' : lastName,
								'fullName' : fullName,
                'phoneNumber' :  contact.phoneNumbers[0] ? contact.phoneNumbers[0].number : null,
                'imageAvailable' : contact.imageAvailable ? true : false,
                'imageUri' : contact.imageAvailable ? contact.image.uri : null,
                'contactType' : 'native',
                'id' : contact.id ? contact.id : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)
              }
            }
          }
          fetchAzureADContacts(authGraphToken).then(([response, success]) => {

						console.log('FETCHING AZURE AD CONTACTS');
						console.log(response);
            const adContacts = response.value;

            for(const adContact of adContacts) {

              var hasNumber = adContact.mobilePhone ? true : false;
              if(hasNumber) {
								const firstName = adContact.givenName ? adContact.givenName : '';
								const lastName = adContact.surname ? adContact.surname : '';

								let fullName = firstName + ' ' + lastName;
								fullName = fullName.trim();

                createBook[adContact.id] = {
                  'firstName' : firstName,
                  'lastName' : lastName,
									'fullName' : fullName,
                  'phoneNumber' :  adContact.mobilePhone ? adContact.mobilePhone : null,
                  'imageAvailable' : false,
                  'imageUri' : null,
                  'contactType' : 'azureAD',
                  'id' : adContact.id ? adContact.id : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)
                }
              }
            }

						fetchAzureOutlookContacts(authGraphToken).then(([response, success]) => {

							console.log(response);
							const azureContacts = response.value;

	            for(const azureContact of azureContacts) {

	              var hasNumber = azureContact.mobilePhone ? true : false;
	              if(hasNumber) {
									const firstName = azureContact.givenName ? azureContact.givenName : '';
									const lastName = azureContact.surname ? azureContact.surname : '';

									let fullName = firstName + ' ' + lastName;
									fullName = fullName.trim();

	                createBook[azureContact.id] = {
	                  'firstName' : firstName,
	                  'lastName' : lastName,
										'fullName' : fullName,
	                  'phoneNumber' :  azureContact.mobilePhone ? azureContact.mobilePhone : null,
	                  'imageAvailable' : false,
	                  'imageUri' : null,
	                  'contactType' : 'azureOutlook',
	                  'id' : azureContact.id ? azureContact.id : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)
	                }
	              }
	            }

							const contactBook = Object.values(createBook);
		            if (contactBook && contactBook.length){

		              dispatch(fetchContactsSuccess(contactBook));

		            } else {
		              dispatch(fetchContactsFailure())

		            }
						});


          });
        });

        });


  }
}

function fetchContacts() {
  const URL = "https://jsonplaceholder.typicode.com/posts";
  return fetch(URL, { method: 'GET'})
     .then( response => Promise.all([response, response.json()]));
}

async function fetchContactsPermission(authGraphToken){
  const { status } = await Permissions.askAsync(Permissions.CONTACTS);
  const bool = status==='granted' ? true : false;
  return Promise.all([status, bool, authGraphToken]);
}

async function fetchNativeContacts(permission, authGraphToken) {

    if(permission === 'granted'){
    const payload = await Contacts.getContactsAsync({
      fields: [
        Contacts.PHONE_NUMBERS,
        Contacts.IMAGE
      ],
    });
    const condition = payload ? true : false;
    const nativeContacts = payload.data;
    return Promise.all([nativeContacts, condition, authGraphToken]);
  } else {
    const condition = false;
    const nativeContacts = [];
    return Promise.all([nativeContacts, condition, authGraphToken]);
  }

}

function fetchAzureADContacts(authGraphToken) {
  if(authGraphToken) {
    return fetch('https://graph.microsoft.com/v1.0/users', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + authGraphToken,
        'Content-Type': 'application/json',
      },
    })
    .then( (response) => Promise.all([response.json(), false]))
    .catch( (error) => Promise.all([[], false]));
  } else {
    console.log('missing auth token');
    const response = [];
    const success = false;
    return Promise.all([response, success]);
  }

}


function fetchAzureOutlookContacts(authGraphToken) {
  if(authGraphToken) {
    return fetch('https://graph.microsoft.com/v1.0/me/contacts', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + authGraphToken,
        'Content-Type': 'application/json',
      },
    })
    .then( (response) => Promise.all([response.json(), false]))
    .catch( (error) => Promise.all([[], false]));
  } else {
    console.log('missing auth token');
    const response = [];
    const success = false;
    return Promise.all([response, success]);
  }

}

export const fetchContactsBegin = () => ({
  type: FETCH_CONTACTS_BEGIN
});

export const fetchContactsSuccess = contacts => ({
  type: FETCH_CONTACTS_SUCCESS,
  payload: { contacts }
});

export const fetchContactsFailure = error => ({
  type: FETCH_CONTACTS_FAILURE,
  payload: { error }
});

export const searchContactsQuery = query => ({
  type: SEARCH_CONTACTS_QUERY,
  query: query
});

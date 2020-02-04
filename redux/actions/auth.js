export const AUTHORISATION_FAILURE   = 'AUTHORISATION_FAILURE';
export const AUTHORISATION_REFRESH_START   = 'AUTHORISATION_REFRESH_START';
export const AUTHORISATION_REFRESH_FINISH   = 'AUTHORISATION_REFRESH_FINISH';

export const CHATABOX_INIT_API   = 'CHATABOX_INIT_API';
export const CHATABOX_INIT_API_FAILURE   = 'CHATABOX_INIT_API_FAILURE';
export const CHATABOX_API_SAVE_USER_SETTINGS   = 'CHATABOX_API_SAVE_USER_SETTINGS';
export const CHATABOX_API_FETCH_USER_CREDIT = 'CHATABOX_API_FETCH_USER_CREDIT';

export const CHATABOX_SUBSCRIBE_TO_SIGNALR = 'CHATABOX_SUBSCRIBE_TO_SIGNALR';
export const CHATABOX_UNSUBSCRIBE_FROM_SIGNALR = 'CHATABOX_UNSUBSCRIBE_FROM_SIGNALR';
export const CHATABOX_SIGNALR_NEW_SERVICE_MESSAGE = 'CHATABOX_SIGNALR_NEW_SERVICE_MESSAGE';
export const CHATABOX_SIGNALR_NEW_GENERAL_MESSAGE = 'CHATABOX_SIGNALR_NEW_GENERAL_MESSAGE';
export const CHATABOX_SIGNALR_SEEN_GENERAL_MESSAGE = 'CHATABOX_SIGNALR_SEEN_GENERAL_MESSAGE';
export const CHATABOX_SIGNALR_SEEN_SERVICE_MESSAGE = 'CHATABOX_SIGNALR_SEEN_SERVICE_MESSAGE';

export const PUSH_NOTIFICATIONS_REGISTERED = 'PUSH_NOTIFICATIONS_REGISTERED';
export const PUSH_NOTIFICATIONS_START = 'PUSH_NOTIFICATIONS_START';
export const PUSH_NOTIFICATIONS_STOP = 'PUSH_NOTIFICATIONS_STOP';

import signalr from 'react-native-signalr';

import AzureInstance from '../../components/azure-ad/lib/AzureInstance';
import Auth from '../../components/azure-ad/lib/Auth';

import { chataboxAppendNewMessage, chataboxMessageReceived } from './messages';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';

export function chataboxInitiate(authChataboxToken, userEmail) {
  return (dispatch) => {
    dispatch(chataboxInitApi());
    return chataboxLogin(authChataboxToken).then( ([response, responseJson]) => {
      console.log('----- ACCESSING CHATABOX API -----');
      console.log(response);
      if(response.status === 200){
          console.log('----- CHATABOX API AUTHORISED -----');
          return chataboxUserSettings(authChataboxToken).then( ([response, responseJson])  => {
            console.log('----- RETRIEVING USER SETTINGS -----');
            console.log(response);
            console.log(responseJson);
            const userPhoneNumber = responseJson.UniqueNumber ? responseJson.UniqueNumber : null;
            if(responseJson && response.status === 200){

              dispatch(chataboxSaveUserSettings(responseJson));
              dispatch(chataboxFetchUsableCredit(authChataboxToken));
              chataboxSignalRSubscribe(dispatch, authChataboxToken);

              return registerPushNotifications(authChataboxToken, userEmail).then (([response, token]) => {
                if(response.status === 204){
                  dispatch(pushNotificationsRegistered(token));
                }
              });



            } else {
              const error = responseJson.message ? responseJson.message : responseJson;
              console.log(error);
              dispatch(chataboxInitApiFailure(error));
            }

          });


      } else {
        const error = responseJson.message ? responseJson.message : responseJson;
        dispatch(chataboxInitApiFailure(error));
      }
    });
  }
}

export function chataboxFetchUsableCredit(authChataboxToken) {
  return (dispatch) => {
    if(!authChataboxToken){
      return;
    }

    return chataboxFetchUsableCreditApi(authChataboxToken).then(([response, responseJson]) => {
      if(response.status === 200){
        const credit = responseJson;
        dispatch(chataboxFetchUserCredit(credit));
      }
    });
  };
}

function chataboxFetchUsableCreditApi(authChataboxToken) {

  const URL = "https://api.chatabox.co.uk/getUsableCreditForUser";

		return fetch(URL, {
      method: 'GET',
      headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
        'Authorization': 'Bearer ' + authChataboxToken,
      },
    })
       .then( (response) => Promise.all([response, response.json()]))
       .catch( error => {
				 console.log(error);
				 return Promise.reject(error);
			 });
}
function chataboxUserSettings(authChataboxToken) {

  console.log('----- FETCH USER SETTINGS -----');

  const URL = 'https://api.chatabox.co.uk/getUserSettings';
  return fetch(URL, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + authChataboxToken,
      'Content-Type': 'application/json',
    },

  })
     .then( (response) => Promise.all([response, response.json()]))
     .catch( (error) => console.log('error'));

}

function chataboxLogin(authChataboxToken) {
  // move url to global store

  const URL = 'https://api.chatabox.co.uk/';
  return fetch(URL, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + authChataboxToken,
      'Content-Type': 'application/json',
    },

  })
     .then( (response) => Promise.all([response, response.json()]))
     .catch( (error) => Promise.all([null, error]));

}

export function chataboxSignalRRefresh(authChataboxToken, connection){
  return (dispatch) => {
    return chataboxSignalRSubscribe(dispatch, authChataboxToken, connection);
  }
}

function chataboxSignalRSubscribe(dispatch, authChataboxToken, existingConnection) {

      let connection;

      if(existingConnection) {
        connection = existingConnection;
      } else {
        connection = signalr.hubConnection('https://ws.chatabox.co.uk', {
          headers: {
            'Authorization': 'Bearer ' + authChataboxToken,
            'Content-Type': 'application/json',
          },
        });
      }
      connection.logging = true;

      const proxy = connection.createHubProxy('ClientHub');

      proxy.on('notifyClient', (notification) => {
        console.log(notification);
        if(notification.$type == 'Chata.Common.Objects.Notifications.StatusNotification, Chata.Common.Objects'){
          dispatch(chataboxSignalRHandleNewServiceMessage(notification));
        } else if(notification.$type == 'Chata.Common.Objects.Notifications.MessageNotification, Chata.Common.Objects'){
          dispatch(chataboxSignalRNewGeneralMessage(notification));
          dispatch(chataboxAppendNewMessage(notification));
          dispatch(chataboxSignalRSeenGeneralMessage());
        }
      });

    connection.start().done(() => {

      console.log('Now connected, connection ID=' + connection.id);

      const payload = {
        subscribe : true,
        connectionId : true,
        errorMessage : null
      };

      dispatch(chataboxSubscribeToSignalR(payload, connection));

    }).fail((error) => {

      console.log(error);
      const payload = {
        subscribe : false,
        connectionId : null,
        errorMessage : error
      };

      dispatch(chataboxSubscribeToSignalR(payload));

    });

  //connection handling
  connection.connectionSlow(() => {
    console.log('We are currently experiencing difficulties with the connection.')
  });

  connection.error((error) => {
    const errorMessage = error.message;
    let detailedError = '';
    if (error.source && error.source._response) {
      detailedError = error.source._response;
    }
    if (detailedError === 'An SSL error has occurred and a secure connection to the server cannot be made.') {
      console.log('When using react-native-signalr on ios with http remember to enable http in App Transport Security https://github.com/olofd/react-native-signalr/issues/14')
    }

    console.log('SignalR error: ' + errorMessage, detailedError)

    const payload = {
      subscribe : false,
      connectionId : null,
      errorMessage : detailedError ? detailedError : errorMessage
    };

    dispatch(chataboxSubscribeToSignalR(payload));

  });
}

export function chataboxSignalRUnsubscribe(connection) {
  return (dispatch) => {

    if(!connection){ return }
    console.log('dismantling signalr');
    console.log(connection);
    connection.stop();
    dispatch(chataboxUnsubscribeFromSignalR());
  };
}

function chataboxSignalRHandleNewServiceMessage(notification){
  return (dispatch) => {
    dispatch(chataboxSignalRNewServiceMessage(notification));
    dispatch(chataboxMessageReceived(notification));
  };
}




export function pushNotificationsStartWithRedux(authChataboxToken, userEmail, token) {
  return (dispatch) => {
      return pushNotificationsStartServer(authChataboxToken, userEmail, token).then (([response]) => {
        console.log(response);
        if(response.status === 200){
          dispatch(pushNotificationsStart());
        }
      });
  }
}

function pushNotificationsStartServer(authChataboxToken, userEmail, token) {
  const methodUrl = "https://api.chatabox.co.uk/StartPushing";
	const queryString ='?token=' + token + '&userEmail='+userEmail;
	const safeString = encodeURI(methodUrl + queryString);
  console.log(safeString);
  const URL = safeString;

		return fetch(URL, {
      method: 'POST',
      headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
        'Authorization': 'Bearer ' + authChataboxToken,
      },
    })
       .then( (response) => Promise.all([response]))
       .catch( error => {
				 console.log(error);
				 return Promise.reject(error);
			 });
}



export function pushNotificationsStopWithRedux(authChataboxToken, userEmail, token) {
  return (dispatch) => {
    console.log("STOPPING NOTIFICATIONS");
      return pushNotificationsStopServer(authChataboxToken, userEmail, token).then (([response]) => {
        if(response.status === 200){
          dispatch(pushNotificationsStop());
        }
      });
  }
}

function pushNotificationsStopServer(authChataboxToken, userEmail, token) {
  const methodUrl = "https://api.chatabox.co.uk/StopPushing";
	const queryString ='?token=' + token + '&userEmail='+userEmail + '&phone=""';
	const safeString = encodeURI(methodUrl + queryString);

  const URL = safeString;

		return fetch(URL, {
      method: 'POST',
      headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
        'Authorization': 'Bearer ' + authChataboxToken,
      },
    })
       .then( (response) => Promise.all([response]))
       .catch( error => {
				 console.log(error);
				 return Promise.reject(error);
			 });
}


async function registerPushNotifications(authChataboxToken, userEmail) {


  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  );
  let finalStatus = existingStatus;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== 'granted') {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  // Stop here if the user did not grant permissions
  if (finalStatus !== 'granted') {
    return;
  }

  console.log("registering push notifications");
  // Get the token that uniquely identifies this device
  let token = await Notifications.getExpoPushTokenAsync();

  if(!token || !userEmail || !authChataboxToken) {
    return;
  }

  console.log('pushing to server');

  const PUSH_ENDPOINT = 'https://api.chatabox.co.uk/ReceiveToken';

  const queryString ='?token=' + token + '&userEmail='+userEmail;
  console.log(queryString);
  const SAFE_ENDPOINT = encodeURI(PUSH_ENDPOINT + queryString);
  // post token to backend
  return fetch(SAFE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + authChataboxToken,
    },
  }).then( (response) => Promise.all([response, token]))
  .catch( error => {
    console.log(error);
    return Promise.reject(error);
  });

}



export function checkTokenExpiry(authChataboxToken, authRefreshToken, CREDENTIALS) {
  /* CHECK OAUTH TOKEN */
  console.log('----- CHECKING TOKEN EXPIRY -----');
  return (dispatch) => {
    return chataboxLogin(authChataboxToken).then( ([response, responseJson]) => {
    if(response.status === 401) {
      dispatch(refreshAuthorisationStart());
      return refreshAuthToken(authRefreshToken, CREDENTIALS).then(([payload]) => {
          console.log('----- CHECKING REPLY -----');
        console.log(payload);
        if(payload && payload.graphToken && payload.refreshToken && payload.chataboxToken){
          dispatch(refreshAuthorisationFinish(payload));
        } else {
          /* error handling */
          dispatch(authorisationFailure('Something went wrong with your account authorisation. Please try again later'));
        }
      });
    }
  });
  };
}

function refreshAuthToken(authRefreshToken, CREDENTIALS){
  if(!authRefreshToken || !CREDENTIALS) {
    return Promise.all([null]);
  }

  console.log('---- REFRESHING TOKEN -----');

  const azureInstance = new AzureInstance(CREDENTIALS);
  const authorise = new Auth(azureInstance);

  return authorise.getGraphTokenFromRefreshToken(authRefreshToken).then(token => {
    console.log('---- NEW GRAPH TOKEN -----');

      console.log(token);

        if(!token.refreshToken || !token.accessToken){
          return Promise.all([null]);
        }

				return authorise.getChataboxTokenFromRefreshToken(token).then(chataboxToken => {
          console.log('---- NEW CHATABOX TOKEN -----');

          console.log(chataboxToken);

          const graphToken = token.accessToken;
          const refreshToken = token.refreshToken;
          const getChataboxToken = chataboxToken.accessToken;

          const payload = {
            graphToken: graphToken,
            refreshToken: refreshToken,
            chataboxToken: getChataboxToken
          }

          return Promise.all([payload]);

				})
	})

}

export const login = (result) => {
    return {
        type: 'LOGIN',
        authGraphToken: result.graphToken,
        authRefreshToken: result.refreshToken,
        authChataboxToken: result.chataboxToken,
        email: result.mail,
        id: result.id,
        displayName: result.displayName,
        givenName: result.givenName
    };
};

export const logout = () => {
    return {
        type: 'LOGOUT'
    };
};

export const authorisationFailure = (error) => ({
    type: AUTHORISATION_FAILURE,
    error: error
});

export const refreshAuthorisationStart = () => ({
    type: AUTHORISATION_REFRESH_START,
});

export const refreshAuthorisationFinish = (payload) => ({
    type: AUTHORISATION_REFRESH_FINISH,
    payload: payload
});

export const chataboxInitApi = () => ({
    type: CHATABOX_INIT_API
});

export const chataboxSubscribeToSignalR = (payload, connection) => ({
    type: CHATABOX_SUBSCRIBE_TO_SIGNALR,
    subscribe: payload.subscribe,
    connectionId: payload.connectionId,
    error: payload.error,
    connection: connection
});

export const chataboxUnsubscribeFromSignalR = () => ({
    type: CHATABOX_UNSUBSCRIBE_FROM_SIGNALR,
});

export const chataboxSignalRNewServiceMessage = (payload) => ({
    type: CHATABOX_SIGNALR_NEW_SERVICE_MESSAGE,
    payload: payload
});

export const chataboxSignalRNewGeneralMessage = (payload) => ({
    type: CHATABOX_SIGNALR_NEW_GENERAL_MESSAGE,
    payload: payload
});

export const chataboxSignalRSeenGeneralMessage = () => ({
    type: CHATABOX_SIGNALR_SEEN_GENERAL_MESSAGE,
});

export const chataboxSignalRSeenServiceMessage = () => ({
    type: CHATABOX_SIGNALR_SEEN_SERVICE_MESSAGE,
});

export const chataboxSaveUserSettings = (result) => ({
    type: CHATABOX_API_SAVE_USER_SETTINGS,
    defaultCountryCode: result.DefaultCountryCode,
    userPhoneNumber: result.UniqueNumber,
    chataboxInit: true
});

export const chataboxFetchUserCredit = (credit) => ({
    type: CHATABOX_API_FETCH_USER_CREDIT,
    credit: credit,
});


export const chataboxInitApiFailure = (error) => ({
    type: CHATABOX_INIT_API_FAILURE,
    error: error
});

export const pushNotificationsRegistered = (token) => ({
  type: PUSH_NOTIFICATIONS_REGISTERED,
  token: token
});

export const pushNotificationsStart = () => ({
  type: PUSH_NOTIFICATIONS_START,
});

export const pushNotificationsStop = () => ({
  type: PUSH_NOTIFICATIONS_STOP,
});

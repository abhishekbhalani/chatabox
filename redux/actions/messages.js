export const CHATABOX_FETCH_MESSAGES_BEGIN = 'CHATABOX_FETCH_MESSAGES_BEGIN';
export const CHATABOX_FETCH_MESSAGES_SUCCESS = 'CHATABOX_FETCH_MESSAGES_SUCCESS';
export const CHATABOX_FETCH_MESSAGES_FAILURE = 'CHATABOX_FETCH_MESSAGES_FAILURE';
export const CHATABOX_FETCH_MESSAGES_BEGIN_POLLING = 'CHATABOX_FETCH_MESSAGES_BEGIN_POLLING';

export const CHATABOX_SEND_MESSAGE_BEGIN = 'CHATABOX_SEND_MESSAGE_BEGIN';
export const CHATABOX_SEND_MESSAGE_SUCCESS = 'CHATABOX_SEND_MESSAGE_SUCCESS';
export const CHATABOX_SEND_MESSAGE_FAILURE = 'CHATABOX_SEND_MESSAGE_FAILURE';

export const CHATABOX_APPEND_NEW_MESSAGE = 'CHATABOX_APPEND_NEW_MESSAGE';
export const CHATABOX_UPDATE_LAST_SEEN = 'CHATABOX_UPDATE_LAST_SEEN';

export const CHATABOX_CREATE_ROOM_BEGIN = 'CHATABOX_CREATE_ROOM_BEGIN';
export const CHATABOX_CREATE_ROOM_SUCCESS = 'CHATABOX_CREATE_ROOM_SUCCESS';
export const CHATABOX_CREATE_ROOM_FAILURE = 'CHATABOX_CREATE_ROOM_FAILURE';

export const CHATABOX_ACTIVE_ROOM_ID = 'CHATABOX_ACTIVE_ROOM_ID';
export const CHATABOX_ACTIVE_ROOM_MESSAGES = 'CHATABOX_ACTIVE_ROOM_MESSAGES';
export const CHATABOX_ACTIVE_ROOM_LOAD_MORE_MESSAGES = 'CHATABOX_ACTIVE_ROOM_LOAD_MORE_MESSAGES';
export const CHATABOX_CLEAR_ROOM = 'CHATABOX_CLEAR_ROOM';
export const CHATABOX_ACTIVE_ROOM_APPEND_MESSAGE = 'CHATABOX_ACTIVE_ROOM_APPEND_MESSAGE';
export const CHATABOX_ACTIVE_ROOM_MESSAGE_RECEIVED = 'CHATABOX_ACTIVE_ROOM_MESSAGE_RECEIVED';

export const CHATABOX_NEW_ROOM_CREATE_TAG = 'CHATABOX_NEW_ROOM_CREATE_TAG';
export const CHATABOX_NEW_ROOM_DELETE_ALL_TAGS = 'CHATABOX_NEW_ROOM_DELETE_ALL_TAGS';
export const CHATABOX_NEW_ROOM_DELETE_TAG = 'CHATABOX_NEW_ROOM_DELETE_TAG';
export const CHATABOX_NEW_ROOM_EXTERNAL_TAG = 'CHATABOX_NEW_ROOM_EXTERNAL_TAG';

export function fetchMessagesWithRedux(authChataboxToken, polling, triggerLoader) {
	return (dispatch) => {

		if(!triggerLoader){
  		dispatch(chataboxFetchMessagesBegin());
		}

    return fetchMessages(authChataboxToken).then(([status, responseJson]) => {
        if(responseJson && status === 200){

					const response = [];

					// kill broken rooms
					for (const room of responseJson) {
						if (room.Id !== undefined && room.Id !== ''){
							response.push(room);
						}
					}

					// order by timestamp
					response.sort(function(a, b) {
							const a_timestamp = a.Messages.$values[0] === undefined ? '' : a.Messages.$values[a.Messages.$values.length-1].TimeStamp;
							const b_timestamp = b.Messages.$values[0] === undefined ? '' :  b.Messages.$values[b.Messages.$values.length-1].TimeStamp;
					    a = new Date(a_timestamp);
					    b = new Date(b_timestamp);

					    return a>b ? -1 : a<b ? 1 : 0;
					});


          dispatch(chataboxFetchMessagesSuccess(response));


        } else {
          const error = responseJson.message ? responseJson.message : responseJson;
          console.log(error);
          dispatch(chataboxFetchMessagesFailure(error));
        }
    }).catch((error) => {
     dispatch(chataboxFetchMessagesFailure(error));
	 });



  }
}

function fetchMessages(authChataboxToken) {

    const URL = 'https://api.chatabox.co.uk/getRooms';
    return fetch(URL, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + authChataboxToken,
        'Content-Type': 'application/json',
      },

    }).then((response) => response.json())
	    .then((responseJson) => {
	      return Promise.all([200, responseJson]);
	    })
	    .catch((error) => {
	      return Promise.reject(error);
	    });

}



export function sendMessageWithRedux(message, roomId, authChataboxToken, newRoom) {
	return (dispatch) => {
		const roomID = parseInt(roomId, 10);

		var sendDate = new Date();  // for example

		// the number of .net ticks at the unix epoch
		var epochTicks = 621355968000000000;

		// there are 10000 .net ticks per millisecond
		var ticksPerMillisecond = 10000;

		// calculate the total number of .net ticks for your date
		var sendTicks = epochTicks + (sendDate.getTime() * ticksPerMillisecond);

  	dispatch(chataboxSendMessageBegin());
		if(roomID && message) {

			if(newRoom){
				const roomData = {
					roomId: roomId,
					userName: null,
					userId: null,
					participantName: null
				}

				dispatch(chataboxActiveRoomId(roomData));
			}

	    return sendMessage(message, roomID, authChataboxToken).then(([response, responseJson]) => {


	        if(responseJson && response.status === 200){
						return checkServiceMessage(sendTicks, authChataboxToken).then(([response, responseJson]) => {
							//Check the received service message for SMS status

							dispatch(chataboxAppendNewMessage(responseJson[0]));
							console.log('SENDING MESSAGE CHECK');
							console.log(responseJson[0]);
							if(responseJson && response.status === 200){

								const serviceStatus = responseJson[0] && responseJson[0].ServiceMessages.$values.length ? responseJson[0].ServiceMessages.$values[0].status===-1 ? false : true : true;
								if(serviceStatus){
									dispatch(chataboxSendMessageSuccess(message));

								} else {
									const serviceErrorMessage = responseJson[0] ? responseJson[0].ServiceMessages.$values[0].ErrorMessage : 'Something went wrong, please try again later';
									console.log(serviceErrorMessage);
									dispatch(chataboxSendMessageFailure(error));
								}
							} else {
								const error = responseJson.message ? responseJson.message : responseJson;
								dispatch(chataboxSendMessageFailure(error));
							}
							const error = responseJson
						});

	        } else {
	          const error = responseJson.message ? responseJson.message : responseJson;
	          dispatch(chataboxSendMessageFailure(error));
	        }
	    });
		} else {
			dispatch(chataboxSendMessageFailure('Please supply room id and message'));
		}

  }
}


function sendMessage(message, roomId, authChataboxToken) {
		const sendRoomId = roomId ? parseInt(roomId) : '';
		const sendMessage = message ? message : message;
		const methodUrl = "https://api.chatabox.co.uk/queueMessage";
		const queryString = '?roomId=' + sendRoomId + '&text=' + sendMessage;
		const safeString = encodeURI(methodUrl + queryString);
    const URL = safeString;
    return fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authChataboxToken,
        'Content-Type': 'application/json',
      },
    })
       .then( (response) => Promise.all([response, response.json()]))
       .catch( (error) => Promise.all([null, error]));

}


function checkServiceMessage(sendTime, authChataboxToken) {
		const methodUrl = "https://api.chatabox.co.uk/getRoomMessages";
		const queryString = '?from=' + sendTime;
		const safeString = encodeURI(methodUrl + queryString);
    const URL = safeString;
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



export function createRoomWithRedux(name, contactUri, phoneNumber, messageText, userEmail, authChataboxToken) {
	return (dispatch) => {

		//Beginning to create room
  	dispatch(chataboxCreateRoomBegin());

		//check if all user data supplied
		if(name && contactUri && phoneNumber && authChataboxToken) {
	    return createRoom(name, contactUri, phoneNumber, authChataboxToken).then(([response, responseJson]) => {

					//Check json response and if we got a room ID
	        if(responseJson && response.status === 200){

						const roomId = parseInt(responseJson);
						const message = messageText && !messageText.trim() !== '' ? messageText : null;

						const temporaryRoom = {
							Id: roomId,
							Dedicated: false,
							CreatorEmail: userEmail,
							LastSeen: null,
							Messages: {
								$values: [

								]
							},
							Participants: {
								$values: [
									{
										Id: 'tempId_'+Date.now(),
										Name: name,
										Room: {},
										RoomId: roomId,
										Type: 0
									}
								]
							}
						}


						//finish creating room
	          dispatch(chataboxCreateRoomSuccess(temporaryRoom,roomId));

						//send message with new room id
						return dispatch(sendMessageWithRedux(message, roomId, authChataboxToken, true));

	        } else {

						//Didn't get a room ID from Chata api

	          dispatch(chataboxCreateRoomFailure('Failed to create room'));
	        }
	    });
		} else {

			//Not all user data supplied
			dispatch(chataboxCreateRoomFailure('Please supply correct info'));
		}

  }
}


function createRoom(name, contactUri, phoneNumber, authChataboxToken) {

	const participant = [
		{
		"$type": "Chata.Common.Objects.Internal.Participant.S4BPhoneNumberParticipant, Chata.Common.Objects",
		"Name": name,
		"ContactUri": contactUri,
		"PhoneNumber": phoneNumber,
		}
	];
	const requestBody = JSON.stringify(participant);

	const methodUrl = "https://api.chatabox.co.uk/createRoom";
	const queryString ='?dedicated=false';
	const safeString = encodeURI(methodUrl + queryString);

  const URL = safeString;

		return fetch(URL, {
      method: 'POST',
      headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
        'Authorization': 'Bearer ' + authChataboxToken,
      },
			body: requestBody
    })
       .then( (response) => Promise.all([response, response.json()]))
       .catch( error => {
				 console.log(error);
				 return Promise.reject(error);
			 });

}


export function updateLastSeenWithRedux(roomId, lastSeenId, authChataboxToken) {

	return (dispatch) => {


		//check if all user data supplied
		if(!roomId || !lastSeenId || !authChataboxToken){
			return;
		}

			return updateLastSeen(roomId, lastSeenId, authChataboxToken).then(([response]) => {

					if(response.status === 204){

						const payload = {
								roomId: roomId,
								lastSeen: lastSeenId
						};

						dispatch(chataboxUpdateLastSeen(payload));

					} else {
						return;
					}

			});


	}

}

function updateLastSeen(roomId, lastSeenId, authChataboxToken){

	const methodUrl = "https://api.chatabox.co.uk/updateLastSeen";
	const queryString ='?roomId=' + roomId + '&lastSeen='+lastSeenId;
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


export function chataboxActiveRoomOpen(roomData) {
	return (dispatch) => {

		/* clear any current room */
		dispatch(chataboxClearRoom());

		/* activate new room */
		dispatch(chataboxActiveRoomId(roomData));

		/* fetch and generate room messages */
		dispatch(chataboxActiveRoomMessages(roomData.roomId));

	}
}

export function chataboxActiveRoomLoadMore() {
	return (dispatch) => {

		/* THIS KEEPS FIRING, NEED TO FIX */
		dispatch(chataboxActiveRoomLoadMoreMessages());
		dispatch(chataboxActiveRoomMessages());
	}
}

export function chataboxMessageReceived(notification) {
	return (dispatch) => {
		dispatch(chataboxActiveRoomMessageReceived(notification));
	}
}
export const chataboxFetchMessagesBegin = () => ({
  type: CHATABOX_FETCH_MESSAGES_BEGIN
});

export const chataboxFetchMessagesSuccess = (messages) => ({
  type: CHATABOX_FETCH_MESSAGES_SUCCESS,
  payload: { messages }
});

export const chataboxFetchMessagesFailure = (error) => ({
  type: CHATABOX_FETCH_MESSAGES_FAILURE,
  payload: { error }
});

export const chataboxFetchMessagesPollingBegin = () => ({
	type: CHATABOX_FETCH_MESSAGES_BEGIN_POLLING
});

export const chataboxSendMessageBegin = () => ({
  type: CHATABOX_SEND_MESSAGE_BEGIN
});

export const chataboxSendMessageSuccess = (message) => ({
  type: CHATABOX_SEND_MESSAGE_SUCCESS,
  payload: { message }
});

export const chataboxSendMessageFailure = (error) => ({
  type: CHATABOX_SEND_MESSAGE_FAILURE,
  payload: { error }
});



export const chataboxAppendNewMessage = (message) => ({
  type: CHATABOX_APPEND_NEW_MESSAGE,
  payload: { message }
});

export const chataboxUpdateLastSeen = (data) => ({
  type: CHATABOX_UPDATE_LAST_SEEN,
  payload: { data }
});


export const chataboxCreateRoomBegin = () => ({
  type: CHATABOX_CREATE_ROOM_BEGIN
});

export const chataboxCreateRoomSuccess = (tempRoom, roomId) => ({
  type: CHATABOX_CREATE_ROOM_SUCCESS,
  tempRoom: tempRoom,
	roomId: roomId
});

export const chataboxCreateRoomFailure = (error) => ({
  type: CHATABOX_CREATE_ROOM_FAILURE,
  payload: { error }
});


/* active room & messages actions */

/* initiate room by providing ID */
export const chataboxActiveRoomId = ( payload ) => ({
	type: CHATABOX_ACTIVE_ROOM_ID,
	payload: payload
});

/* convert messages to gifted chat format and display paginated */
export const chataboxActiveRoomMessages = (roomId ) => ({
	type: CHATABOX_ACTIVE_ROOM_MESSAGES,
	roomId: roomId
});

export const chataboxActiveRoomAppendMessage = ( messages ) => ({
	type: CHATABOX_ACTIVE_ROOM_APPEND_MESSAGE,
	messages: messages
});

export const chataboxActiveRoomMessageReceived = ( notification ) => ({
	type: CHATABOX_ACTIVE_ROOM_MESSAGE_RECEIVED,
	payload: notification
})
/* increment pagination by 1 */
export const chataboxActiveRoomLoadMoreMessages = ( ) => ({
	type: CHATABOX_ACTIVE_ROOM_LOAD_MORE_MESSAGES,
});

/* kill room & clear messages */
export const chataboxClearRoom = ( ) => ({
	type: CHATABOX_CLEAR_ROOM,
});


export const chataboxCreateNewTag = (tag) => ({
	type: CHATABOX_NEW_ROOM_CREATE_TAG,
	payload: tag
});

export const chataboxExternalTag = (flag) => ({
	type: CHATABOX_NEW_ROOM_EXTERNAL_TAG,
	flag: flag
});

export const chataboxDeleteAllTags = () => ({
	type: CHATABOX_NEW_ROOM_DELETE_ALL_TAGS,
});

export const chataboxDeleteTag = (tagNumber) => ({
	type: CHATABOX_NEW_ROOM_DELETE_TAG,
	tagNumber: tagNumber
});

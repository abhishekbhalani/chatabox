import {
  CHATABOX_FETCH_MESSAGES_BEGIN,
  CHATABOX_FETCH_MESSAGES_SUCCESS,
  CHATABOX_FETCH_MESSAGES_FAILURE,
  CHATABOX_FETCH_MESSAGES_BEGIN_POLLING,
  CHATABOX_SEND_MESSAGE_BEGIN,
  CHATABOX_SEND_MESSAGE_SUCCESS,
  CHATABOX_SEND_MESSAGE_FAILURE,
  CHATABOX_APPEND_NEW_MESSAGE,
  CHATABOX_UPDATE_LAST_SEEN,
  CHATABOX_CREATE_ROOM_BEGIN,
  CHATABOX_CREATE_ROOM_SUCCESS,
  CHATABOX_CREATE_ROOM_FAILURE,
  CHATABOX_ACTIVE_ROOM_ID,
  CHATABOX_ACTIVE_ROOM_MESSAGES,
  CHATABOX_ACTIVE_ROOM_LOAD_MORE_MESSAGES,
  CHATABOX_CLEAR_ROOM,
  CHATABOX_ACTIVE_ROOM_APPEND_MESSAGE,
  CHATABOX_NEW_ROOM_CREATE_TAG,
  CHATABOX_NEW_ROOM_DELETE_ALL_TAGS,
  CHATABOX_NEW_ROOM_DELETE_TAG,
  CHATABOX_NEW_ROOM_EXTERNAL_TAG,
  CHATABOX_ACTIVE_ROOM_MESSAGE_RECEIVED
} from '../actions/messages';

const initialState = {
  messages: [],
  messageRefresh: true,
  fetchMessagesPolling: false,
  activeRoomId: null,
  activeRoomMessages: [],
  activeRoomMessagesPage: 1,
  activeRoomLoading: false,
  activeRoomUserId: null,
  activeRoomUserName: null,
  activeRoomParticipantId: null,
  activeRoomParticipantGivenName: null,
  activeRoomParticipantName: null,
  activeRoomMessagesIncrement: 18,
  newRoomTags: [],
  newRoomExternalTags: false,
  query: '',
  loading: false,
  error: null,
  roomId: null
};

export default function reducer(state = initialState, action) {
  switch(action.type) {
    case CHATABOX_FETCH_MESSAGES_BEGIN:
      return {
        ...state,
        loading: true,
        error: null
      };

    case CHATABOX_FETCH_MESSAGES_SUCCESS:
      return {
        ...state,
        loading: false,
        messageRefresh: false,
        messages: action.payload.messages
      };

    case CHATABOX_FETCH_MESSAGES_BEGIN_POLLING:
      return {
        ...state,
        fetchMessagesPolling: true
      };
    case CHATABOX_FETCH_MESSAGES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
      };

      case CHATABOX_APPEND_NEW_MESSAGE:

        const index = state.messages.findIndex(x => x.Id==action.payload.message.RoomId);
        let messages = [...state.messages];



        if(index !== -1){
          const checkArray = messages[index].Messages.$values.findIndex(x => x.Id == action.payload.message.Id);
          if (checkArray === -1){
            messages[index].Messages.$values.push(action.payload.message);

            const temp = messages[index];
            messages[index] = messages[0];
            messages[0] = temp;

          }
        }
        return {...state, messages};

        case CHATABOX_UPDATE_LAST_SEEN:

          const findId = action.payload.data.roomId;
          const findIndex = state.messages.findIndex(x => x.Id==findId);
          messages = [...state.messages];
          if(findIndex !== -1){
            messages[findIndex].LastSeen = action.payload.data.lastSeen;
          }

          return {...state, messages};

      case CHATABOX_SEND_MESSAGE_BEGIN:
        return {
          ...state,
          loading: true,
          error: null
        };

      case CHATABOX_SEND_MESSAGE_SUCCESS:
        return {
          ...state,
          activeRoomLoading: false,
          loading: false,
        };

      case CHATABOX_SEND_MESSAGE_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload.error,
        };

      case CHATABOX_CREATE_ROOM_BEGIN:
        return {
          ...state,
          loading: true,
          error: null
        };

      case CHATABOX_CREATE_ROOM_SUCCESS:

        let currentMessages = [...state.messages];
        currentMessages.push(action.tempRoom);

        return {...state,
        activeRoomLoading: false,
        messages: currentMessages,
        roomId: action.roomId};


      case CHATABOX_CREATE_ROOM_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload.error,
        };

      case CHATABOX_ACTIVE_ROOM_ID:
        return {
          ...state,
          activeRoomId: action.payload.roomId,
          activeRoomUserId: action.payload.userId ? action.payload.userId : state.activeRoomUserId,
          activeRoomUserName: action.payload.userName,
          activeRoomParticipantGivenName: action.payload.participantName,
          activeRoomLoading: true
        };

      case CHATABOX_ACTIVE_ROOM_MESSAGES:

        const givenRoom = state.activeRoomId;
        const stateRooms = [...state.messages];


        if(!givenRoom){
          return{
            ...state,
            loading: false,
            activeRoomLoading: false
          }
        }

        const thisRoom = stateRooms.filter(obj => {
          return obj.Id === givenRoom;
        })

        if(!thisRoom.length){
          return{
            ...state,
            loading: false,
            activeRoomLoading: false
          }
        }

        /* the user */
        const userName = state.activeRoomUserName;
        const userId = state.activeRoomUserId;

        /* messages */
        const roomMessages = thisRoom[0].Messages.$values;

        /* recipients */

        /* ---- participant data passed in navigation, incase different name in contacts --- */
        const givenParticipantName = state.activeRoomParticipantGivenName;

        /* ---- participant data saved in room --- */
        const participants = thisRoom[0].Participants.$values.length > 0 ? true : false;
        const participantSavedName = participants ? thisRoom[0].Participants.$values[0].Name : userName;

        const participantName = givenParticipantName ? givenParticipantName : participantSavedName


        const participantId = participants ? thisRoom[0].Participants.$values[0].Id : userId + '1234567';
        const avatar = participantName.replace('+', '').match(/^\d/) ? require('../../assets/images/chatabox-blank-avatar.png') : "";

        /* how many messages to show per page */
        const limit = state.activeRoomMessagesPage * state.activeRoomMessagesIncrement;

        const messagesArray = [];

        if(roomMessages.length){
          for (const message of roomMessages ) {


            let received = false;
            let sent = false;

            if(message.ServiceMessages.$values.length){
              received = message.ServiceMessages.$values[0].Status === 30 ? true : false
              sent = message.ServiceMessages.$values[0].Status === 30 || message.ServiceMessages.$values[0].Status === 20 ? true : false
            } else {
              received = false;
              sent = false;
            }

            let msg =  {
              _id: String(message.Id),
              text: message.Text,
              sent: sent,
              received: received,
              createdAt: message.TimeStamp,
              user: {
                _id: message.Direction === -10 ? String(participantId) : String(userId),
                name: message.Direction === -10 ? String(participantName) : String(userName),
                avatar: avatar
              }
            }




            messagesArray.push(msg);

          }
        }

        const reverseArray = messagesArray.reverse();
        const limitedArray = reverseArray.slice(0,limit);

        return {
          ...state,
          activeRoomMessages: limitedArray.length ? limitedArray : [],
          activeRoomParticipantId: participantId,
          activeRoomParticipantName: givenParticipantName,
          loading: false,
          activeRoomLoading: false
        };

        case CHATABOX_ACTIVE_ROOM_APPEND_MESSAGE:
          let activeMessages = [...state.activeRoomMessages];
          const newMessages = action.messages;
          newMessages.forEach(function(message) {

            const checkArray = activeMessages.findIndex(x => x._id == message._id);

            if(checkArray !== -1){
              return { ...state };
            } else {
              activeMessages.unshift(message);
            }


          });

          return{
            ...state,
            activeRoomMessages: activeMessages,
            loading: false
          }
        case CHATABOX_ACTIVE_ROOM_LOAD_MORE_MESSAGES:
        let currentPage = state.activeRoomMessagesPage;
        currentPage++;
          return {
            ...state,
            loading: true,
            activeRoomMessagesPage: currentPage
          };

        case CHATABOX_ACTIVE_ROOM_MESSAGE_RECEIVED:

        let activeRoomMsgs = [...state.activeRoomMessages];

        const notification = action.payload;

        const status = notification.Status;
        const messageId = notification.RoomMessageId;
        const room = notification.RoomId;

        let sent = false;
        let received = false;
        let error = false;

        if(room === state.activeRoomId && messageId) {

          switch(status) {
             case -1: {
                sent = false;
                received = false;
                error = true;
                break;
             }
             case 20: {
               sent = true;
               received = false;
               error = false;
                break;
             }
             case 30: {
               sent = true;
               received = true;
               error = false;
                break;
             }
             default: {
                sent = false;
                received = false;
                error = false;
                break;
             }
           }


          activeRoomMsgs[0].received = received;
          activeRoomMsgs[0].sent = sent;
          activeRoomMsgs[0].error = error;


        } else {
          return{
            ...state
          }
        }


        return {
            ...state,
            activeRoomMessages: activeRoomMsgs
        };

        case CHATABOX_CLEAR_ROOM:
          return {
            ...state,
            activeRoomId: null,
            activeRoomMessages: [],
            activeRoomMessagesPage: 1,
            activeRoomUserId: null,
            activeRoomUserName: null,
            activeRoomParticipantId: null,
            activeRoomParticipantName: null,
          };

       case CHATABOX_NEW_ROOM_CREATE_TAG:
       if(!action.payload.length){
         return;
       }
       const tags = [...state.newRoomTags];
       tags.push(action.payload[0]);
       return{
         ...state,
         newRoomTags: tags
       }

       case CHATABOX_NEW_ROOM_EXTERNAL_TAG:
       return{
         ...state,
         newRoomExternalTags: action.flag
       }
       case CHATABOX_NEW_ROOM_DELETE_ALL_TAGS:

       return{
         ...state,
         newRoomTags: []
       }

       case CHATABOX_NEW_ROOM_DELETE_TAG:
       if(!action.tagNumber){
         return{
           ...state
         }
       }

       let allTags = [...state.newRoomTags];

       const tagIndex = allTags.findIndex(x => x.number == action.tagNumber);

       if(tagIndex === -1){
         return{
           ...state
         }
       }

       allTags.splice(tagIndex, 1);

       return{
         ...state,
         newRoomTags: allTags
       }

    default:

      return state;
  }
}

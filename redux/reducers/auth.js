import {
  AUTHORISATION_FAILURE,
  AUTHORISATION_REFRESH_START,
  AUTHORISATION_REFRESH_FINISH,
  CHATABOX_API_SAVE_USER_SETTINGS,
  CHATABOX_API_FETCH_USER_CREDIT,
  CHATABOX_INIT_API_FAILURE,
  CHATABOX_INIT_API,
  CHATABOX_SUBSCRIBE_TO_SIGNALR,
  CHATABOX_UNSUBSCRIBE_FROM_SIGNALR,
  CHATABOX_SIGNALR_NEW_SERVICE_MESSAGE,
  CHATABOX_SIGNALR_NEW_GENERAL_MESSAGE,
  CHATABOX_SIGNALR_SEEN_GENERAL_MESSAGE,
  CHATABOX_SIGNALR_SEEN_SERVICE_MESSAGE,
  PUSH_NOTIFICATIONS_REGISTERED,
  PUSH_NOTIFICATIONS_START,
  PUSH_NOTIFICATIONS_STOP

} from '../actions/auth';

const CREDENTIALS = {
      client_id: '3e5fc2fb-450e-44c8-b151-feb43fc50bea',
      client_secret: 'gE1OFcyDQtSbHdo2tdhs7to/zCXNJV3addGDZXvr2uY=',
      scope: 'https://chatabox365.onmicrosoft.com/ChataAPI/user_impersonation User.ReadBasic.All offline_access Contacts.Read Contacts.ReadWrite'
};

const defaultState = {
    authCredentials: CREDENTIALS,
    isLoggedIn: false,
    authGraphToken: '',
    authChataboxToken: '',
    email: '',
    displayName: '',
    givenName: '',
    defaultCountryCode: null,
    userPhoneNumber: null,
    userUsableCredit: null,
    chataboxInitiated: false,
    error: null,
    signalRSubscribed: false,
    signalRError: null,
    signalRConnectionId: null,
    signalRServiceMessages: [],
    signalRNewServiceMessage: false,
    signalRGeneralMessages: [],
    signalRConnection: null,
    signalRNewGeneralMessage: false,
    pushNotificationsRegistered: false,
    pushNotificationsToken: null,
    pushNotificationsStatus: false
};

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case 'LOGIN':
            return Object.assign({}, state, {
                isLoggedIn: true,
                authGraphToken: action.authGraphToken,
                authChataboxToken: action.authChataboxToken,
                authRefreshToken: action.authRefreshToken,
                email: action.email,
                id: action.id,
                displayName: action.displayName,
                givenName: action.givenName
            });
        case 'LOGOUT':
            return Object.assign({}, state, {
              isLoggedIn: false,
              authGraphToken: '',
              authChataboxToken: '',
              authRefreshToken: '',
              email: '',
              displayName: '',
              givenName: '',
              defaultCountryCode: '',
              chataboxInitiated: false,
              error: null,
              signalRSubscribed: false,
              signalRError: null,
              signalRConnectionId: null,
              signalRServiceMessages: [],
              signalRNewServiceMessage: false,
              signalRGeneralMessages: [],
              signalRNewGeneralMessage: false
            });

        case AUTHORISATION_FAILURE:
            return Object.assign({}, state, {
              error: action.error
            });

        case AUTHORISATION_REFRESH_START:
            return Object.assign({}, state, {
            });

        case AUTHORISATION_REFRESH_FINISH:
            return Object.assign({}, state, {
              authGraphToken: action.payload.graphToken,
              authRefreshToken: action.payload.refreshToken,
              authChataboxToken: action.payload.chataboxToken
            });

        case CHATABOX_INIT_API:
            return Object.assign({}, state, {
              error: null
            });
        case CHATABOX_API_SAVE_USER_SETTINGS:
            return Object.assign({}, state, {
                defaultCountryCode: action.defaultCountryCode,
                userPhoneNumber: action.userPhoneNumber,
                chataboxInitiated: action.chataboxInit
            });
        case CHATABOX_API_FETCH_USER_CREDIT:
            return Object.assign({}, state, {
                userUsableCredit: action.credit
            });
        case CHATABOX_INIT_API_FAILURE:
            return Object.assign({}, state, {
              error: action.error
            });

        case CHATABOX_SUBSCRIBE_TO_SIGNALR:
          return Object.assign({}, state, {
            signalRSubscribed: action.subscribe,
            signalRError: action.errorMessage,
            signalRConnectionId: action.connectionId,
            signalRConnection: action.connection
          });

        case CHATABOX_UNSUBSCRIBE_FROM_SIGNALR:
          return Object.assign({}, state, {
            signalRSubscribed: false,
            signalRError: null,
            signalRConnectionId: null,
            signalRConnection: null,
          });

        case CHATABOX_SIGNALR_NEW_SERVICE_MESSAGE:
        let messages = [...state.signalRServiceMessages];
        messages.push(action.payload);
          return Object.assign({}, state, {
            signalRServiceMessages: messages,
            signalRNewServiceMessage: true
          });

        case CHATABOX_SIGNALR_NEW_GENERAL_MESSAGE:
        let generalMessages = [...state.signalRGeneralMessages];
        let newMessage = action.payload;
        newMessage['Id'] = newMessage.RoomMessageId;
        newMessage['ServiceMessages'] = {$values:[]};
        newMessage['Direction'] = -10;
        generalMessages.push(action.payload);
          return Object.assign({}, state, {
            signalRGeneralMessages: generalMessages,
            signalRNewGeneralMessage: true
          });

      case CHATABOX_SIGNALR_SEEN_GENERAL_MESSAGE:
        return Object.assign({}, state, {
          signalRNewGeneralMessage: false,
          signalRGeneralMessages: []
        });

        case CHATABOX_SIGNALR_SEEN_SERVICE_MESSAGE:
          return Object.assign({}, state, {
            signalRNewServiceMessage: false,
            signalRServiceMessages: []
          });

      case PUSH_NOTIFICATIONS_REGISTERED:
        return Object.assign({}, state, {
            pushNotificationsRegistered: true,
            pushNotificationsToken: action.token
        });

        case PUSH_NOTIFICATIONS_START:
          return Object.assign({}, state, {
              pushNotificationsStatus: true
          });

          case PUSH_NOTIFICATIONS_STOP:
            return Object.assign({}, state, {
                pushNotificationsStatus: false
            });

        default:
            return state;
    }
}

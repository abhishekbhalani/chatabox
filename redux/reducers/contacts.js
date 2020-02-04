import {
  FETCH_CONTACTS_BEGIN,
  FETCH_CONTACTS_SUCCESS,
  FETCH_CONTACTS_FAILURE,
  SEARCH_CONTACTS_QUERY
} from '../actions/contacts';

const initialState = {
  contactBook: [],
  contactsRefresh: true,
  query: '',
  loading: false,
  error: null
};

export default function reducer(state = initialState, action) {
  switch(action.type) {
    case FETCH_CONTACTS_BEGIN:
      return {
        ...state,
        loading: true,
        error: null
      };

    case FETCH_CONTACTS_SUCCESS:
      return {
        ...state,
        loading: false,
        contactBook: action.payload.contacts,
        contactRefresh: false
      };

    case FETCH_CONTACTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        contactRefresh: false,
        contactBook: []
      };

    case SEARCH_CONTACTS_QUERY:

      return {
        ...state,
        query: action.query
      }

    default:

      return state;
  }
}

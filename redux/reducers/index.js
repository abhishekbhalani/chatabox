import { combineReducers } from 'redux';
import auth from './auth';
import contacts from './contacts';
import messages from './messages';

const appReducer = combineReducers({
  auth: auth,
  contacts: contacts,
  messages: messages
})


const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = undefined
  }

  return appReducer(state, action)
}



export default rootReducer;

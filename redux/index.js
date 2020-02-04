import { createStore, applyMiddleware } from 'redux';
import  { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer from './reducers';


const logger = createLogger();

export default (initialState = {}) => (
  createStore(
    rootReducer,
    initialState,
    applyMiddleware(thunk, logger),
  )
);
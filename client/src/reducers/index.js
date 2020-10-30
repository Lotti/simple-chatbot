import { combineReducers } from 'redux';
import messages from './messages';
import events from './events';

export default combineReducers({
  messages,
  events,
});

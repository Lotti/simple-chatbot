import * as actions from '../constants/ActionTypes';

const initialState = {
  text: '',
  textAreaReference: null,
  chatArea: null,
};

export default function events(state = initialState, action) {
  switch (action.type) {
    default:
      return state;
    case actions.SET_TEXT:
      return {...state, text: action.text};
    case actions.SET_FOCUS:
      return {...state, textAreaReference: action.reference};
    case actions.GET_FOCUS:
      if (state.textAreaReference && state.textAreaReference.current) {
        state.textAreaReference.current.focus();
      }
      return state;
    case actions.SET_SCROLL:
      return {...state, chatArea: action.reference};
    case actions.SCROLL_TO_BOTTOM:
      if (state.chatArea && state.chatArea.current) {
        state.chatArea.current.scrollTop = state.chatArea.current.scrollHeight;
      }
      return state;
  }
}

import * as actions from '../constants/ActionTypes';

const initialState = {
    textAreaReference: null,
    chatArea: null,
};

export default function events(state = initialState, action) {
    switch (action.type) {
        default:
            return state;
        case actions.SET_FOCUS:
            return Object.assign({}, state, {
                textAreaReference: action.reference,
            });
        case actions.GET_FOCUS:
            if (state.textAreaReference && state.textAreaReference.current) {
                state.textAreaReference.current.focus();
            }
            return state;
        case actions.SET_SCROLL:
            return Object.assign({}, state, {
                chatArea: action.reference,
            });
        case actions.SCROLL_TO_BOTTOM:
            if (state.chatArea && state.chatArea.current) {
                state.chatArea.current.scrollTop = state.chatArea.current.scrollHeight;
            }
            return state;
    }
}

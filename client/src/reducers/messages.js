import * as actions from '../constants/ActionTypes';

function randomUserId() {
  return (Math.floor(Math.random() * (10000 - 1 + 1)) + 1).toString();
}

const initialState = {
  messages: [],
  userId: randomUserId(),
};

export default function messages(state = initialState, action) {
  switch (action.type) {
    default:
      return state;
    case actions.ADD_MESSAGES:
      return {
        ...state,
        messages: [...state.messages, ...action.messages],
      };
    case actions.RESET_SESSION:
      return {
        messages: [],
        userId: randomUserId(),
      };
  }
}

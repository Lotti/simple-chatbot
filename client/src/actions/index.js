import * as actions from '../constants/ActionTypes';
import { newMsg } from '../constants';

export function setText(text) {
  return {type: actions.SET_TEXT, text};
}

export function setFocus(reference) {
  return { type: actions.SET_FOCUS, reference };
}

export function getFocus() {
  return { type: actions.GET_FOCUS };
}

export function setScroll(reference) {
  return { type: actions.SET_SCROLL, reference };
}

export function scrollToBottom() {
  return { type: actions.SCROLL_TO_BOTTOM };
}

export function resetSession() {
  return (dispatch) => {
    dispatch({ type: actions.RESET_SESSION });
    dispatch(sendMessage('restart'));
  };
}

export function addMessages(new_messages) {
  if (!Array.isArray(new_messages)) {
    new_messages = [new_messages];
  }

  return (dispatch, getState) => {
    if (!Array.isArray(new_messages)) {
      new_messages = [new_messages];
    }

    const length = getState().messages.messages.length;

    for (let i = 0, j = length; i < new_messages.length; i++, j++) {
      new_messages[i].key = j.toString();
    }

    dispatch({ type: actions.ADD_MESSAGES, messages: new_messages });
  };
}

const sleep = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

let lastContext = undefined;
export function sendMessage(input) {
  let text = input;
  let suggestion_id = undefined;
  let intents = undefined;
  let entities = undefined;
  if (typeof input === 'object') {
    text = input.text.trim();
    suggestion_id = input.suggestion_id;
    intents = input.intents;
    entities = input.entities;
  }

  return (dispatch, getState) => {
    const userId = getState().messages.userId;

    const options = {
      method: 'POST',
      mode: 'same-origin',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      redirect: 'manual',
      referrer: 'no-referrer',
      body: JSON.stringify({
        text,
        userId,
        suggestion_id,
        intents,
        entities,
        context: lastContext,
      }),
    };

    return fetch('/api/message', options)
      .then((response) => response.json())
      .then(async (json) => {
        if (json.context) {
          lastContext = json.context.skills['main skill'].user_defined;
        }
        const index = 1; // TODO check if this index var is useless. spoiler: yes.
        if (json.output && json.output.generic) {
          // assistant new response format
          for (const g of json.output.generic) {
            if (g.response_type === 'pause') {
              dispatch(addMessages(newMsg(index, '', { type: g.response_type, ...g })));
              await sleep(g.time);
            } else if (g.response_type === 'text') {
              dispatch(addMessages(newMsg(index, g.text)));
              await sleep(250);
            } else {
              dispatch(addMessages(newMsg(index, '', { type: g.response_type, ...g })));
              await sleep(250);
            }
          }
        } else if (json.output && json.output.text) {
          for (const text of json.output.text) {
            dispatch(addMessages(newMsg(index, text)));
            await sleep(250);
          }
        }

        return json;
      });
  };
}

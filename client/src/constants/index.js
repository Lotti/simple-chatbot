import * as PropTypes from 'prop-types';
import avatar from '../img/robot.svg';

export const botName = 'Bot';
export const botAvatar = avatar;
export const userName = 'Me';

export const IMessage = PropTypes.shape({
  index: PropTypes.number.isRequired,
  key: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  actor: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  time: PropTypes.number,
  typing: PropTypes.bool,
});

/**
 *
 * @param {number} index message index
 * @param {string} text message text
 * @param {string} actor message owner (user or bot)
 * @param {object?} extra message custom data (es: provider json)
 * @param {string?} extra.type message type
 * @param {string?} extra.name message author name
 * @param {string?} extra.action message action
 * @returns {{actor: string, date: string, extra: {type: string}, name: (*|string), index: *, action: (*|string), text: *}}
 */
export function newMsg(index, text, extra, actor = 'bot') {
  if (!extra) {
    extra = {};
  }
  if (!extra.type) {
    extra.type = 'text';
  }

  return {
    index,
    action: extra.action ? extra.action : 'text',
    actor,
    name: extra.name ? extra.name : botName,
    text,
    extra,
    date: new Date().toISOString(),
  };
}

import '../css/ChatBalloon.less';

import React from 'react';
import * as PropTypes from 'prop-types';
import { Avatar } from 'antd';
import dayjs from 'dayjs';
import { IMessage, botAvatar } from '../constants';
import { connect } from 'react-redux';
import * as actions from '../actions';
import ImageBalloon from '../components/balloons/ImageBalloon';
import OptionBalloon from '../components/balloons/OptionBalloon';
import PauseBalloon from '../components/balloons/PauseBalloon';
import SuggestionBalloon from '../components/balloons/SuggestionBalloon';
import TextBalloon from '../components/balloons/TextBalloon';
import TransferToBalloon from '../components/balloons/TransferToBalloon';

const IChatBalloon = {
  message: IMessage.isRequired,
  getFocus: PropTypes.func,
  scrollToBottom: PropTypes.func,
  addMessages: PropTypes.func,
};

export const IBalloon = {
  ...IChatBalloon,
  avatar: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node.isRequired,
};

export const IBalloonDefault = {
  getFocus: () => null,
  scrollToBottom: () => null,
  addMessages: () => null,
};

class ChatBalloon extends React.Component {
  constructor(props) {
    super(props);
    this.textArea = React.createRef();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (this.props.message !== nextProps.message) {
      return true;
    }

    return false;
  }

  getInitials = (name) => {
    return name.substr(0, 1).toUpperCase();
  };

  printAvatar = () => {
    const { message } = this.props;

    switch (message.actor) {
      case 'user':
        return <Avatar size="large">{this.getInitials(message.name)}</Avatar>;
      default:
      case 'bot':
        return <Avatar size="large" src={botAvatar} />;
    }
  };

  printTitle = () => {
    const { message } = this.props;

    const date = dayjs(message.date).format('[[]DD/MM/YYYY HH:mm:ss]');
    switch (message.actor) {
      case 'user':
        return (
          <React.Fragment>
            <span className="chatDate">{date}</span>
            &nbsp;<b>{message.name}</b>
          </React.Fragment>
        );
      default:
      case 'bot':
        return (
          <React.Fragment>
            <b>{message.name}</b>
            &nbsp;<span className="chatDate">{date}</span>
          </React.Fragment>
        );
    }
  };

  printDescription = () => {
    const { message } = this.props;

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: message.text.replace(/\n/g, '<br/>'),
        }}
      />
    );
  };

  pickBalloonType = (message) => {
    switch (message.extra.type) {
      case 'image':
        return ImageBalloon;
      case 'option':
        return OptionBalloon;
      case 'pause':
        return PauseBalloon;
      case 'suggestion':
        return SuggestionBalloon;
      default:
      case 'text':
        return TextBalloon;
      case 'connect_to_agent':
        return TransferToBalloon;
    }
  };

  render() {
    const { message } = this.props;

    const Balloon = this.pickBalloonType(message);
    return (
      <Balloon
        {...this.props}
        avatar={this.printAvatar()}
        title={this.printTitle()}
        description={this.printDescription()}
      />
    );
  }

  static propTypes = IChatBalloon;

  static defaultProps = IBalloonDefault;
}

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    getFocus: (...args) => dispatch(actions.getFocus(...args)),
    scrollToBottom: (...args) => dispatch(actions.scrollToBottom(...args)),
    addMessages: (...args) => dispatch(actions.addMessages(...args)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatBalloon);

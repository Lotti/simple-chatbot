import React from 'react';
import { message } from 'antd';
import ChatWidget from '../components/ChatWidget';
import * as PropTypes from 'prop-types';
import { userName, botName, IMessage, newMsg } from '../constants';
import { connect } from 'react-redux';
import * as actions from '../actions';

class Chat extends React.Component {
  state = {
    loading: false,
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (this.props.session) {
      if (this.props.session.session_id !== nextProps.session.session_id) {
        return true;
      } else if (
        this.props.session.transcription !== nextProps.session.transcription
      ) {
        return true;
      }
    }

    if (this.state.loading !== nextState.loading) {
      return true;
    } else if (this.props.response !== nextProps.response) {
      return true;
    } else if (this.props.messages !== nextProps.messages) {
      return true;
    }

    return false;
  }

  componentDidMount() {
    if (this.props.messages.length === 0) {
      this.forwardToWatson('');
    }
  }

  /**
   *
   * @returns {number}
   */
  getNextIndex = () => {
    return this.props.messages.length;
  };

  sendMessage = (text) => {
    const { addMessages, resetSession } = this.props;

    if (
      ['riavvia', 'ricomincia', 'restart', 'start', 'reset'].includes(
        text.toLowerCase().trim()
      )
    ) {
      resetSession();
    } else {
      addMessages(
        newMsg(this.getNextIndex(), text, { name: userName }, 'user')
      );
      this.forwardToWatson(text);
    }
  };

  forwardToWatson = (text) => {
    const { sendMessage } = this.props;

    this.setState({ loading: true });
    sendMessage(text)
      .catch((error) => {
        console.error(
          "Si è verificato un errore nell'invio del messaggio al server",
          error.message
        );
        message.error(
          "Si è verificato un errore nell'invio del messaggio al server. Riprovare."
        );
      })
      .then(() => this.setState({ loading: false }));
  };

  getFixedAnswers = () => {
    const { response } = this.props;

    let responses = [];

    if (response && response.output && response.output.generic) {
      for (const g of response.output.generic) {
        if (g.response_type === 'option') {
          for (const o of g.options) {
            responses.push({ label: o.label, value: o.value.input.text });
          }
          break;
        }
      }
    }

    return responses;
  };

  render() {
    const { loading } = this.state;
    const { messages } = this.props;

    return (
      <ChatWidget
        loading={loading}
        botName={botName}
        messages={messages}
        sendMessage={this.sendMessage}
        fixedAnswers={this.getFixedAnswers()}
      />
    );
  }

  static propTypes = {
    messages: PropTypes.arrayOf(IMessage).isRequired,
    resetSession: PropTypes.func,
    resetContext: PropTypes.func,
    sendMessage: PropTypes.func,
    addMessages: PropTypes.func,
    resetSessionKeepContext: PropTypes.func,
  };

  static defaultProps = {
    resetSession: () => null,
    sendMessage: () => null,
    addMessages: () => null,
  };
}

function mapStateToProps(state) {
  return {
    messages: state.messages.messages,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    resetSession: (...args) => dispatch(actions.resetSession(...args)),
    sendMessage: (...args) => dispatch(actions.sendMessage(...args)),
    addMessages: (...args) => dispatch(actions.addMessages(...args)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);

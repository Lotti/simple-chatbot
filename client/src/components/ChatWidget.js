import '../css/ChatWidget.less';

import React from 'react';
import * as PropTypes from 'prop-types';
import { Tag, List, Spin } from 'antd';
import TextAreaButton from '../components/TextAreaButton';
import ChatBalloon from '../components/ChatBalloon';
import { IMessage } from '../constants';
import { connect } from 'react-redux';
import * as actions from '../actions';

class ChatWidget extends React.Component {
  constructor(props) {
    super(props);
    this.textAreaButton = React.createRef();
    this.chatArea = React.createRef();
  }

  state = {
    latestMessages: [],
    latestPointer: 0,
    disableFixedAnswer: false,
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (this.props.messages !== nextProps.messages) {
      return true;
    } else if (this.props.loading !== nextProps.loading) {
      return true;
    } else if (this.props.showInputArea !== nextProps.showInputArea) {
      return true;
    } else if (this.props.fixedAnswers !== nextProps.fixedAnswers) {
      return true;
    }
    return false;
  }

  componentDidMount() {
    this.props.setScroll(this.chatArea);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.messages.length < this.props.messages.length) {
      this.props.scrollToBottom();
    }
  }

  submitMessage = (value) => {
    const { latestMessages } = this.state;
    const { sendMessage } = this.props;

    if (this.textAreaButton.current) {
      if (value.length > 0) {
        value = value.trim();
        this.textAreaButton.current.setValue('');
        this.setState({ latestMessages: [].concat([value], latestMessages) });
        sendMessage(value);
      }
    }
  };

  submitFixedAnswer = (answer) => {
    const { latestMessages } = this.state;
    const { sendMessage } = this.props;

    return (e) => {
      e.preventDefault();
      this.setState({ latestMessages: [].concat([answer], latestMessages) });
      sendMessage(answer);
    };
  };

  render() {
    const {
      messages,
      loading,
      showInputArea,
      fixedAnswers,
      botName,
    } = this.props;

    return (
      <React.Fragment>
        <div className="messagesArea" ref={this.chatArea}>
          <List
            className="messages"
            itemLayout="vertical"
            dataSource={messages}
            renderItem={(m) => <ChatBalloon message={m} />}>
            {loading && (
              <div className="spinner">
                <Spin size="large" />
              </div>
            )}
          </List>
        </div>
        {fixedAnswers && fixedAnswers.length > 0 && (
          <div className="fixed-answers">
            {fixedAnswers.map((a, i) => (
              <Tag
                key={'fa-' + i}
                className="fixed-answer"
                color="#004280"
                onClick={this.submitFixedAnswer(a.value)}>
                {a.label}
              </Tag>
            ))}
          </div>
        )}
        {showInputArea && (
          <TextAreaButton
            loading={loading}
            autoComplete="off"
            placeholder={'Scrivi un messaggio a ' + botName + '!'}
            reference={this.textAreaButton}
            onKeyDown={(e) => {
              const { latestMessages, latestPointer } = this.state;

              if (e.key === 'ArrowUp') {
                if (latestPointer < latestMessages.length) {
                  this.setState({ latestPointer: latestPointer + 1 });
                }
              } else if (e.key === 'ArrowDown') {
                if (latestPointer >= 0) {
                  this.setState({ latestPointer: latestPointer - 1 });
                }
              }

              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (latestMessages[latestPointer]) {
                  this.textAreaButton.current.setValue(
                    latestMessages[latestPointer]
                  );
                } else {
                  this.textAreaButton.current.setValue('');
                }
              }
            }}
            onPressEnter={(event) => this.submitMessage(event.target.value)}
            buttonOnClick={(value) => this.submitMessage(value)}
          />
        )}
      </React.Fragment>
    );
  }

  static propTypes = {
    loading: PropTypes.bool,
    messages: PropTypes.arrayOf(IMessage).isRequired,
    botName: PropTypes.string.isRequired,
    sendMessage: PropTypes.func,
    showInputArea: PropTypes.bool,
    fixedAnswers: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
      })
    ),
    setScroll: PropTypes.func,
    scrollToBottom: PropTypes.func,
  };

  static defaultProps = {
    loading: false,
    sendMessage: () => null,
    showInputArea: true,
    fixedAnswers: [],
    setScroll: () => null,
    scrollToBottom: () => null,
  };
}

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    setScroll: (...args) => dispatch(actions.setScroll(...args)),
    scrollToBottom: (...args) => dispatch(actions.scrollToBottom(...args)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatWidget);

import React from 'react';
import {List, Button} from 'antd';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {IBalloon, IBalloonDefault} from '../ChatBalloon';
import {newMsg, userName} from "../../constants";

class OptionBalloon extends React.Component {

    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    state = {
        clicked: null,
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.state.clicked !== nextState.clicked) {
            return true;
        } else if (this.props.message !== nextProps.message) {
            return true;
        }

        return false;
    }

    getNextIndex = () => {
        return this.props.messages.length;
    };

    click = (buttonIndex, text) => {
        return (e) => {
            e.preventDefault();
            this.setState({clicked: buttonIndex});
            this.props.addMessages(newMsg(this.getNextIndex(), text, {name: userName}, 'user'));
            this.props.sendMessage(text);
        };
    };

    printDescription = () => {
        const {message} = this.props;

        const json = message.extra;

        const array = [
            json.title ? json.title : '',
            json.description ? `<i>${json.description}</i>` : '',
        ];
        const b = [];
        for (const a of array) {
            if (a.length > 0) {
                b.push(a);
            }
        }

        return (<div dangerouslySetInnerHTML={{__html: b.join('<br/>').replace(/\n/g, '<br/>')}}/>);
    };

    printActions = () => {
        const {clicked} = this.state;
        const {message} = this.props;
        if (clicked !== null) {
            return message.extra.options.map((o, i) => (
                <Button key={`option${i}`} type="primary" className="fixed-answer"
                        disabled={i !== clicked}>{o.label}</Button>)
            );
        } else {
            return message.extra.options.map((o, i) => (
                <Button key={`option${i}`} type="primary" className="fixed-answer"
                        onClick={this.click(i, o.value.input.text)}>{o.label}</Button>)
            );
        }
    };

    render() {
        const {message, title, avatar} = this.props;

        return (
            <List.Item key={message.key} className={`message ${message.actor} ${message.action}`} actions={this.printActions()}>
                <List.Item.Meta
                    avatar={avatar}
                    title={title}
                    description={this.printDescription()}
                />
            </List.Item>
        );
    };

    static propTypes = IBalloon;

    static defaultProps = IBalloonDefault;
}

function mapStateToProps(state) {
    return {
        messages: state.messages.messages,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        sendMessage: (...args) => dispatch(actions.sendMessage(...args)),
        addMessages: (...args) => dispatch(actions.addMessages(...args)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionBalloon);

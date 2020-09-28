import React from 'react';
import {List, Button} from 'antd';
import {connect} from 'react-redux';
import {IBalloon, IBalloonDefault} from "../ChatBalloon";
import * as actions from "../../actions";

class SuggestionBalloon extends React.Component {

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

    click = (buttonIndex, input) => {
        return (e) => {
            e.preventDefault();
            this.setState({clicked: buttonIndex});
            // this.props.addMessages(newMsg(this.getNextIndex(), text, {name: userName}, 'user'));
            this.props.sendMessage(input);
        };
    };

    printDescription = () => {
        const {message} = this.props;
        return (<div dangerouslySetInnerHTML={{__html: message.extra.title.replace(/\n/g, '<br/>')}}/>);
    };

    printActions = () => {
        const {clicked} = this.state;
        const {message} = this.props;
        if (clicked !== null) {
            return message.extra.suggestions.map((o, i) => (
                <Button key={`option${i}`} type="primary" className="fixed-answer" disabled={i !== clicked}>{o.label}</Button>
            ));
        } else {
            return message.extra.suggestions.map((o, i) => (
                <Button key={`option${i}`} type="primary" className="fixed-answer" onClick={this.click(i, o.value.input)}>{o.label}</Button>
            ));
        }
    };

    render() {
        const {message, avatar, title} = this.props;

        return (
            <List.Item key={message.key} className={`message ${message.actor} ${message.action}`} actions={this.printActions()}>
                <List.Item.Meta avatar={avatar} title={title} description={this.printDescription()}/>
            </List.Item>
        );
    };

    static propTypes = IBalloon;

    static defaultProps = IBalloonDefault;
}

function mapStateToProps(state) {
    return {};
}

function mapDispatchToProps(dispatch) {
    return {
        sendMessage: (...args) => dispatch(actions.sendMessage(...args)),
        addMessages: (...args) => dispatch(actions.addMessages(...args)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SuggestionBalloon);

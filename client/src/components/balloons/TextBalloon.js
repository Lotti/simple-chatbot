import React from 'react';
import {List} from 'antd';
import {IBalloon, IBalloonDefault} from "../ChatBalloon";

export default class TextBalloon extends React.Component {

    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return this.props.message !== nextProps.message;
    }

    render() {
        const {message, avatar, title, description} = this.props;

        return (
            <List.Item key={message.key} className={`message ${message.actor} ${message.action}`}>
                <List.Item.Meta avatar={avatar} title={title} description={description}/>
            </List.Item>
        );
    };

    static propTypes = IBalloon;

    static defaultProps = IBalloonDefault;
}

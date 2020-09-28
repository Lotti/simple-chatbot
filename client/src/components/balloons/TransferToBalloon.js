import React from 'react';
import {List} from 'antd';
import {IBalloon, IBalloonDefault} from "../ChatBalloon";

export default class TransferToBalloon extends React.Component {
    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return this.props.message !== nextProps.message;
    }

    printDescription = () => {
        const {message} = this.props;

        return (<div dangerouslySetInnerHTML={{__html: message.extra.message_to_human_agent.replace(/\n/g, '<br/>')}}/>);
    };

    render() {
        const {message, avatar, title} = this.props;

        return (
            <List.Item key={message.key} className={`message ${message.actor} ${message.action}`}>
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

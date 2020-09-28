import React from 'react';
import {List, Avatar} from 'antd';
import dayjs from 'dayjs';
import {botAvatar} from '../../constants';
import {IBalloon, IBalloonDefault} from "../ChatBalloon";

export default class ImageBalloon extends React.Component {

    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return this.props.message !== nextProps.message;
    }

    getInitials = (name) => {
        return name.substr(0, 1).toUpperCase();
    };

    printAvatar = () => {
        const {message} = this.props;

        switch (message.actor) {
            case 'user':
                return <Avatar size="large">{this.getInitials(message.name)}</Avatar>;
            default:
            case 'bot':
                return <Avatar size="large" src={botAvatar}/>;
        }
    };

    printTitle = () => {
        const {message} = this.props;

        const date = dayjs(message.date).format('[[]DD/MM/YYYY HH:mm:ss]');
        switch (message.actor) {
            case 'user':
                return <React.Fragment><span className="chatDate">{date}</span>
                    &nbsp;<b>{message.name}</b></React.Fragment>;
            default:
            case 'bot':
                return <React.Fragment><b>{message.name}</b>
                    &nbsp;<span className="chatDate">{date}</span></React.Fragment>;
        }
    };

    printDescription = () => {
        const {message} = this.props;
        const json = message.extra;

        const array = [
            json.title ? json.title : '',
            json.description ? `<i>${json.description}</i>` : '',
            `<a target="_blank" rel="nofollow" href="${json.source}"><img src="${json.source}" alt="${json.title}" class="imgPreview"></a>`,
        ];
        const b = [];
        for (const a of array) {
            if (a.length > 0) {
                b.push(a);
            }
        }

        return (<div dangerouslySetInnerHTML={{__html: b.join('<br />').replace(/\n/g, '<br/>')}}/>);
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

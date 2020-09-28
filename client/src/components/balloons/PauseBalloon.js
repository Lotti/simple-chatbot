import React from 'react';
import {List} from 'antd';
import {connect} from 'react-redux';
import {IBalloon, IBalloonDefault} from '../ChatBalloon';

class PauseBalloon extends React.Component {

    constructor(props) {
        super(props);
        this.textArea = React.createRef();

        this.state.visible = props.message.extra.typing;
    }

    state = {
        visible: true,
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.state.visible !== nextState.visible) {
            return true;
        } else if (this.props.message !== nextProps.message) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        const {message, scrollToBottom} = this.props;

        if (message.extra.typing) {
            setTimeout(() => {
                this.setState({visible: false});
                scrollToBottom();
            }, message.extra.time);
        }
    }


    printDescription = () => {
        const {message} = this.props;

        const json = message.extra;
        if (json.typing) {
            return (<i>{message.name} sta pensando...</i>);
        } else {
            return null;
        }
    };

    render() {
        const {visible} = this.state;
        const {message, avatar, title} = this.props;

        if (visible) {
            return (
                <List.Item key={message.key} className={`message ${message.actor} ${message.action}`}>
                    <List.Item.Meta
                        avatar={avatar}
                        title={title}
                        description={this.printDescription()}
                    />
                </List.Item>
            );
        }
        return null;
    };

    static propTypes = IBalloon;

    static defaultProps = IBalloonDefault;
}

function mapStateToProps(state) {
    return {};
}

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(PauseBalloon);

import '../css/TextAreaButton.less';

import React from 'react';
import * as PropTypes from 'prop-types';
import {Button, Input, Row, Col} from 'antd';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {EnterOutlined} from '@ant-design/icons';

class TextAreaButton extends React.Component {
    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.props.disabled !== nextProps.disabled) {
            return true;
        } else if (this.props.loading !== nextProps.loading) {
            return true;
        } else if (this.props.buttonIcon !== nextProps.buttonIcon) {
            return true;
        } else if (this.props.buttonType !== nextProps.buttonType) {
            return true;
        } else if (this.props.className !== nextProps.className) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        const {reference, setFocus} = this.props;
        const ref = reference || this.textArea;

        setFocus(ref);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {reference} = this.props;
        const ref = reference || this.textArea;

        if (ref.current) {
            ref.current.focus();
        }
    }

    render() {
        const {className, reference, disabled, loading, buttonOnClick, buttonIcon, buttonType, setFocus, onPressEnter, ...textProps} = this.props;

        let cName = 'chatInputArea';
        if (className.length > 0) {
            cName += ' ' + className;
        }

        const ref = reference || this.textArea;
        const textDisabled = disabled || loading;

        return (
            <div className={cName}>
                <Row gutter={0}>
                    <Col xs={18} md={20} lg={22}>
                        <Input.TextArea {...textProps} className="chatInput" ref={ref} disabled={textDisabled}
                                        onKeyUp={(event) => {
                                            if (event.keyCode === 13) {
                                                onPressEnter(event);
                                            }
                                        }} />
                    </Col>
                    <Col xs={6} md={4} lg={2}>
                        <Button className="sendButton" type={buttonType} icon={buttonIcon} disabled={disabled} loading={loading}
                                onClick={() => {
                                    if (ref && ref.current) {
                                        buttonOnClick(ref.current.state.value);
                                    }
                                }}/>
                    </Col>
                </Row>
            </div>
        );
    };

    static propTypes = {
        loading: PropTypes.bool,
        reference: PropTypes.object,
        className: PropTypes.string,
        disabled: PropTypes.bool,
        buttonOnClick: PropTypes.func,
        buttonIcon: PropTypes.node,
        buttonType: PropTypes.string,
        setFocus: PropTypes.func,
    };

    static defaultProps = {
        loading: false,
        reference: undefined,
        className: '',
        disabled: false,
        buttonOnClick: () => null,
        buttonIcon: <EnterOutlined />,
        buttonType: 'primary',
        setFocus: () => null,
    };
}

function mapStateToProps(state) {
    return {
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setFocus: (...args) => dispatch(actions.setFocus(...args)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(TextAreaButton);

import '../css/App.less';

import React from 'react';
import {Layout} from 'antd';
import {library as FALibrary} from '@fortawesome/fontawesome-svg-core';
import {fas} from '@fortawesome/free-solid-svg-icons';
import Chat from '../components/Chat';

FALibrary.add(fas);

// const withWatsonImg = require('../img/with-watson-white.png');
// const watsonImg = require('../img/watson.png');

class App extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return false;
    }

    render() {
        return (
            <Layout id="whole">
                <Layout.Header id="pageHeader">
                    {/*
                    <img id="withWatson" alt="withWatson" src={withWatsonImg}/>
                    <img id="simple" alt="made with watson" src={watsonImg}/>
                    */}
                    <h1 id="mainTitle">Simple Chatbot</h1>
                </Layout.Header>
                <Chat/>
                <Layout.Footer id="footer" className="clear">Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></Layout.Footer>
            </Layout>
        );
    }
}

export default App;

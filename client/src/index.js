import 'default-passive-events';
import 'url-search-params-polyfill';
import 'isomorphic-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import it_IT from 'antd/es/locale/it_IT';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

import configureStore from './configureStore';
import App from './components/App';
import rootReducer from './reducers';

// import registerServiceWorker from './registerServiceWorker';

dayjs.locale('it');

const store = configureStore(rootReducer);

ReactDOM.render(
  //<React.StrictMode>
  <Provider store={store}>
    <ConfigProvider locale={it_IT}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </Provider>,
  //</React.StrictMode>
  document.getElementById('root')
);
// registerServiceWorker();

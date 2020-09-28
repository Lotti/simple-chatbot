import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

const middleware = [thunk];
// if (process.env.REDUX_LOGGER) {
    middleware.push(createLogger());
// }

export default function configureStore(rootReducer, preloadedState) {
    return createStore(
        rootReducer,
        preloadedState,
        applyMiddleware(...middleware)
    )
};

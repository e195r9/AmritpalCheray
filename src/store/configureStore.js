// Create a Redux store holding the state of your app.
// Its API is { subscribe, dispatch, getState }.

import {createStore, applyMiddleware, compose} from 'redux'
import { createLogger } from 'redux-logger';
import rootReducer from "./reducers";

const loggerMiddleware = createLogger();
const middleware = [];

//For Redux Dev Tools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;


const configureStore = (preloadedState) => {
    return createStore(
        rootReducer,
        preloadedState,
        composeEnhancers(applyMiddleware(...middleware, loggerMiddleware))
    )
}

export default configureStore;
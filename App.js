import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
import Application from './screens/Application';
import createStore from './redux';
import Sentry from 'sentry-expo';

const store = createStore();

Sentry.enableInExpoDevelopment = true;

Sentry.config('https://fccec89f78144afa93403cffb2c74e6d@sentry.io/1387718').install();

export default class Chatabox extends Component {
  render() {
    return (
      <Provider store={store}>
        <Application />
      </Provider>
    );
  }
}

AppRegistry.registerComponent('Chatabox', () => Chatabox);

import React from 'react';
import { connect } from 'react-redux';
import { Platform, StatusBar, StyleSheet, View, AppState } from 'react-native';
import { AppLoading } from 'expo';
import { Asset } from'expo-asset';
import * as Icon from '@expo/vector-icons';
import * as Font from'expo-font';
import AppNavigator from '../navigation/AppNavigator';
import LoginScreen from './LoginScreen';
import {pushNotificationsStopWithRedux, pushNotificationsStartWithRedux, chataboxSignalRRefresh, chataboxSignalRUnsubscribe} from '../redux/actions/auth';


class Application extends React.Component {
  state = {
    isLoadingComplete: false,
    appState: AppState.currentState,
    notification: {}
  };


  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
   AppState.removeEventListener('change', this._handleAppStateChange);
 }

 _handleAppStateChange = (nextAppState) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App in foreground - refresh signalR
      this.props.chataboxSignalRRefreshed(this.props.authChataboxToken, this.props.signalRConnection);
      // App in forgeground - stop pushing
      if(this.props.pushNotificationsRegistered){
        this.props.pushNotificationsStop(this.props.authChataboxToken, this.props.userEmail, this.props.expoToken);
      }
    } else {

      // App in background - stop signalR

      if(this.props.signalRSubscribed && !this.props.signalRError && this.props.signalRConnection){
        //this.props.chataboxSignalRUnsubscribe(this.props.signalRConnection);
      }
      // App in background - start pushing
      if(this.props.pushNotificationsRegistered && !this.props.pushNotificationsStatus, this.props.userEmail){
        this.props.pushNotificationsStart(this.props.authChataboxToken, this.props.userEmail, this.props.expoToken);
      }
    }
    this.setState({appState: nextAppState});
  };


  render() {

    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    } else {

      return (
        <View style={styles.container}>
          {Platform.OS === 'ios' && <StatusBar
         backgroundColor="blue"
         barStyle="light-content"
       />}
          <AppNavigator />
        </View>
    );

    }
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('../assets/images/chatabox-blank-avatar.png'),
        require('../assets/images/chatabox-lockup-white.png')
      ]),
      Font.loadAsync({
        ...Icon.Ionicons.font,

      }),
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };
}

const mapStateToProps = (state, ownProps) => {
    return {
        isLoggedIn: state.auth.isLoggedIn,
        userEmail: state.auth.email,
        userPhoneNumber: state.auth.userPhoneNumber,
        authChataboxToken: state.auth.authChataboxToken,
        expoToken: state.auth.pushNotificationsToken,
        pushNotificationsRegistered: state.auth.pushNotificationsRegistered,
        pushNotificationsStatus: state.auth.pushNotificationsStatus,
        authChataboxToken: state.auth.authChataboxToken,
        signalRSubscribed: state.auth.signalRSubscribed,
        signalRError: state.auth.signalRError,
        signalRConnection: state.auth.signalRConnection
    };
}

function mapDispatchToProps(dispatch) {
  return {
    chataboxSignalRUnsubscribe: function(connection) {
      dispatch(chataboxSignalRUnsubscribe(connection));
    },
    chataboxSignalRRefreshed: function(authChataboxToken){
      dispatch(chataboxSignalRRefresh(authChataboxToken));
    },
    pushNotificationsStop: function(authChataboxToken, userEmail, expoToken) {
      dispatch(pushNotificationsStopWithRedux(authChataboxToken, userEmail, expoToken));
    },
    pushNotificationsStart: function(authChataboxToken, userEmail, expoToken) {
      dispatch(pushNotificationsStartWithRedux(authChataboxToken, userEmail, expoToken));
    },
  };
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Application);

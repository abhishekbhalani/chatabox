import React from 'react';
import {
  View,
  AppRegistry,
  Alert,
  StyleSheet,
  Linking
} from 'react-native';
import { connect } from 'react-redux';
import { login, chataboxInitiate } from '../redux/actions/auth';

import {AzureInstance, AzureLoginView} from '../components/azure-ad';
// CONSTANT
//bwD45878!*@exmucZOEBIT}



class AzureAuth extends React.Component {

  static navigationOptions = {
    title: 'Microsoft Account'
  };

	constructor(props){
		super(props);

    const CREDENTIALS = this.props.authCredentials;
		this.azureInstance = new AzureInstance(CREDENTIALS);
		this._onLoginSuccess = this._onLoginSuccess.bind(this);

    this.state = {
            authGraphToken: '',
            authChataboxToken: '',
            email: '',
            displayName: '',
            givenName: ''
        };
	}

  componentDidUpdate() {
    if(this.props.isLoggedIn && this.props.authError && !this.props.chataboxInitiated) {
      Alert.alert(
        'Sorry!',
        'You are not currently authorized to use the Chatabox service.',
        [
          {text: 'Help', onPress: () => this._handleAlertPress('help')},
          {
            text: 'Logout',
            onPress: () => this._handleAlertPress('logout'),
            style: 'cancel',
          },
        ],
        {cancelable: false},
        );
    } else if(this.props.isLoggedIn && this.props.chataboxInitiated && !this.props.authError){
      this.props.navigation.navigate('Main');
    } else if (this.props.isLoggedIn && !this.props.authError && !this.props.chataboxInitiated) {
      this.props.chataboxInit(this.props.authChataboxToken, this.props.userEmail);
    }
  }

  _handleAlertPress(page) {
    if (page === 'help') {
      const HELP_URL = 'http://www.chatabox.co.uk/knowledge-base/';
      Linking.canOpenURL(HELP_URL).then(supported => {
       if (supported) {
         Linking.openURL(HELP_URL);
         this.props.navigation.navigate('Logout');
       } else {
         console.log("Don't know how to open URI: " + HELP_URL);
       }
     });
    } else if (page === 'logout') {
      this.props.navigation.navigate('Logout');
    }
  }
	_onLoginSuccess(){
    const errorCatch = this.azureInstance.getError();

    if(errorCatch){
      Alert.alert(
      'Sorry!',
      errorCatch,
      [
        {text: 'OK', onPress: () => this.props.navigation.navigate('Login')},
      ],
      { cancelable: false }
    );
    return;
    }

		this.azureInstance.getUserInfo().then(result => {
      // SUCCESS - use token

      const graphToken = this.azureInstance.graphToken.accessToken;
      const refreshToken = this.azureInstance.graphToken.refreshToken;
      const chataboxToken = this.azureInstance.chataboxToken.accessToken;
      const user = result;

      if(graphToken && chataboxToken) {
        user['graphToken'] = graphToken;
        user['refreshToken'] = refreshToken;
        user['chataboxToken'] = chataboxToken;
        this.props.onLogin(user);
      } else {
        Alert.alert(
        'Sorry!',
        'Something went wrong, please try again later',
        [
          {text: 'OK', onPress: () => this.props.navigation.navigate('Login')},
        ],
        { cancelable: false }
      )
      }

		}).catch(err => {
			console.log(err);
      Alert.alert(
      'Sorry!',
      'Something went wrong, please try again later',
      [
        {text: 'OK', onPress: () => this.props.navigation.navigate('Login')},
      ],
      { cancelable: false }
    )
		})
	}

    render() {

        return (
          <View style={styles.container}>
            <AzureLoginView
            	azureInstance={this.azureInstance}
            	loadingMessage="Signing in to your account"
            	onSuccess={this._onLoginSuccess}
            />
          </View>
        );
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#fff',
    justifyContent: 'flex-start'
  },
});

const mapStateToProps = (state, ownProps) => {
    return {
        authChataboxToken: state.auth.authChataboxToken,
        authGraphToken: state.auth.authGraphToken,
        authCredentials: state.auth.authCredentials,
        isLoggedIn: state.auth.isLoggedIn,
        authError: state.auth.error,
        chataboxInitiated: state.auth.chataboxInitiated,
        userEmail: state.auth.email
    };
}

const mapDispatchToProps = (dispatch) => {
    return {
        onLogin: (result) => { dispatch(login(result)); },
        chataboxInit: function(authChataboxToken, email) {
          dispatch(chataboxInitiate(authChataboxToken, email));
        },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AzureAuth);

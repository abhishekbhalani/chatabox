import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  View,
  Button,
  StatusBar,
} from 'react-native';

import { WebView } from 'react-native-webview';
import { Notifications } from 'expo';
import helpers from '../constants/Helpers';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { ListItem } from 'react-native-elements';
import ToggleSwitch from 'toggle-switch-react-native';
import { logout, chataboxFetchUsableCredit } from "../redux/actions/auth";
import { chataboxActiveRoomOpen } from "../redux/actions/messages";
class SettingsScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
     const { state } = navigation
     return {
       headerTitle: 'Settings',
       headerTintColor: '#fff',
       headerStyle: {
       backgroundColor: '#00AAF7'
       },
     }
   }


    constructor(props) {
       super(props);
     }

   componentDidMount() {

     /* Retrieve user credit */
     this.props.chataboxFetchUsableCredit(this.props.authChataboxToken);

     /* listen to push function & trigger _handleNotification
        needs to be globally applied to root component... not working yet
        so this is a temporary fix */
    this._notificationSubscription = Notifications.addListener(this._handleNotification);
  }



   _handleNotification = (notification) => {

     /* listen to push function & redirect page
        needs to be globally applied to root component... not working yet
        so this is a temporary fix */

     if(!notification || !notification.data || !notification.data.some || notification.origin !== "selected"){
       return;
     }

     const roomId = notification.data.some;

     const { messages } = this.props;
     const index = messages.findIndex(x => x.Id == roomId);
     const room = index !== -1 ? messages[index] : null;

     if(!room){ return }


       const { contacts, displayName } = this.props;
       const roomName = helpers.retrieveNameFromRoomObject(room, contacts, displayName)

       const roomData = {
         roomId: room.Id,
         userName: this.props.displayName,
         userId: this.props.id,
         participantName: roomName
       }

       this.props.chataboxActiveRoomOpen(roomData, messages).then(() => {
         this.props.navigation.navigate('ChatRoomScreen');
       });
  }
  fetchCredit = () => {
    const { userUsableCredit } = this.props;
    const prefix = '$';
    const suffix = ' (USD)';
    if(!userUsableCredit){
      return prefix + '0.00' + suffix;
    } else {
      return prefix + userUsableCredit + suffix;
    }
  }

  handleWebViewChange = () => {
    if(this.state.webViewLogout){
      setTimeout(() => {
        this.props.userLogout();
        this.props.navigation.navigate('Auth');
      }, 2000);
    }
  }

  logoutWebView(){
    let js = `document.getElementsByTagName('body')[0].style.height = '${Dimensions.get('window').height}px';`

    if(this.state.showWebView) {
    return (
      <WebView
     source={{uri: 'https://login.microsoftonline.com/chatabox365.onmicrosoft.com/oauth2/logout'}}
     onNavigationStateChange={this.onNavigationStateChange}
     startInLoadingState
     scalesPageToFit
     javaScriptEnabled
     style={{ flex: 1 }}
   />
    )
  }
  }


  render() {
    return (
      <View>
          <View style={styles.generalContainer}>
            <ListItem
              containerStyle={styles.listItemContainer}
              title="Remaining Credit"
              rightTitle={this.fetchCredit()}
            />
          </View>

        <View style={styles.generalContainer}>
            <ListItem
              chevron
              containerStyle={styles.listItemContainer}
              title="Help"
              onPress={() => this.props.navigation.navigate('SettingsWebView', { showWebView: true, webViewUrl: 'http://www.chatabox.co.uk/knowledge-base/', pageTitle: 'Help'})}
            />
            <ListItem
            chevron
            containerStyle={styles.listItemContainer}
              title="Privacy Policy"
              onPress={() => this.props.navigation.navigate('SettingsWebView', { showWebView: true, webViewUrl: 'http://www.chatabox.co.uk/privacy/', pageTitle: 'Privacy Policy'})}
            />
            <ListItem
            chevron
            containerStyle={styles.listItemContainer}
              title="Terms & Conditions"
              onPress={() => this.props.navigation.navigate('SettingsWebView', { showWebView: true, webViewUrl: 'http://www.chatabox.co.uk/terms-of-service/', pageTitle: 'Terms & Conditions'})}
            />
            <ListItem
            chevron
            containerStyle={styles.listItemContainer}
              title="Logout"
              titleStyle={{ color: 'red' }}
              onPress={() => this.props.navigation.navigate('SettingsWebView', { showWebView: true, webViewUrl: 'https://login.microsoftonline.com/chatabox365.onmicrosoft.com/oauth2/logout', webViewLogout: true, pageTitle: 'Logout' })}

            />
        </View>
        <View style={styles.subContainer}>
          <Text style={styles.subText}>
            App Version: 0.0.1
          </Text>
        </View>
      </View>
    )
    }

};



const mapStateToProps = (state, ownProps) => {
    return {
        messages: state.messages.messages,
        authChataboxToken: state.auth.authChataboxToken,
        userUsableCredit: state.auth.userUsableCredit
    };
}

function mapDispatchToProps(dispatch) {
  return {
    chataboxFetchUsableCredit: function(authChataboxToken) {
      dispatch(chataboxFetchUsableCredit(authChataboxToken));
    },
    chataboxActiveRoomOpen: function(roomData) {
      return new Promise((resolve, reject) => {
        dispatch(chataboxActiveRoomOpen(roomData));
        resolve()
      })
    },
    userLogout: function(authToken) {
      return new Promise((resolve, reject) => {
      dispatch(logout(authToken));
      resolve()
    });
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);

const styles = StyleSheet.create({
  actionsContainer: {
    marginBottom: 30
  },
  generalContainer: {
    marginBottom: 30
  },
  listItemContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#CED0CE'
  },
  subContainer: {
    paddingLeft: 20
  },
  subText: {
    color: '#ccc'
  },
  webView: {
    marginTop: 0
  },
  loadingView: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});

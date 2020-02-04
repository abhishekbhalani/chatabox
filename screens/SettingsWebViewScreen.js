import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';

import { WebView } from 'react-native-webview';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { List, ListItem } from 'react-native-elements';
import ToggleSwitch from 'toggle-switch-react-native';
import { logout } from "../redux/actions/auth";

class SettingsWebViewScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
     const { state } = navigation
     return {
       headerTitle: navigation.getParam('pageTitle'),
       headerTintColor: '#fff',
       headerStyle: {
       backgroundColor: '#00AAF7'
       },
     }
   }


    constructor(props) {
       super(props);
       this.state = { visible: true };
     }

  hideSpinner() {
    this.setState({ visible: false })
  }

   componentDidMount() {
    this.props.navigation.setParams({ headerCancel: () => this._headerCancel(), headerSave: () => this._headerSave });
  }


  _headerCancel() {
    this.props.navigation.navigate('Home');
  }
  _headerSave() {

  }
  handleWebViewChange = () => {
    if(this.props.navigation.getParam('webViewLogout')){
      setTimeout(() => {
        this.props.userLogout().then(() => {
            this.props.navigation.navigate('Auth');
        });
      }, 2500);
    }
  }

  render() {
    let js = `document.getElementsByTagName('body')[0].style.height = '${Dimensions.get('window').height}px';`

      return (
        <View style={{flex: 1}}>
        <WebView
          automaticallyAdjustContentInsets={true}
          style={[this.props.style, styles.webView, {
            flex:1,
            alignSelf : 'stretch',
            width : Dimensions.get('window').width,
            height : Dimensions.get('window').height
          }]}
          source={{uri: this.props.navigation.getParam('webViewUrl')}}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          decelerationRate="normal"
          javaScriptEnabledAndroid={true}
          onNavigationStateChange={this.handleWebViewChange}
          onShouldStartLoadWithRequest={(e) => {return true}}
          onLoad={() => this.hideSpinner()}

          injectedJavaScript={js}
          scalesPageToFit={true}
        />
        {this.state.visible && (
            <ActivityIndicator
              style={{ position: "absolute", top: (Dimensions.get('window').height / 2)-36, left: (Dimensions.get('window').width / 2)-18}}
              size="large"
            />
          )}
        </View>
    );
    }

};


const mapStateToProps = (state) => ({

});

function mapDispatchToProps(dispatch) {
  return {
    userLogout: function(authToken) {
      return new Promise((resolve, reject) => {
      dispatch(logout(authToken));
      resolve()
    });
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsWebViewScreen);

const styles = StyleSheet.create({
  actionsContainer: {
    marginBottom: 30
  },
  generalContainer: {
    marginBottom: 30
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

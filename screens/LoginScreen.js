import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  StatusBar,
} from 'react-native';
import { connect } from 'react-redux';
import Image from 'react-native-scalable-image';
class LoginScreen extends React.Component {
  static navigationOptions = {
          header: null
      }
  componentDidMount() {
    this.props.navigation.navigate(this.props.isLoggedIn ? 'Main' : 'Auth');
  }

  render() {

    const dimensions = Dimensions.get('window').width * 0.7;
    const imageWidth = dimensions > 500 ? 500 : dimensions;
    const image = (
       <Image
           width={imageWidth} // height will be calculated automatically
           source={require('../assets/images/chatabox-lockup-white.png')}
       />
    );

    return (
      <View style={styles.container}>
        <StatusBar
       backgroundColor="blue"
       barStyle="light-content"
     />
     <View style={styles.logo}>
    {image}
    </View>
          <Text style={styles.welcomeText}>

            Welcome to Chatabox! Please login with your company Microsoft Active Directory account
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => this.props.navigation.navigate('Azure')} activeOpacity={.8} >
           <Text style={styles.button__text}>
            Login with Microsoft Account
           </Text>
       </TouchableOpacity>

      </View>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
    return {
        isLoggedIn: state.auth.isLoggedIn,
    };
}

export default connect(mapStateToProps)(LoginScreen);
const dimensions = Dimensions.get('window');
const imageWidth = dimensions.width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 15,
    backgroundColor: '#00AAF7',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    marginBottom: 30
  },
  welcomeText: {
    color: '#FFF',
    marginBottom: 30,
    fontSize: 16.5,
    textAlign: 'center'
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,

  },
  button__text: {
    color: '#333',
    fontSize: 15
  }
});

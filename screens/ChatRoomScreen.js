import React from 'react';
import { connect } from 'react-redux';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Alert
} from 'react-native';
import ChatRoom from '../components/ChatRoom';
import { ifIphoneX, isIphoneX } from 'react-native-iphone-x-helper';
import { chataboxActiveRoomOpen} from "../redux/actions/messages";
import Spinner from 'react-native-loading-spinner-overlay';

class ChatRoomScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    let participantName = 'Chat Room'
    if (navigation.state.params) participantName = navigation.state.params.participantName
     return {
       headerTitle: participantName,
     }
   }


   constructor(props) {
    super(props);
    this.state = {
      spinner: false,
      timer: null
    };

  }

  componentDidMount() {

    const roomData = this.props.navigation.getParam('roomData', null);
    const messages = this.props.navigation.getParam('messages', null);


    if(roomData && messages){
      this.props.chataboxActiveRoomOpen(roomData, messages);

      this.props.navigation.setParams({
        participantName: roomData.participantName ? roomData.participantName : 'Chat Room',
      });

    }

    const loading = this.props.activeRoomLoading;

    if (loading && !this.state.spinner) {
      const timer = setTimeout(() => {
        Alert.alert(
          'Sorry!',
          'Something seems to have gone wrong, please try again later',
          [
            {text: 'Okay', onPress: () => this.props.navigation.navigate('Home')},
          ],
          {cancelable: false},
        );
      }, 6000);

      this.setState({
        spinner: true,
        timer: timer
      });


    } else if(!loading && this.state.spinner) {
      clearTimeout(this.state.timer);

      setTimeout(() => {
        this.setState({
          spinner: false,
          timer: null
        });
      }, 1000);

    }

  }


componentDidUpdate() {

  const loading = this.props.activeRoomLoading;
  if (loading && !this.state.spinner) {

    const timer = setTimeout(() => {
      Alert.alert(
        'Sorry!',
        'Something seems to have gone wrong, please try again later',
        [
          {text: 'Okay', onPress: () => this.props.navigation.navigate('Home')},
        ],
        {cancelable: false},
      );
    }, 3000);

    this.setState({
      spinner: true,
      timer: timer
    });


  } else if(!loading && this.state.spinner) {
    this.clearTimeout(this.state.timer)  ;
    this.setState({
      spinner: false,
      timer: null
    });
  }
}

  render() {
    return (
      <View style={{flex:1}}>
      <Spinner
          visible={this.state.spinner}
          textContent={'Loading...'}
          textStyle={styles.spinnerTextStyle}
        />
      <ChatRoom/>
      </View>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
    return {
        displayName: state.auth.displayName,
        activeRoomParticipantName: state.messages.activeRoomParticipantName,
        activeRoomLoading: state.messages.activeRoomLoading,
    };
}


function mapDispatchToProps(dispatch) {
  return {
    chataboxActiveRoomOpen: function(roomData) {
      return new Promise((resolve, reject) => {
        dispatch(chataboxActiveRoomOpen(roomData));
        resolve()
      })
    },
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(ChatRoomScreen);

const styles = StyleSheet.create({
  spinnerTextStyle: {
    color: '#FFF'
  },
});

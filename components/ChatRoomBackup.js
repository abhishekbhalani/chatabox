import React from 'react';
import { connect } from 'react-redux';
import { sendMessageWithRedux, updateLastSeenWithRedux } from "../redux/actions/messages";
import { fetchMessagesWithRedux, createRoomWithRedux } from "../redux/actions/messages";
import { chataboxSignalRSeenGeneralMessage, chataboxSignalRSeenServiceMessage } from "../redux/actions/auth";
import { StyleSheet, Text, View, Button, SafeAreaView, KeyboardAvoidingView, Platform} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { ifIphoneX, isIphoneX } from 'react-native-iphone-x-helper'
import KeyboardSpacer from 'react-native-keyboard-spacer';

class ChatRoom extends React.Component {


   constructor(props) {
    super(props);
    this.state = {
     messages: [],
     messagesDisplayed: [],
     roomId : '',
     currentPage: 1,
     messagesIncrement: 18,
     roomParticipantId: null,
     roomParticipantName: null,
     refreshMessages: true,
     addingNewMessage: false,
     loadingNewMessage: false,
   };
  }

  componentDidMount() {
    if(!this.state.messagesDisplayed.length && this.state.refreshMessages){
      this.loadMessages();
    }
  }
  componentDidUpdate(prevProps) {
    //incoming message delivered by signalR
    if(this.props.signalRNewGeneralMessage && !this.state.addingNewMessage){
      this.loadNewMessage();
    }

    if(this.props.signalRNewServiceMessage){
      this.updateMessageStatus();
    }

    // Check if roomId been entered
    if(!this.state.messagesDisplayed.length && this.state.refreshMessages){
      this.loadMessages();
    }

    // If room id removed, kill room
    if(!this.props.roomId && !this.props.tagSelected.length){
      this.killRoom();
    }

  }

  // update latest message Status
  updateMessageStatus() {
    console.log("update message status");
    const { signalRNewServiceMessage, signalRServiceMessages } = this.props;
    if(!signalRNewServiceMessage || !signalRServiceMessages.length){
      return;
    }

    const chatMessages = this.state.messagesDisplayed;
    let newChatMessages = chatMessages;



    const message = signalRServiceMessages[signalRServiceMessages.length-1];

    const status = message.Status;
    const messageId = message.RoomMessageId;
    const room = message.RoomId;

    const thisRoom = this.props.roomId;

    if(room === thisRoom) {
      if(status !== -1){
        newChatMessages[0].received = true;
        this.setState({
          messagesDisplayed: newChatMessages
        }, () =>{
          this.updateLastSeen(messageId);
        });
      }
    }

    this.props.seenNewServiceMessage();
  }

  //incoming message delivered by signalR
  loadNewMessage(messages = []) {
    console.log("LOADING NEW MESSAGE single");
    const { signalRNewGeneralMessage, signalRGeneralMessages } = this.props;
    if(!signalRNewGeneralMessage || !signalRGeneralMessages.length){
      return;
    }

    const generalMessage = signalRGeneralMessages[signalRGeneralMessages.length-1];
    const { roomParticipantName, roomParticipantId } = this.state;
    const avatarName = roomParticipantName ? roomParticipantName.replace('+', '') : '';
    const avatar = avatarName.match(/^\d/) ? "https://dolfin.com/wp-content/uploads/2018/06/placeholder-team-pic_small.jpg" : "";

    const checkArray = this.state.messagesDisplayed.findIndex(x => x._id == generalMessage.Id);

    if(checkArray !== -1){
      return;
    }
    let msg =  {
      _id: String(generalMessage.Id),
      text: generalMessage.Text,
      createdAt: generalMessage.TimeStamp,
      user: {
        _id: String(roomParticipantId),
        name: roomParticipantName,
        avatar: avatar
      }
    }

    //check for duplicates


    this.setState(previousState => ({
      messagesDisplayed: GiftedChat.append(previousState.messagesDisplayed, msg),
    }));

    this.props.seenNewGeneralMessage();
    this.updateLastSeen();

  }

  killRoom = () => {

    const {roomId} = this.props;
    const { messagesDisplayed } = this.state;

    if(!roomId && messagesDisplayed.length) {
      this.setState({ messagesDisplayed: [] });
    }
  }
  // initial translate messages into gifted chat
  loadMessages = () => {

    console.log('-----LOADING MESSAGES INTO STATE------');
    const givenRoom = parseInt(this.props.roomId);
    const stateRooms = this.props.stateMessages;


    if(!givenRoom){
      return;
    }

    const thisRoom = stateRooms.filter(obj => {
      return obj.Id === givenRoom;
    })

    if(!thisRoom.length){
      return;
    }

    const messages = thisRoom[0].Messages.$values;
    const participants = thisRoom[0].Participants.$values.length > 0 ? true : false;
    const userName = this.props.displayName;
    const userId = this.props.id;
    const participantName = participants ? thisRoom[0].Participants.$values[0].Name : userName;
    const givenParticipantName = this.props.participantName;
    const participantId = participants ? thisRoom[0].Participants.$values[0].Id : userId + '1234567';
    const avatarName = givenParticipantName ? givenParticipantName.replace('+', '') : participantName.replace('+', '');
    const avatar = avatarName.match(/^\d/) ? require('../assets/images/chatabox-blank-avatar.png') : "";

    const limit = this.state.currentPage * this.state.messagesIncrement;

    const messagesArray = [];

    if(messages.length){
      for (const message of messages ) {

        let received = false;
        if(message.ServiceMessages.$values.length){
          received = message.ServiceMessages.$values[0].Status !== -1 ? true : false
        } else {
          received = true;
        }

        let msg =  {
          _id: String(message.Id),
          text: message.Text,
          sent: true,
          received: received,
          createdAt: message.TimeStamp,
          user: {
            _id: message.Direction === -10 ? String(participantId) : String(userId),
            name: givenParticipantName ? givenParticipantName : avatarName,
            avatar: avatar
          }
        }

        messagesArray.push(msg);

      }
    }

    const reverseArray = messagesArray.reverse();
    const limitedArray = reverseArray.slice(0,limit);

    this.setState({ messages : reverseArray, messagesDisplayed : limitedArray, roomId : givenRoom, roomParticipantId : participantId, roomParticipantName : givenParticipantName, refreshMessages: false}, () => {
      // update last seen to api
      this.updateLastSeen();
    });


  }



  prepareMessages(){
    console.log("prepare message");
    const { messagesDisplayed } = this.state;

    return messagesDisplayed;
  }

  updateLastSeen(givenMessageId){

    const {messagesDisplayed, roomId} = this.state;

    if(!messagesDisplayed || !messagesDisplayed.length || !roomId){
      return;
    }

    let lastSeen;
    if(givenMessageId){
      lastSeen = givenMessageId;
    } else {
      lastSeen = Math.max.apply(Math, messagesDisplayed.map(function(o){ return o._id }));
    }


    this.props.updateApiLastSeen(roomId, lastSeen, this.props.authChataboxToken);

    this.setState({updateLastSeenMessage: false});

  }
  // pagination  - user scrolled to top of page to load more messages
  loadMoreMessages(){
    const current = this.state.currentPage;
    this.setState({
      currentPage: current + 1,
    }, () => {
      const limit = this.state.currentPage * this.state.messagesIncrement;
      const messagesArray = this.state.messages;
      const limitedArray = messagesArray.slice(0,limit);
      this.setState({messagesDisplayed : limitedArray });
    });
  }

  // detect if scrolling near top of page
  isCloseToTop({ layoutMeasurement, contentOffset, contentSize }){
    const paddingToTop = 80;
    return contentSize.height - layoutMeasurement.height - paddingToTop <= contentOffset.y;
  }


  // send new message
  // sendMessages(messages = []) {
  //
  //   const messageText = messages[0].text ? messages[0].text : '';
  //   const roomId = this.state.roomId;
  //
  //
  //
  //   messages[0].sent = true;
  //
  //   this.props.sendMessage(messageText, roomId, this.props.authChataboxToken).then(() => {
  //
  //     const messageId = messages[0]._id;
  //     this.setState(previousState => ({
  //       messagesDisplayed: GiftedChat.append(previousState.messagesDisplayed, messages),
  //     }));
  //
  // if(this.props.handleEngageChatRoom){
  //   this.props.handleEngageChatRoom(
  //     {
  //       status: true,
  //       title: this.state.roomParticipantName
  //     }
  //   );
  // }

  //
  //   });
  // }
  sendMessages(messages = []) {

    const { tagSelected } = this.props;
    const messageText = messages[0].text ? messages[0].text : '';

    if(!this.props.roomId && tagSelected){

      const number = tagSelected[0].number ? tagSelected[0].number : null;
      const phoneNumber = number.replace(/\s/g, '');
      const contactUri = tagSelected[0].contactUri;
      const name = tagSelected[0].name ? tagSelected[0].name : phoneNumber;

         if(this.props.handleEngageChatRoom){
           this.props.handleEngageChatRoom(
             {
               status: true,
               title: name
             }
           );
         }


          if(name, phoneNumber, contactUri){

            messages[0].sent = true;

            this.props.createRoomSendMessage(name, contactUri, phoneNumber, messageText, this.props.userEmail, this.props.authChataboxToken).then(() => {
              this.setState(previousState => ({
                messagesDisplayed: GiftedChat.append(previousState.messagesDisplayed, messages),
              }));
              if(!this.props.messagesError){
                messages[0].received = true;
              }
            });
          }

    } else {

          const messageText = messages[0].text ? messages[0].text : '';
          const roomId = this.props.roomId;
          messages[0].sent = true;

          let name;

          if(tagSelected) {
            const number = tagSelected[0].number ? tagSelected[0].number : null;
            const phoneNumber = number.replace(/\s/g, '');
            const contactUri = tagSelected[0].contactUri;
            name = tagSelected[0].name ? tagSelected[0].name : phoneNumber;

                   if(this.props.handleEngageChatRoom){
                     this.props.handleEngageChatRoom(
                       {
                         status: true,
                         title: name
                       }
                     );
                   }

         } else {
           name = this.state.roomParticipantName;
         }


          this.props.sendMessage(messageText, roomId, this.props.authChataboxToken).then(() => {
            this.setState(previousState => ({
              messagesDisplayed: GiftedChat.append(previousState.messagesDisplayed, messages),
            }));
            if(!this.props.messagesError){
              messages[0].received = true;
              console.log("SENT MESSAGE");
              // this.setState({fullChatRoom:true, pageTitle: name.length ? name : number });
            }

        });
        }


  }

  render() {

    return (
      <View style={styles.container}>
        <GiftedChat
          bottomOffset={ifIphoneX(16, 0)}
          user={{
            _id: String(this.props.id)
          }}
          listViewProps={{
                scrollEventThrottle: 400,
                onScroll: ({ nativeEvent }) => { if (this.isCloseToTop(nativeEvent)) this.loadMoreMessages(); }
            }}
          messages={this.prepareMessages()}
          onSend={messages => this.sendMessages(messages)}

        />
        {
        isIphoneX() &&
        <View style={{ height: 16, backgroundColor:'white'  }} />
        }

        {Platform.OS === 'android' ? <KeyboardSpacer /> : null }


      </View>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
    return {
        authChataboxToken: state.auth.authChataboxToken,
        displayName: state.auth.displayName,
        id: state.auth.id,
        userEmail: state.auth.email,
        chataboxInit: state.auth.chataboxInit,
        stateMessages: state.messages.messages,
        messagesError: state.messages.error,
        messagesLoading: state.messages.loading,
        signalRSubscribed: state.auth.signalRSubscribed,
        signalRError: state.auth.signalRError,
        signalRConnectionId: state.auth.signalRConnectionId,
        signalRServiceMessages: state.auth.signalRServiceMessages,
        signalRNewServiceMessage: state.auth.signalRNewServiceMessage,
        signalRGeneralMessages: state.auth.signalRGeneralMessages,
        signalRNewGeneralMessage: state.auth.signalRNewGeneralMessage
    };
}
function mapDispatchToProps(dispatch) {
  return {
    fetchMessages: function(authChataboxToken, contacts) {
      return new Promise((resolve, reject) => {
        dispatch(fetchMessagesWithRedux(authChataboxToken, contacts));
      resolve()
      })
    },
    createRoomSendMessage: function(name, contactUri, phoneNumber, messageText, userEmail, authChataboxToken) {
      return new Promise((resolve, reject) => {
      dispatch(createRoomWithRedux(name, contactUri, phoneNumber, messageText, userEmail, authChataboxToken));
      resolve()
    })
    },
    sendMessage: function(message, roomId, authChataboxToken) {
      return new Promise((resolve, reject) => {
        dispatch(sendMessageWithRedux(message, roomId, authChataboxToken));
      resolve()
    })
  },
  updateApiLastSeen: function(roomId, lastSeen, authChataboxToken) {
    dispatch(updateLastSeenWithRedux(roomId, lastSeen, authChataboxToken));
  },
    seenNewGeneralMessage: function() {
      dispatch(chataboxSignalRSeenGeneralMessage());
    },
    seenNewServiceMessage: function() {
      dispatch(chataboxSignalRSeenServiceMessage());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatRoom);



const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

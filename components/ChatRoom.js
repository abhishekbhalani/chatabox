import React from 'react';
import { connect } from 'react-redux';
import {
  sendMessageWithRedux,
  updateLastSeenWithRedux,
  chataboxActiveRoomMessages,
  chataboxActiveRoomLoadMore,
  chataboxClearRoom,
  chataboxActiveRoomAppendMessage
  } from "../redux/actions/messages";
import { fetchMessagesWithRedux, createRoomWithRedux } from "../redux/actions/messages";
import { chataboxSignalRSeenGeneralMessage, chataboxSignalRSeenServiceMessage, chataboxFetchUsableCredit } from "../redux/actions/auth";
import { StyleSheet, Text, View, Button, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { ifIphoneX, isIphoneX } from 'react-native-iphone-x-helper'
import KeyboardSpacer from 'react-native-keyboard-spacer';


class ChatRoom extends React.Component {
_isMounted = false;

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

   this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this.updateLastSeen();
    this.props.chataboxFetchUsableCredit(this.props.authChataboxToken);
  }

  componentDidUpdate() {
    //incoming message delivered by signalR
    if(this.props.signalRNewGeneralMessage){
      this.loadNewMessage();
    }




  }
  componentWillUnmount() {

    this.props.chataboxClearRoom();
    this._isMounted = false;

  }

  prepareMessages(){
    const { activeRoomMessages } = this.props;
    return activeRoomMessages;
  }

  // pagination  - user scrolled to top of page to load more messages
  loadMoreMessages(){
    if(this._isMounted && this.props.activeRoomMessages.length > 10 && !this.props.messagesLoading && !this.state.loadingNewMessage) {
      console.log('load more');


      this.setState({ loadingNewMessage : true }, () => {
        /* stops duplicate firing */
        this.props.chataboxActiveRoomLoadMoreMessages();
        setTimeout(() => {
          this.setState({ loadingNewMessage : false });
        }, 1000);
      });
    }
  }

  renderFooter() {
      const credit = this.props.userUsableCredit;
      let message = null;

      if(credit < 0.1) {
          message = 'You are out of credit, please top up'
      } else if (credit > 0.1 && credit < 1) {
          message = 'You are running low on credit'
      }

      if(message) {
        return (
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {message}
            </Text>
          </View>
        );
      }
      return null
  }


  //incoming message delivered by signalR
  loadNewMessage() {
    console.log("LOADING NEW MESSAGE single");
    const { signalRNewGeneralMessage, signalRGeneralMessages } = this.props;
    if(!signalRNewGeneralMessage || !signalRGeneralMessages.length){
      return;
    }

    const generalMessage = signalRGeneralMessages[signalRGeneralMessages.length-1];

    const roomParticipantName = this.props.activeRoomParticipantName;
    const roomParticipantId = this.props.activeRoomParticipantId;
    const avatarName = roomParticipantName ? roomParticipantName.replace('+', '') : '';
    const avatar = avatarName.match(/^\d/) ? require('../assets/images/chatabox-blank-avatar.png') : "";

    const checkArray = this.props.activeRoomMessages.findIndex(x => x._id == generalMessage.Id);

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

    /* rework to allow multiple messages incoming */
    let messages = [];
    messages.push(msg);

    this.props.chataboxActiveRoomAppendMessage(messages);

    //this.props.seenNewGeneralMessage();
    this.updateLastSeen();

  }


  updateLastSeen(givenMessageId){

    const { activeRoomMessages } = this.props;
    const roomId = this.props.activeRoomId;

    if(!activeRoomMessages || !activeRoomMessages.length || !roomId){
      return;
    }

    let lastSeen;
    if(givenMessageId){
      lastSeen = givenMessageId;
    } else {
      lastSeen = Math.max.apply(Math, activeRoomMessages.map(function(o){ return o._id }));
    }


    this.props.updateApiLastSeen(roomId, lastSeen, this.props.authChataboxToken);

  }


  // detect if scrolling near top of page
  isCloseToTop({ layoutMeasurement, contentOffset, contentSize }){
    const paddingToTop = 30;
    return contentSize.height - layoutMeasurement.height - paddingToTop <= contentOffset.y;
  }


  killRoom(){
    if(this._isMounted) {
      this.props.chataboxClearRoom();
    }
  }


  sendMessages(messages = []) {

    const { tagSelected } = this.props;

    const tagsAvailable = tagSelected ?
      tagSelected.length ? true : false
      : false;


    const messageText = messages[0].text ? messages[0].text : '';

    if(!this.props.activeRoomId && !tagsAvailable){
      return;
    }

    if(!this.props.activeRoomId){

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

            this.props.createRoomSendMessage(name, contactUri, phoneNumber, messageText, this.props.userEmail, this.props.authChataboxToken).then(() => {
              if(this._isMounted) {
                this.props.chataboxActiveRoomAppendMessage(messages);
              }
            });
          }

    } else {

          const messageText = messages[0].text ? messages[0].text : '';
          const roomId = this.props.activeRoomId;

          let name;

          if(tagsAvailable) {
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
            if(this._isMounted) {
              this.props.chataboxActiveRoomAppendMessage(messages);
              // this.setState(previousState => ({
              //   messagesDisplayed: GiftedChat.append(previousState.messagesDisplayed, messages),
              // }));
            }


        });
        }

        this.props.chataboxFetchUsableCredit(this.props.authChataboxToken);

  }

  render() {

    return (
      <View style={styles.container}>

        <GiftedChat
          bottomOffset={ifIphoneX(16, 0)}
          user={{
            _id: String(this.props.activeRoomUserId)
          }}
          listViewProps={{
                scrollEventThrottle: 400,
                onScroll: ({ nativeEvent }) => { if (this.isCloseToTop(nativeEvent)) this.loadMoreMessages(); }
            }}
          messages={this.prepareMessages()}
          onSend={messages => this.sendMessages(messages)}
          renderFooter={() => this.renderFooter()}

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
        userUsableCredit: state.auth.userUsableCredit,
        authChataboxToken: state.auth.authChataboxToken,
        displayName: state.auth.displayName,
        chataboxInit: state.auth.chataboxInit,
        activeRoomId: state.messages.activeRoomId,
        activeRoomMessages: state.messages.activeRoomMessages,
        activeRoomMessagesPage: state.messages.activeRoomMessagesPage,
        activeRoomLoading:  state.messages.activeRoomLoading,
        activeRoomUserId: state.messages.activeRoomUserId,
        activeRoomUserName: state.messages.activeRoomUserName,
        activeRoomParticipantId: state.messages.activeRoomParticipantId,
        activeRoomParticipantName: state.messages.activeRoomParticipantName,
        stateMessages: state.messages.messages,
        messagesError: state.messages.error,
        messagesLoading: state.messages.loading,
        signalRSubscribed: state.auth.signalRSubscribed,
        signalRError: state.auth.signalRError,
        signalRConnectionId: state.auth.signalRConnectionId,
        signalRServiceMessages: state.auth.signalRServiceMessages,
        signalRNewServiceMessage: state.auth.signalRNewServiceMessage,
        signalRGeneralMessages: state.auth.signalRGeneralMessages,
        signalRNewGeneralMessage: state.auth.signalRNewGeneralMessage,
    };
}
function mapDispatchToProps(dispatch) {
  return {
    convertChataboxMessagesToGiftedChat: function(chataboxMessages, page){
      return new Promise((resolve, reject) => {
        dispatch(convertChataboxMessagesToGiftedChat(chataboxMessages, page));
      resolve()
      })
    },
    chataboxActiveRoomAppendMessage: function(messages) {
      dispatch(chataboxActiveRoomAppendMessage(messages));
    },
    chataboxActiveRoomLoadMoreMessages: function() {
      dispatch(chataboxActiveRoomLoadMore());
    },
    chataboxClearRoom: function() {
      dispatch(chataboxClearRoom());
    },
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
  },
  chataboxFetchUsableCredit: function(authChataboxToken) {
    dispatch(chataboxFetchUsableCredit(authChataboxToken));
  },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatRoom);



const styles = StyleSheet.create({
  container: {
    flex: 1
  },

  footerContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#aaa',
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
});

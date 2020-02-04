import React from 'react';
import { connect } from 'react-redux';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Button,
  Content,
  Alert,
  Linking,
} from 'react-native';
import { Notifications } from 'expo';
import helpers from '../constants/Helpers';
import { ListItem, SearchBar, Icon, Avatar } from "react-native-elements";
import { chataboxInitiate, checkTokenExpiry } from "../redux/actions/auth";
import { fetchContactsWithRedux } from "../redux/actions/contacts.js";
import { fetchMessagesWithRedux, chataboxActiveRoomOpen, chataboxFetchMessagesPollingBegin } from "../redux/actions/messages";
import { chataboxSignalRSeenGeneralMessage } from "../redux/actions/auth";

import Moment from 'moment';
import { Ionicons } from '@expo/vector-icons';

import Color from '../constants/Colors';

const { carrot, emerald, peterRiver, wisteria, alizarin, turquoise, midnightBlue } = Color;


class HomeScreen extends React.Component {

_isMounted = false;


 static navigationOptions = ({ navigation }) => {
    const { state } = navigation
    return {
      headerTitle: 'Chats',
      headerLeft: <Icon
                      name="gear"
                      type='evilicon'
                      size={30}
                      color='#fff'
                      underlayColor={'#00AAF7'}
                      onPress={() => state.params.headerNavigation('Settings')}
                      containerStyle={{ marginLeft: 10}}
                  />,
      headerRight: <Icon
                      name="plus"
                      type='evilicon'
                      size={32}
                      color='#fff'
                      underlayColor={'#00AAF7'}
                      onPress={() => state.params.headerNavigation('NewChatRoom')}
                      containerStyle={{ marginRight: 10}}
                  />,
    }
  }

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      data: [],
      messagesDisplayed: [],
      messagesIncrement: 15,
      currentPage: 1,
      error: null,
      refreshing: false,
      searchInit: false,
      searchFocus: false,
      search: ''
    };
  }
  componentDidMount() {
    this._isMounted = true;
    if(!this.props.authError && this.props.chataboxInitiated){
      this.initiateApplication(this._isMounted);
    }

    this.props.navigation.setParams({ headerNavigation: this.handleHeaderNavigation });

   /* listen to push function & trigger _handleNotification
      needs to be globally applied to root component... not working yet
      so this is a temporary fix */
  this._notificationSubscription = Notifications.addListener(this._handleNotification);
 }

 componentWillUnmount() {
     this._isMounted = false;
   }
 initiateApplication(mounted) {

   /* Initiate contacts & rooms to load into app */

   if(!this.props.contacts.length && this.props.contactsRefresh && mounted){

     this.props.fetchContacts(this.props.authGraphToken);
   }
   if(!this.props.messages.length && this.props.messageRefresh && mounted){
     this.props.fetchMessages(this.props.authChataboxToken, this.props.messagesPolling).then(() => {
       if(this._isMounted){
         this.setState({refreshing : false});

         if(!this.props.messagesPolling){
           /* start polling messages every 2 mins */

           this.props.chataboxFetchMessagesPollingBegin();

           setInterval(() => {
             this.props.fetchMessages(this.props.authChataboxToken, true, false);
             this.props.checkTokenExpiry(this.props.authChataboxToken, this.props.authRefreshToken, this.props.authCredentials);
           }, 120000);


         }
       }
     });
   }

   /* NEED TO INTRODUCE ERROR CLAUSE / 'THERE ARE NO MESSAGES TO DISPLAY' */

 }

/* ---------------------------------------*/
/* ----------- Start Handlers ----------- */
/* ---------------------------------------*/


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

     this.props.navigation.navigate('ChatRoomScreen', {roomData: roomData, messages: messages});

}

handleHeaderNavigation = (page) => {
  if(!page){ return }

  this.props.navigation.navigate(page);

}
 handleRefresh = () => {

   /* refresh messages */
   if(this._isMounted){
     this.setState({
       refreshing: true,
     },
     () => {
       this.props.fetchMessages(this.props.authChataboxToken, this.props.messagesPolling).then(() => {
         this.setState({refreshing : false});
       });
     })
   }
 }

 handleLoadMore = () => {

   /* load more messages */

   const current = this.state.currentPage;
   if(this._isMounted){
     this.setState({
       currentPage: current + 1,
     });
   }
 }


 /* ---------------------------------------*/
 /* ------------ End Handlers ------------ */
 /* ---------------------------------------*/



 /* ---------------------------------------*/
 /* ----------- Start Renderers ---------- */
 /* ---------------------------------------*/

  renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: "83%",
          backgroundColor: "#CED0CE",
          marginLeft: "17%"
        }}
      />
    );
  };

  renderHeader = () => {

    const { search } = this.state

    return (

      <SearchBar
        placeholder="Search messages"
        platform={Platform.OS}
        onChangeText={this.searchMessages}
        value={search}
        />


    );
  };

  renderTimestamp = (item) => {

    const messages = item.Messages.$values.length ? item.Messages.$values : [];
    const latestTimestamp = messages.length ? messages[messages.length-1].TimeStamp : null;

    if(!latestTimestamp){
      return;
    }
    Moment.locale('en');
    let timeDisplay;
    const today = Moment();
    const yesterday = Moment().subtract(1, 'days');
    const week = Moment().subtract(1, 'weeks');
    if(Moment(latestTimestamp).isSame(today, 'day')){
      timeDisplay = Moment(latestTimestamp).format('HH:mm');
    } else if (Moment(latestTimestamp).isSame(yesterday, 'day')){
      timeDisplay = 'Yesterday';
    } else if (Moment(latestTimestamp).isAfter(week, 'day') && Moment(latestTimestamp).isBefore(yesterday, 'day') ) {
      timeDisplay = Moment(latestTimestamp).format('dddd');
    } else {
      timeDisplay = Moment(latestTimestamp).format('l');
    }
    const unreadNumber = this.renderBadge(item);


    if(unreadNumber > 0){
      return(
        <View style={styles.listItemRightContainer}>
          <Text style={styles.listItemRightTimestamp} adjustsFontSizeToFit>{timeDisplay}</Text>
          <Text style={styles.listItemRightBadge}>{unreadNumber}</Text>
          <View style={styles.listItemRightBuffer}></View>
        </View>
      )
    } else {
      return(
        <View style={styles.listItemRightContainer}>
          <Text style={styles.listItemRightTimestamp} adjustsFontSizeToFit>{timeDisplay}</Text>
          <View style={styles.listItemRightBuffer}></View>
        </View>
      )
    }
  }
  renderBadge = (item) => {

    const messages = item.Messages.$values.length ? item.Messages.$values : [];
    const firstMessage = messages.length ? messages[0].Id : 0
    const lastSeen = item.LastSeen ? item.LastSeen : firstMessage;
    const messageIds = [];
    if(messages.length){
      messages.forEach(function(value) {
        messageIds.push(value.Id);
      });
    }
    if(messages.length){


        const findIndex = messages.findIndex(x => x.Id==lastSeen);
        let unreadNumber = 0;
        if(findIndex !== -1){
          //IF HAS MESSAGES AND SOME UNREAD
          const spliceMessages = messageIds.slice(findIndex, messageIds.length);

          // minus one to account for spliceMessages containing self
          unreadNumber = spliceMessages.length-1;
        } else if (findIndex === -1  && lastSeen){
          // IF HAS MESSAGES BUT ALL UNREAD
          unreadNumber = messages.length;
        } else {
          unreadNumber = 0;
        }
      if(unreadNumber === 0){
        return;
      } else {
        // return { value: unreadNumber, textStyle: { color: 'white' }, containerStyle: { backgroundColor:'#00AAF7', padding: 0, paddingLeft: 8, paddingRight: 8 } };
        return unreadNumber;
      }
    } else {
        // IF HAS NO MESSAGES EVER
      return ;
    }
  }

  renderAvatar = (item) => {
    const { messages, contacts, displayName} = this.props;
    let roomParticipant = String(helpers.retrieveNameFromRoomObject(item, contacts, displayName));

    let avatarImage = null;
    const defaultAvatarImage = require('../assets/images/chatabox-blank-avatar.png');
    const safeRoomParticipant = roomParticipant.replace('+', '');
    const roomParticipantType = safeRoomParticipant.match(/^\d/) ? "number" : 'string';

    let sumChars = 0;
    for (let i = 0; i < roomParticipant.length; i += 1) {
      sumChars += roomParticipant.charCodeAt(i);
    }

    const colors = [carrot, emerald, peterRiver, wisteria, alizarin, turquoise, midnightBlue];

    const avatarColor = colors[sumChars % colors.length];

    if(roomParticipantType === 'string'){
      const matches = roomParticipant.match(/\b(\w)/g); // ['J','S','O','N']
      const roomParticipantInitials = matches.slice(0,2).join('');
      return (
        <Avatar
          rounded
          medium
          overlayContainerStyle={{backgroundColor: avatarColor, overflow: 'hidden'}}
          title={roomParticipantInitials}
          activeOpacity={0.7}
        />
      );
    } else if(contacts && roomParticipantType==='number'){
      const comparison = helpers.retrieveNameFromContacts(roomParticipant, contacts);
      if(comparison){
         avatarImage  = comparison.imageUri ? comparison.imageUri : defaultAvatarImage;
      } else {
        avatarImage = defaultAvatarImage;
      }
      return (
        <Avatar
          rounded
          medium
          overlayContainerStyle={{backgroundColor: '#eee', overflow: 'hidden'}}
          source={avatarImage}
          activeOpacity={0.7}
        />
    );
    } else {
      avatarImage = defaultAvatarImage;
      return (
        <Avatar
          rounded
          medium
          overlayContainerStyle={{backgroundColor: '#eee', overflow: 'hidden'}}
          source={avatarImage}
          activeOpacity={0.7}
        />
    );
    }


  };

  renderMessageTitle = (room) => {
    const { contacts, displayName} = this.props;
    const roomName = helpers.retrieveNameFromRoomObject(room, contacts, displayName)
    return roomName;
  };

  renderMessagePreview = (room) => {
    const messages = room.Messages.$values.length ? true : false;
    const message = messages ? room.Messages.$values[room.Messages.$values.length-1] : '';
    const messageText = message.Text ? message.Text : '';

    const messageEllipsis = messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText;
    return messageEllipsis;
  }

  renderFooter = () => {
    if (!this.state.refreshing) return null;

    return (
      <View
        style={{
          paddingVertical: 20,
          borderTopWidth: 1,
          borderColor: "#CED0CE"
        }}
      >
        <ActivityIndicator animating size="large" />
      </View>
    );
  };


  /* ---------------------------------------*/
  /* ------------ End Renderers ----------- */
  /* ---------------------------------------*/


  /* ---------------------------------------*/
  /* ----------- Start Actions ------------ */
  /* ---------------------------------------*/

  /* Search, Open, Prepare etc. */

  searchMessages = search => {
    if(this._isMounted){
      this.setState({ search });
    }
    const query = search;
    const { messages } = this.props;
    const { searchInit, messagesDisplayed } = this.state;
    if(query.length > 1) {
      if(!searchInit && this._isMounted){
        this.setState({ searchInit : true });
      }
      const stripPlus = query.replace('+', '');
      const queryType = stripPlus.match(/^\d/) ? "number" : 'string';
      const keyword = query;
      let filteredData = [];

      if(queryType === 'string'){
        filteredData = messages.filter(function(obj) {
          if(obj.Participants.$values.length){
        	   return obj.Participants.$values[0].Name.toLowerCase().includes(keyword.toLowerCase());
           }
        });
    } else {
      filteredData = messages.filter(function(obj) {
        if(obj.Participants.$values.length){
           return obj.Participants.$values[0].SfBPhoneNumber.PhoneNumber.toLowerCase().includes(keyword.toLowerCase());
         }
      });
    }
      if(this._isMounted){
        this.setState({ messagesDisplayed : filteredData });
      }
    } else {
      if(this._isMounted){
        this.setState({ searchInit : false, messagesDisplayed : [] });
      }
    }
  }

  openChatRoom = (item) => {
    if(item !== undefined && item !== null) {

      const { contacts, displayName, messages} = this.props;
      const roomName = helpers.retrieveNameFromRoomObject(item, contacts, displayName)

      const roomData = {
        roomId: item.Id,
        userName: this.props.displayName,
        userId: this.props.id,
        participantName: roomName
      }

      this.props.navigation.navigate('ChatRoomScreen', {roomData: roomData, messages: messages});

    } else {
      console.log('error, can not open chat room');
    }
  };

  prepareMessages = () => {

    const { messagesDisplayed, searchInit } = this.state;
    const { messages } = this.props;

    const limit = this.state.currentPage * this.state.messagesIncrement;
    const messagesToShow = searchInit ? messagesDisplayed : messages;
    const sliceMessages = messagesToShow.slice(0, limit);

    // read new messages from signalR

    if(this._isMounted) {
      //this.props.seenNewMessage();
    }


    return sliceMessages;
  }


  /* ---------------------------------------*/
  /* ------------ End Actions ------------- */
  /* ---------------------------------------*/



  render() {

    const loading = this.props.messagesLoading || this.props.contactsLoading ? true : false
    if (loading && !this.state.refreshing) {

      /* if in process of loading messages / contacts show loader */

        return (
          <View style={styles.loadingContainer}>
           <ActivityIndicator size="large"  />
         </View>
        );
    }

    if(this.props.authError){
      return(
        <View style={styles.loadingContainer}>
          <Text style={styles.placeholderText}>We are having issues connecting to your account, please try again later.</Text>
        </View>
      )
    }
    if(this.props.messagesError){
      return(
        <View style={styles.loadingContainer}>
          <Text style={styles.placeholderText}>We are having issues fetching your messages at the moment, please try again later</Text>
        </View>
      )
    }
    if(!this.props.messages.length){
      return(
        <View style={styles.loadingContainer}>
          <Text style={styles.placeholderText}>You currently have no active chats. Start your first chat using the plus icon in the top right</Text>
        </View>
      )
    }
    return (

      /* messages & contacts loaded, show content */

      <View style={styles.container}>
      <StatusBar
     backgroundColor="blue"
     barStyle="light-content"
   />
        <View containerStyle={styles.listContainer}>
          <FlatList
            data={this.prepareMessages()}
            renderItem={({ item }) => (
            <ListItem
              containerStyle={styles.listItemContainer}
              roundAvatar
              chevron
              titleStyle={{justifyContent:'flex-start', paddingRight: 40}}
              titleProps={{numberOfLines: 1}}
              rightContentContainerStyle={styles.listItemRightWrapper}
              rightTitle={this.renderTimestamp(item)}
              rightTitleContainerStyle={styles.listItemRightContainer}
              rightTitleStyle={styles.listItemRight}
              onPress={() => this.openChatRoom(item)}
              title={`${ this.renderMessageTitle(item) }`}
              subtitle={
                <View style={styles.subtitleView}>
                  <Text style={styles.subtitleText}>{this.renderMessagePreview(item)}</Text>
                </View>
              }
              leftAvatar={this.renderAvatar(item)}
            />
          )}
          keyExtractor={(item, key) => 'room-' + item.Id}
          ItemSeparatorComponent={this.renderSeparator}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={this.renderFooter}
          refreshing={this.state.refreshing}
          onRefresh={this.handleRefresh}
          onEndReached={this.handleLoadMore}
          onEndReachedThreshold={Platform.OS === 'ios' ? 0 : 1}
          />
      </View>
      </View>
    );
  }

}

const mapStateToProps = (state, ownProps) => {
    return {
        authCredentials: state.auth.authCredentials,
        authError: state.auth.error,
        id: state.auth.id,
        chataboxInitiated: state.auth.chataboxInitiated,
        authChataboxToken: state.auth.authChataboxToken,
        authGraphToken: state.auth.authGraphToken,
        authRefreshToken: state.auth.authRefreshToken,
        chataboxInitiated: state.auth.chataboxInitiated,
        signalRSubscribed: state.auth.signalRSubscribed,
        signalRError: state.auth.signalRError,
        displayName: state.auth.displayName,
        userEmail: state.auth.email,
        contacts: state.contacts.contactBook,
        contactsRefresh: state.contacts.contactsRefresh,
        contactsLoading: state.contacts.loading,
        messages: state.messages.messages,
        messagesError: state.messages.messagesError,
        messageRefresh: state.messages.messageRefresh,
        messagesLoading: state.messages.loading,
        messagesPolling: state.messages.fetchMessagesPolling
    };
}

function mapDispatchToProps(dispatch) {
  return {
    chataboxFetchMessagesPollingBegin: function() {
      dispatch(chataboxFetchMessagesPollingBegin());
    },
    checkTokenExpiry: function(authChataboxToken, authRefreshToken, CREDENTIALS) {
      dispatch(checkTokenExpiry(authChataboxToken, authRefreshToken, CREDENTIALS));
    },
    chataboxActiveRoomOpen: function(roomData) {
      return new Promise((resolve, reject) => {
        dispatch(chataboxActiveRoomOpen(roomData));
        resolve()
      })
    },
    chataboxSubscribeToSignalR: function(authChataboxToken) {
      dispatch(chataboxSubscribeToSignalR(authChataboxToken));
    },
    chataboxInit: function(authChataboxToken, email) {
      dispatch(chataboxInitiate(authChataboxToken, email));
    },
    fetchContacts: function(authGraphToken) {
      dispatch(fetchContactsWithRedux(authGraphToken));
    },
    fetchMessages: function(authChataboxToken, polling) {
      return new Promise((resolve, reject) => {
        dispatch(fetchMessagesWithRedux(authChataboxToken, polling));
      resolve()
      })
    },
    seenNewMessage: function() {
      dispatch(chataboxSignalRSeenGeneralMessage());
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#fff',
    justifyContent: 'flex-start'
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  placeholderText: {
    textAlign: 'center',
    paddingHorizontal: 30
  },
  flatList: {
    flex: 1,
    flexGrow: 0,
  },
  listContainer: {
    flex: 1,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginTop: 0,
    paddingTop: 0,
  },
  listItemContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  subtitleView: {
    flex: 0.8,
    width: '100%',
    padding: 0,
    margin: 0,
    alignItems: 'stretch',
  },
  subtitleText: {
    color: '#999',
    alignItems: 'stretch',
  },
  listItemRight: {
    justifyContent: 'flex-start',
  },
  listItemRightWrapper: {
    padding: 0,
    margin: 0,
    flex: 0.3,
    position: 'absolute',
    zIndex: 10,
    right: '10%',
    top: 5
  },
  listItemRightContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listItemRightTimestamp: {
    fontSize: 11,
    paddingTop: 3,
    textAlign: 'right',
    color: '#999',
  },
  listItemRightBuffer: {
    width: 10,
    height: 12
  },
  listItemRightBadge: {
    backgroundColor: '#00AAF7',
    color: '#fff',
    width: 'auto',
    borderRadius: 10,
    marginTop: 5,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    overflow: 'hidden'
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);

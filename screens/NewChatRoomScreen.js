import React from 'react';
import ChatRoom from '../components/ChatRoom';
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  Alert,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Notifications } from 'expo';
import helpers from '../constants/Helpers';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { fetchContactsWithRedux, searchContactsQuery } from "../redux/actions/contacts.js";
import {
  fetchMessagesWithRedux,
  sendMessageWithRedux,
  createRoomWithRedux,
  chataboxActiveRoomOpen,
  chataboxClearRoom,
  chataboxCreateNewTag,
  chataboxDeleteTag,
  chataboxDeleteAllTags,
  chataboxExternalTag } from "../redux/actions/messages";
import Autocomplete from '../components/react-native-autocomplete-input';
import { Permissions, Contacts } from 'expo';
import { parsePhoneNumber } from 'libphonenumber-js'
import { ListItem, SearchBar, Icon, Avatar} from "react-native-elements";
import { Ionicons } from '@expo/vector-icons';
import { ifIphoneX, isIphoneX } from 'react-native-iphone-x-helper'
import Spinner from 'react-native-loading-spinner-overlay';

const CONTACT_PAGE_SIZE = 100;

class NewChatRoomScreen extends React.Component {

  _isMounted = false;

  static navigationOptions = ({ navigation }) => {
     const { state } = navigation;
     return {
       title: typeof(navigation.state.params)==='undefined' || typeof(navigation.state.params.title) === 'undefined' ? 'New Message': navigation.state.params.title,
       headerTintColor: '#fff',
       headerStyle: {
       backgroundColor: '#00AAF7'
       },
     }
   }

   _rawContacts = {};

   constructor(props) {
      super(props);

      this.state = {
        permission: null,
        refreshing: false,
        showResults: false,
        numberInputFocus: true,
        messageInputFocus: false,
        messageInputPointerEvents: 'auto',
        messages: [],
        roomId: null,
        pageTitle: 'New Message',
        fullChatRoom: false,
        listHeight: 300,
        spinner: false,
        timer: null
      };

    }


  _headerCancel() {
      this.props.navigation.navigate('Home');
  }


componentDidMount() {
  this._isMounted = true;
  this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);

  // if(!this.props.contacts.length){
  //   this.props.fetchContacts(this.props.authToken);
  // }

   this.props.navigation.setParams({
     headerCancel: () => this._headerCancel(),
   });

   this._notificationSubscription = Notifications.addListener(this._handleNotification);

 }

 componentWillUnmount() {
    this._isMounted = false;
    this.props.chataboxDeleteAllTags();
  }
 componentDidUpdate(prevProps, prevState) {
   const { navigation } = this.props;


   /* update from add contact screen */
   if(this.props.newRoomExternalTags){

     this.props.chataboxExternalTag(false);
     this.loadChatRoom();

     // this._input.focus();
   }


   const loading = this.props.activeRoomLoading;


   if (loading && !this.state.spinner) {
     console.log('LOADING : ' + loading);
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


   } else if(!loading && this.state.spinner && this.state.timer) {
     clearTimeout(this.state.timer);

     this.setState({
       spinner: false,
       timer: null
     });

   }


}


 _handleNotification = (notification) => {

   /* listen to push function & redirect page
      needs to be globally applied to root component... not working yet
      so this is a temporary fix */

   if(!notification || !notification.data || !notification.data.some || notification.origin !== "selected"){
     return;
   }

   console.log(notification);

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

  _keyExtractor = (item, index) => item.id;

  renderTags = () => {

    const tagSelected  = this.props.newRoomTags;
    if(!tagSelected.length){
      return;
    }



    return (
      <View style={styles.tags}>
        {tagSelected.map((t, i) => {
          const name = !t.name && t.name.trim() == "" && !t.number && t.number.trim() == "" ? '' : t.name + ' ';
          const number = t.number;
          const tagType = t.type && !t.type.trim() == "" ? t.type : '';
          let renderStyle;

          switch(tagType) {
           case 'azure': {
             renderStyle = styles.tagAzure;
              break;
           }
           case 'error': {
             renderStyle = styles.tagError;
              break;
           }
           default: {
              renderStyle = '';
              break;
           }
         }

          return (
            <TouchableOpacity
              key={i}
              style={renderStyle || styles.tag}
              onPress={() => this.deleteTag(number)}
            >
              <Text style={{color: tagType == 'azure' || tagType=='error' ? '#fff' : '#000'}}>{name + t.number.replace(/\s/g, '')} &#215; </Text>

            </TouchableOpacity>
          );
        })}
      </View>
    );


  }

 _keyboardDidShow = (e) => {

    let listHeight = Dimensions.get('window').height - e.endCoordinates.height;
    if (this._isMounted) {
      this.setState({ listHeight : listHeight });
    }

}


  deleteTag = (number) => {
    this.props.chataboxDeleteTag(number);
    this.props.chataboxClearRoom();
  }

  validatePhonenumber = (phoneNumber) => {

    const { defaultCountryCode } = this.props;

    let payload = {status: false, errorMsg: null, contactUri: null, phoneNumber: null};

    if ( !defaultCountryCode && defaultCountryCode.trim() ==''){
      //no default country code to validate number with
      payload = {status: false, errorMsg: 'You need to configure your account to have a default country code to proceed', contactUri: null, phoneNumber: null};
      return payload;

    }

    // Local codes from https://restcountries.eu/
    const JSONMappingData = "{\"93\":\"AF\",\"358\":\"AX\",\"355\":\"AL\",\"213\":\"DZ\",\"1684\":\"AS\",\"376\":\"AD\",\"244\":\"AO\",\"1264\":\"AI\",\"1268\":\"AG\",\"54\":\"AR\",\"374\":\"AM\",\"297\":\"AW\",\"61\":\"AU\",\"43\":\"AT\",\"994\":\"AZ\",\"1242\":\"BS\",\"973\":\"BH\",\"880\":\"BD\",\"1246\":\"BB\",\"375\":\"BY\",\"32\":\"BE\",\"501\":\"BZ\",\"229\":\"BJ\",\"1441\":\"BM\",\"975\":\"BT\",\"591\":\"BO\",\"5997\":\"BQ\",\"387\":\"BA\",\"267\":\"BW\",\"55\":\"BR\",\"246\":\"IO\",\"1284\":\"VG\",\"673\":\"BN\",\"359\":\"BG\",\"226\":\"BF\",\"257\":\"BI\",\"855\":\"KH\",\"237\":\"CM\",\"1\":\"CA\",\"238\":\"CV\",\"1345\":\"KY\",\"236\":\"CF\",\"235\":\"TD\",\"56\":\"CL\",\"86\":\"CN\",\"61\":\"CX\",\"61\":\"CC\",\"57\":\"CO\",\"269\":\"KM\",\"242\":\"CG\",\"243\":\"CD\",\"682\":\"CK\",\"506\":\"CR\",\"385\":\"HR\",\"53\":\"CU\",\"599\":\"CW\",\"357\":\"CY\",\"420\":\"CZ\",\"45\":\"DK\",\"253\":\"DJ\",\"1767\":\"DM\",\"1809\":\"DO\",\"593\":\"EC\",\"20\":\"EG\",\"503\":\"SV\",\"240\":\"GQ\",\"291\":\"ER\",\"372\":\"EE\",\"251\":\"ET\",\"500\":\"FK\",\"298\":\"FO\",\"679\":\"FJ\",\"358\":\"FI\",\"33\":\"FR\",\"594\":\"GF\",\"689\":\"PF\",\"241\":\"GA\",\"220\":\"GM\",\"995\":\"GE\",\"49\":\"DE\",\"233\":\"GH\",\"350\":\"GI\",\"30\":\"GR\",\"299\":\"GL\",\"1473\":\"GD\",\"590\":\"GP\",\"1671\":\"GU\",\"502\":\"GT\",\"44\":\"GG\",\"224\":\"GN\",\"245\":\"GW\",\"592\":\"GY\",\"509\":\"HT\",\"379\":\"VA\",\"504\":\"HN\",\"852\":\"HK\",\"36\":\"HU\",\"354\":\"IS\",\"91\":\"IN\",\"62\":\"ID\",\"225\":\"CI\",\"98\":\"IR\",\"964\":\"IQ\",\"353\":\"IE\",\"44\":\"IM\",\"972\":\"IL\",\"39\":\"IT\",\"1876\":\"JM\",\"81\":\"JP\",\"44\":\"JE\",\"962\":\"JO\",\"76\":\"KZ\",\"254\":\"KE\",\"686\":\"KI\",\"965\":\"KW\",\"996\":\"KG\",\"856\":\"LA\",\"371\":\"LV\",\"961\":\"LB\",\"266\":\"LS\",\"231\":\"LR\",\"218\":\"LY\",\"423\":\"LI\",\"370\":\"LT\",\"352\":\"LU\",\"853\":\"MO\",\"389\":\"MK\",\"261\":\"MG\",\"265\":\"MW\",\"60\":\"MY\",\"960\":\"MV\",\"223\":\"ML\",\"356\":\"MT\",\"692\":\"MH\",\"596\":\"MQ\",\"222\":\"MR\",\"230\":\"MU\",\"262\":\"YT\",\"52\":\"MX\",\"691\":\"FM\",\"373\":\"MD\",\"377\":\"MC\",\"976\":\"MN\",\"382\":\"ME\",\"1664\":\"MS\",\"212\":\"MA\",\"258\":\"MZ\",\"95\":\"MM\",\"264\":\"NA\",\"674\":\"NR\",\"977\":\"NP\",\"31\":\"NL\",\"687\":\"NC\",\"64\":\"NZ\",\"505\":\"NI\",\"227\":\"NE\",\"234\":\"NG\",\"683\":\"NU\",\"672\":\"NF\",\"850\":\"KP\",\"1670\":\"MP\",\"47\":\"NO\",\"968\":\"OM\",\"92\":\"PK\",\"680\":\"PW\",\"970\":\"PS\",\"507\":\"PA\",\"675\":\"PG\",\"595\":\"PY\",\"51\":\"PE\",\"63\":\"PH\",\"64\":\"PN\",\"48\":\"PL\",\"351\":\"PT\",\"1787\":\"PR\",\"974\":\"QA\",\"383\":\"XK\",\"262\":\"RE\",\"40\":\"RO\",\"7\":\"RU\",\"250\":\"RW\",\"590\":\"BL\",\"290\":\"SH\",\"1869\":\"KN\",\"1758\":\"LC\",\"590\":\"MF\",\"508\":\"PM\",\"1784\":\"VC\",\"685\":\"WS\",\"378\":\"SM\",\"239\":\"ST\",\"966\":\"SA\",\"221\":\"SN\",\"381\":\"RS\",\"248\":\"SC\",\"232\":\"SL\",\"65\":\"SG\",\"1721\":\"SX\",\"421\":\"SK\",\"386\":\"SI\",\"677\":\"SB\",\"252\":\"SO\",\"27\":\"ZA\",\"500\":\"GS\",\"82\":\"KR\",\"211\":\"SS\",\"34\":\"ES\",\"94\":\"LK\",\"249\":\"SD\",\"597\":\"SR\",\"4779\":\"SJ\",\"268\":\"SZ\",\"46\":\"SE\",\"41\":\"CH\",\"963\":\"SY\",\"886\":\"TW\",\"992\":\"TJ\",\"255\":\"TZ\",\"66\":\"TH\",\"670\":\"TL\",\"228\":\"TG\",\"690\":\"TK\",\"676\":\"TO\",\"1868\":\"TT\",\"216\":\"TN\",\"90\":\"TR\",\"993\":\"TM\",\"1649\":\"TC\",\"688\":\"TV\",\"256\":\"UG\",\"380\":\"UA\",\"971\":\"AE\",\"44\":\"GB\",\"1\":\"US\",\"598\":\"UY\",\"998\":\"UZ\",\"678\":\"VU\",\"58\":\"VE\",\"84\":\"VN\",\"681\":\"WF\",\"212\":\"EH\",\"967\":\"YE\",\"260\":\"ZM\",\"263\":\"ZW\"}";

    const mappingData = JSON.parse(JSONMappingData);

    if(defaultCountryCode in mappingData ){
      const country = mappingData[defaultCountryCode];

      try {
        const checkPhoneNumber = parsePhoneNumber(phoneNumber, country);
        const returnNumber = checkPhoneNumber.format("E.164");
        const returnUri = checkPhoneNumber.format("RFC3966");

        payload = {status: true, errorMsg: null, contactUri: returnUri, phoneNumber: returnNumber};
        return payload;

      } catch (error) {
        //not a valid number
        payload = {status: false, errorMsg: 'Please enter a valid phone number', contactUri: null, phoneNumber: null};
        return payload;

        console.error(error);
      }
    } else {
      // not a valid default country code
      payload = {status: false, errorMsg: 'You need to configure your account to have a default country code to proceed', contactUri: null, phoneNumber: null};
      return payload;
    }

  }

  loadChatRoom = () => {
    const { query, contacts } = this.props;
    console.log('LOADING CHAT ROOM');
    if(!query || query.trim() == ""){
      return;
    }

    const stripPlus = query.length ? query.replace('+', '') : '';
    const queryType = stripPlus.match(/^\d/) ? "number" : 'string';

    const keyword = stripPlus;

    let tagNumber = queryType==='string' ? '' : query;
    console.log(tagNumber);
    let tagFullName = queryType==='number' ? '' : query;


    let filteredData;

    if(queryType === 'string'){
      filteredData = contacts.filter(function(obj) {
        if(obj.firstName){
          const contactFirstName = obj.firstName ? obj.firstName : '';
          const contactLastName = obj.lastName ? obj.lastName : '';
          const contactFullName = contactFirstName + " " + contactLastName;
          return contactFullName.toLowerCase().trim() === keyword.toLowerCase().trim();
         }
      });

      const tagFirstName = filteredData.length && filteredData[0].firstName ? filteredData[0].firstName : '';
      const tagLastName = filteredData.length && filteredData[0].lastName ? filteredData[0].lastName : query;
      tagFullName = filteredData.length ? tagFirstName + ' ' + tagLastName : query;

      tagNumber = filteredData.length && filteredData[0].phoneNumber ? filteredData[0].phoneNumber : '';

  } else {
    filteredData = contacts.filter(function(obj) {
      if(obj.phoneNumber){
         return obj.phoneNumber.replace('+', '') === keyword;
       }
    });


    const tagFirstName = filteredData.length && filteredData[0].firstName ? filteredData[0].firstName : '';
    const tagLastName = filteredData.length && filteredData[0].lastName ? filteredData[0].lastName : '';
    tagFullName = filteredData.length ? tagFirstName + ' ' + tagLastName : '';

    tagNumber = filteredData.length && filteredData[0].phoneNumber ? filteredData[0].phoneNumber : query;
  }
    let tagType;

    const validateNumber = this.validatePhonenumber(tagNumber);

    if(validateNumber.status){
      tagType = filteredData.length && filteredData[0].contactType ? filteredData[0].contactType : '';
      //override to allow only one tag in array - will bring in multiple contacts in future
      const tag = [{ number : validateNumber.phoneNumber, contactUri: validateNumber.contactUri, name : tagFullName, type : tagType }];

      this.props.chataboxCreateTag(tag).then(() => {
        this.props.updateQuery('');
        this.loadChatMessages();
      });


    } else {
      tagType = 'error';
      const tag = [{ number : tagNumber ? tagNumber : tagFullName, contactUri: null, name : tagNumber ? tagFullName : '', type : tagType }];

      this.props.chataboxCreateTag(tag).then(() => {
        this.props.updateQuery('');
        this.loadChatMessages();
      });

    }
    if(this.validatePhonenumber(tagNumber)){
      tagType = filteredData.length && filteredData[0].contactType ? filteredData[0].contactType : '';
    } else {
      tagType = 'error';
    }

  }
  loadChatMessages = () => {

    const stateRooms = this.props.messages;
    const tagSelected  = this.props.newRoomTags;

    const stripPlus = tagSelected.length ? tagSelected[0].number.replace('+', '') : '';


    const queryType = stripPlus.match(/^\d/) ? true : false;
    if(!queryType){
      return;
    }
    const keyword = tagSelected.length ? stripPlus : '';

    let thisRoom;


    thisRoom = stateRooms.filter(function(obj) {
      if(obj.Participants.$values.length && obj.Participants.$values[0].SfBPhoneNumber){
         return obj.Participants.$values[0].SfBPhoneNumber.PhoneNumber.replace('+', '').replace(/\s/g, '') === keyword.replace(/\s/g, '');
       }
    });



    const roomId = thisRoom.length ? thisRoom[0].Id : null;
    const { messages } = this.props;
    const roomData = {
      roomId: roomId,
      userName: this.props.displayName,
      userId: this.props.id,
      participantName: tagSelected.name
    }

    this.props.chataboxActiveRoomOpen(roomData, messages);

  }


  onChangeText(text) {
    this.props.updateQuery(text);
  }

  handleEngageChatRoom = (payload) => {

    if (this._isMounted) {
      this.setState({fullChatRoom:payload.status, pageTitle: payload.title });
      this.props.navigation.setParams({ title: payload.title });
    }

  }
  findContact(query) {

    if (query === '') {
      return [];
    }
    const { contacts } = this.props;

    const stripPlus = query.replace('+', '');
    const queryType = stripPlus.match(/^\d/) ? "number" : 'string';
    const keyword = query;
    let filteredData;

    if(queryType === 'string'){
      filteredData = contacts.filter(function(obj) {

        if(obj.firstName){
          const contactFirstName = obj.firstName ? obj.firstName : '';
          const contactLastName = obj.lastName ? obj.lastName : '';
          const contactFullName = contactFirstName + " " + contactLastName;
           return contactFullName.toLowerCase().replace(/\s/g, '').includes(keyword.toLowerCase().replace(/\s/g, ''));
         }
      });
  } else {
    filteredData = contacts.filter(function(obj) {
      if(obj.phoneNumber){
         return obj.phoneNumber.toLowerCase().replace(/\s/g, '').includes(keyword.toLowerCase().replace(/\s/g, ''));
       }
    });
  }
  return filteredData ? filteredData : '';
  }

  _renderSeparator = () => {
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

  _renderBadge = (item) => {
    if(item.contactType === 'azureOutlook'){
      return { value: 'Office 365', textStyle: { color: 'white' }, containerStyle: { marginTop: -20 } };
    } else if(item.contactType === 'azureAD'){
      return { value: 'Azure AD', textStyle: { color: 'white' }, containerStyle: { marginTop: -20 } };
    }{
      return null;
    }
  }

  _renderAvatar = (item) => {


    const firstName = item.firstName ? item.firstName[0] : '';
    const lastName = item.lastName ? item.lastName[0] : '';
    const fullName = firstName + lastName;
      if(item.imageAvailable ){

        return (

          <Avatar
            rounded
            source={{
              uri:
                item.imageUri ? item.imageUri : '',
            }}
            title={fullName}
            activeOpacity={0.7}
          />

           );
      } else {

        return (
        <Avatar
             rounded
             title={fullName}
           />
       );
       }

  };

  onSend = messages => {

  };

   render() {
    const { query } = this.props;
    const { fullChatRoom } = this.state;

    const contactSearch = this.findContact(query);

    const comp = (a, b) => {
      const x = a ? a : null;
      const y = b[0].phoneNumber ? b[0].phoneNumber : null;

        return x !== null && y !== null ? x.toLowerCase().replace(/\s/g, '') === y.toLowerCase().replace(/\s/g, '') : false;
    }

    const { contacts } = this.props;
    const { showResults, listHeight } = this.state;

     if (this.props.loading) {
         return (
           <View style={styles.loadingContainer}>
            <ActivityIndicator size="large"  />
          </View>
         );
     }


    return (
      <View style={styles.pageContainer}>
      <Spinner
          visible={this.state.spinner}
          textContent={'Loading...'}
          textStyle={styles.spinnerTextStyle}
        />
      { !fullChatRoom ? ( <View style={styles.autocompleteContainer}>
        {this.renderTags()}
        <Icon
              name="plus"
              type='evilicon'
              size={30}
              color='#333'
              onPress={() => {
                this.props.updateQuery('');
                this.props.navigation.navigate('AddContactScreen', { contacts: this.state.contacts });
              }}
              containerStyle={styles.addContactIcon}
          />
        <Autocomplete
         autoFocus
         ref={c => (this._input = c)}
         autoCapitalize="none"
         autoCorrect={false}
         keyExtractor={(item, key) => String(item.Id)}
         renderSeparator={this._renderSeparator}
         inputContainerStyle={styles.inputContainerStyle}
         listContainerStyle={styles.listResultContainer}
         listStyle={{maxHeight: listHeight}}
         data={contactSearch.length === 1 && comp(query, contactSearch) ? [] : contactSearch}
         defaultValue={query}
         onChangeText={text => this.onChangeText(text)}
         onBlur={() => this.loadChatRoom()}
         placeholder="Enter Phone Number"
         renderItem={item => (

           <ListItem
             containerStyle={styles.listItemContainer}
             roundAvatar
             title={`${item.firstName ? item.firstName : ''} ${item.lastName ? item.lastName : ''}`}
             subtitle={item.phoneNumber}
             leftAvatar={this._renderAvatar(item)}
             onPress={() => this.props.updateQuery(item.phoneNumber)}
             badge={this._renderBadge(item)}
             hideChevron
           />

        )}
         />

      </View> ) : null }

      <ChatRoom
        tagSelected = {this.props.newRoomTags}
        handleEngageChatRoom = {this.handleEngageChatRoom.bind(this)}
      />

      </View>

    );
  }

   }


const mapStateToProps = (state) => {
   return {
       authToken: state.auth.authGraphToken,
       authChataboxToken: state.auth.authChataboxToken,
       defaultCountryCode: state.auth.defaultCountryCode,
       activeRoomLoading:  state.messages.activeRoomLoading,
       id: state.auth.id,
       displayName: state.auth.displayName,
       contacts: state.contacts.contactBook,
       loading: state.contacts.loading,
       error: state.contacts.error,
       query: state.contacts.query,
       messages: state.messages.messages,
       messagesError: state.messages.error,
       messagesLoading: state.messages.loading,
       newRoomTags: state.messages.newRoomTags,
       newRoomExternalTags: state.messages.newRoomExternalTags
   };
}

function mapDispatchToProps(dispatch) {
  return {
    chataboxCreateTag: function(tag) {
      return new Promise((resolve, reject) => {
        dispatch(chataboxCreateNewTag(tag));
        resolve()
      })
    },
    chataboxExternalTag: function(flag) {
      dispatch(chataboxExternalTag(flag));
    },
    chataboxDeleteTag: function(number) {
      dispatch(chataboxDeleteTag(number));
    },
    chataboxDeleteAllTags: function() {
      dispatch(chataboxDeleteAllTags());
    },
    chataboxActiveRoomOpen: function(roomData) {
      return new Promise((resolve, reject) => {
        dispatch(chataboxActiveRoomOpen(roomData));
        resolve()
      })
    },
    chataboxClearRoom: function() {
      dispatch(chataboxClearRoom());
    },
    createRoomSendMessage: function(name, contactUri, phoneNumber, messageText, authChataboxToken) {
      return new Promise((resolve, reject) => {
      dispatch(createRoomWithRedux(name, contactUri, phoneNumber, messageText, authChataboxToken));
      resolve()
    })
    },
    fetchContacts: function(authToken) {
      dispatch(fetchContactsWithRedux(authToken));
    },
    updateQuery: function(query) {
      dispatch(searchContactsQuery(query));
    },
    fetchMessages: function(authChataboxToken, contacts) {
      return new Promise((resolve, reject) => {
        dispatch(fetchMessagesWithRedux(authChataboxToken, contacts));
      resolve()
    })
  },
  sendMessage: function(message, roomId, authChataboxToken) {
    return new Promise((resolve, reject) => {
      dispatch(sendMessageWithRedux(message, roomId, authChataboxToken));
    resolve()
  })
  }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewChatRoomScreen);


   const styles = StyleSheet.create({
     spinnerTextStyle: {
       color: '#FFF'
     },
     pageContainer: {
       flex: 1,
       paddingTop: 0,
       backgroundColor: '#fff',
       justifyContent: 'flex-start'
     },
     chatContainer: {
       flex: 1,
       zIndex: -1,
       position: 'relative',
       backgroundColor: '#fff',
     },
     loadingContainer: {
       flex: 1,
       paddingTop: 0,
       backgroundColor: '#fff',
       justifyContent: 'center'
     },
     autocompleteContainer: {
      flex: 1,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 998,
      backgroundColor: "transparent",
    },
    itemText: {
    fontSize: 15,
    margin: 2
    },
    descriptionContainer: {
      backgroundColor: '#F5FCFF',
      marginTop: 8
    },
    infoText: {
      textAlign: 'center'
    },
    titleText: {
      fontSize: 18,
      fontWeight: '500',
      marginBottom: 10,
      marginTop: 10,
      textAlign: 'center'
    },
    item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
  listResultContainer: {

  },
  listItemContainer: {
    backgroundColor: "transparent",
  },
  addContactIcon: {
    position: 'absolute',
    right:     2,
    top:      7,
    zIndex: 2
  },
  inputContainerStyle: {
    borderRadius: 0,
    paddingLeft: 5,
    height: 40,
    width: '100%',
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#b9b9b9',
  },
  tags: {
    backgroundColor: "#fff",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginTop: 1,
    width: '100%',
    height: 40,
    position: 'absolute',
    zIndex: 999,
    borderColor: "rgb(230,230,230)",
    borderWidth: 0,
    borderBottomWidth: 0.5
  },
  tag: {
    backgroundColor: "rgb(244, 244, 244)",
    justifyContent: "center",
    alignItems: "center",
    height: 30,
    marginLeft: 7,
    marginTop: 4.5,
    borderRadius: 30,
    padding: 8,

  },
  tagAzure: {
    backgroundColor: "#0078d7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
    marginTop: 4.5,
    borderRadius: 30,
    padding: 6,
    paddingLeft: 10,
  },
  tagError: {
    backgroundColor: "#CE4128",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
    marginTop: 4.5,
    borderRadius: 30,
    padding: 6,
    paddingLeft: 10,
  },
  tagAzureText: {
    color: '#ffffff'
  }

   });

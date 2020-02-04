import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  FlatList,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { fetchContactsWithRedux, searchContactsQuery } from "../redux/actions/contacts.js";
import { chataboxExternalTag } from "../redux/actions/messages.js";
import Autocomplete from 'react-native-autocomplete-input';
import { Permissions, Contacts } from 'expo';
import { ListItem, SearchBar, Icon, Avatar} from "react-native-elements";
import { Ionicons } from '@expo/vector-icons';


class AddContactScreen extends React.Component {
static navigationOptions = ({ navigation }) => {

   const { state } = navigation
   return {
     headerTitle: 'Add Contact',
     headerTintColor: '#fff',
     headerStyle: {
     backgroundColor: '#00AAF7'
     },
   }
 }

 constructor(props) {
   super(props);

   this.state = {
     contactsDisplayed: [],
     searchInit: false,
     searchFocus: false,
     search: '',
     navigating: false
   };
 }

componentDidMount() {
  this.props.navigation.setParams({
    headerCancel: () => this._headerCancel(),
  });
}

 _headerCancel() {
     this.props.navigation.navigate('NewChatRoom');
 }


searchContacts = search => {
  this.setState({ search });

  const { contacts } = this.props;
  const { searchInit, contactsDisplayed } = this.state;

  const query = search;

  if(query.length > 1) {
    console.log(query.length);
    if(!searchInit){
      this.setState({ searchInit : true });
    }
    const stripPlus = query.replace('+', '');
    const queryType = stripPlus.match(/^\d/) ? "number" : 'string';
    const keyword = query;
    let filteredData = [];
    console.log(queryType);
    if(queryType === 'string'){
      filteredData = contacts.filter(function(obj) {
          return obj.fullName.toLowerCase().includes(keyword.toLowerCase());
      });
  } else {
    filteredData = contacts.filter(function(obj) {
         return obj.phoneNumber.includes(keyword);
    });
  }

  console.log(filteredData);

    this.setState({ contactsDisplayed : filteredData });
  } else {
    this.setState({ searchInit : false, contactsDisplayed : []});
  }
}

prepareContacts = () => {

  const { contactsDisplayed, searchInit } = this.state;
  const { contacts } = this.props;

  const contactsToShow = searchInit ? contactsDisplayed : contacts;

  return contactsToShow;
}

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
 _renderBadge = (item) => {

   if(!item){
     return;
   }

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

_onPress = (item) => {
  const number = item.phoneNumber ? item.phoneNumber : '';

  if(!this.state.navigating){
    this.props.updateQuery(number).then(() => {
      this.props.chataboxExternalTag(true);
      this.props.navigation.navigate('NewChatRoom');
      this.setState({ navigating: true });
    });
  }

}

compare = (a, b) =>  {
  // Use toUpperCase() to ignore character casing

  const genreA = a.lastName ? a.lastName.toUpperCase() : a.firstName;
  const genreB = b.lastName ? b.lastName.toUpperCase() : b.firstName;

  let comparison = 0;
  if (genreA > genreB) {
    comparison = 1;
  } else if (genreA < genreB) {
    comparison = -1;
  }
  return comparison;
}


 render() {
   const unordered = this.props.contacts;
   const ordered = unordered.sort(this.compare);

   if (this.props.loading) {
       return (
         <View style={styles.loadingContainer}>
          <ActivityIndicator size="large"  />
        </View>
       );
   }
   const { search } = this.state
   return (
   <View style={styles.container}>
   <StatusBar
    backgroundColor="blue"
    barStyle="light-content"
  />
  <SearchBar
    placeholder="Search contacts"
    platform={Platform.OS}
    onChangeText={this.searchContacts}
    value={search}
    />
     <View containerStyle={styles.listContainer}>
       <FlatList
         data={this.prepareContacts()}
         renderItem={({ item }) => (
         <ListItem
           containerStyle={styles.listItemContainer}
           roundAvatar
           chevron
           title={`${item.firstName ? item.firstName : '' } ${item.lastName ? item.lastName : ''}`}
           subtitle={item.phoneNumber}
          leftAvatar={this._renderAvatar(item)}
          onPress={() => { this._onPress(item) }}
          badge={this._renderBadge(item)}
         />
       )}
       keyExtractor={ (item, key) => item.id }
       ItemSeparatorComponent={this.renderSeparator}

       />
   </View>
   </View>
  )
 }

}


const mapStateToProps = (state) => {
   return {
       authToken: state.auth.authToken,
       contacts: state.contacts.contactBook,
       loading: state.contacts.loading,
       error: state.contacts.error,
       query: state.contacts.query,
   };
}

function mapDispatchToProps(dispatch) {
  return {
    chataboxExternalTag: function(flag) {
      dispatch(chataboxExternalTag(flag));
    },
    fetchContacts: function(authToken) {
      dispatch(fetchContactsWithRedux(authToken));
    },
    updateQuery: function(query) {
      return new Promise((resolve, reject) => {
        dispatch(searchContactsQuery(query));
        resolve();
      });
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AddContactScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#fff',
    justifyContent: 'flex-start'
  },
  listContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginTop: 0,
    paddingTop: 0
  },
  listItemContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,

  }
});

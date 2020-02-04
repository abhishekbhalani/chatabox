import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  FlatList,
  StatusBar,

} from 'react-native';
import {ListItem, SearchBar, Icon, Avatar} from "react-native-elements";
import { connect } from "react-redux";
import { fetchContactsWithRedux } from "../redux/actions/contacts.js";

class ContactListScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
     const { state } = navigation;
     return {
       headerTitle: 'Add Contact',
       headerTintColor: '#fff',
       headerStyle: {
       backgroundColor: '#00AAF7'
       },
     }
   }

  componentDidMount() {
    this.props.fetchContacts(this.props.authToken);
  }



   renderHeader = () => {
     return <SearchBar placeholder="Search" lightTheme round />;
   };
   renderSeparator = () => {
     return (
       <View
         style={{
           height: 1,
           width: "86%",
           backgroundColor: "#CED0CE",
           marginLeft: "14%"
         }}
       />
     );
   };

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
    console.log("PRESS");
    console.log(number);
    this.props.navigation.navigate('NewChatRoom', { query: number, tagRefresh : true});
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
    const { error, loading, contacts } = this.props;

    if (error) {
      return <Text>Error! {error.message}</Text>;
    }

    if (loading) {
      return <Text>Loading...</Text>;
    }

    return (
      <FlatList
        data={contacts}
        keyExtractor={ (item, key) => item.id }
        renderItem = { ({ item }) => (
          <ListItem
            containerStyle={styles.listItemContainer}
            roundAvatar
            title={`${item.firstName ? item.firstName : '' } ${item.lastName ? item.lastName : ''}`}
            subtitle={item.phoneNumber}
             leftAvatar={this._renderAvatar(item)}
             onPress={() => { this._onPress(item) }}
             badge={item.contactType === 'azure' ? { value: 'Office 365', textStyle: { color: 'white' }, containerStyle: { marginTop: -20, backgroundColor : '#00AAF7' } } : false}
          />
        )}
      />
    );
  }
}


const mapStateToProps = (state) => ({
  contacts: state.contacts.contactBook,
  loading: state.contacts.loading,
  error: state.contacts.error,
  authToken: state.auth.authToken
});

function mapDispatchToProps(dispatch) {
  return {
    fetchContacts: function(authToken) {
      dispatch(fetchContactsWithRedux(authToken));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ContactListScreen);

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

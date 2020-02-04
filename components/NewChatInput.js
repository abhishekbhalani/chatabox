import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  FlatList,
  StatusBar
} from 'react-native';
import ( bindActionCreators ) from 'redux';
import { connect } from 'react-redux';
import { fetchContacts } from '../redux/actions/contacts.js';
import Autocomplete from 'react-native-autocomplete-input';
import { Permissions, Contacts } from 'expo';
import { List, ListItem, SearchBar, Icon, Avatar} from "react-native-elements";
import { Ionicons } from '@expo/vector-icons';

class NewChatInput extends React.Component {

  componentWillMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      dataSource: this.state.dataSource.closeWithRows(nextProps.contacts);
    });
  }

  refresh() {
    if (this.props.fetchContacts) {
      this.props.fetchContacts();
    }
  }

}

export default;

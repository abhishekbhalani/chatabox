import React from 'react';
import { createSwitchNavigator, createStackNavigator, createAppContainer } from 'react-navigation';

import AuthLoadingScreen from '../screens/AuthLoadingScreen';

import LoginScreen from '../screens/LoginScreen';
import AzureScreen from '../screens/AzureScreen';
import LogoutWebViewScreen from '../screens/LogoutWebViewScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SettingsWebViewScreen from '../screens/SettingsWebViewScreen';
import NewChatRoomScreen from '../screens/NewChatRoomScreen';
import AddContactScreen from '../screens/AddContactScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ContactListScreen from '../screens/ContactListScreen';

const MainStack = createStackNavigator({
  Home: HomeScreen,
  Settings: SettingsScreen,
  SettingsWebView: SettingsWebViewScreen,
  NewChatRoom: NewChatRoomScreen,
  AddContactScreen: AddContactScreen,
  ChatRoomScreen: ChatRoomScreen,
  ContactList: ContactListScreen,
},{
    navigationOptions: {
      headerStyle: {
        backgroundColor: '#00AAF7',
      },
      headerTintColor: '#fff',
    },
  });


const AuthStack = createStackNavigator({
  Login: LoginScreen,
  Azure: AzureScreen,
  Logout: LogoutWebViewScreen
},{
  navigationOptions: {
    headerStyle: {
      backgroundColor: '#00AAF7',
    },
    headerTintColor: '#fff',
  },
});


export default createSwitchNavigator(
  {
    AuthLoading: AuthLoadingScreen,
    Main: MainStack,
    Auth: AuthStack,
  },
  {
    initialRouteName: 'AuthLoading',
  }
);

import React from "react";
import { StatusBar, View } from "react-native";

import FlashMessage from "react-native-flash-message";

export default class FlashMessageStyle extends React.Component {
  componentDidMount() {
    StatusBar.setBarStyle("light-content");
  }
  render() {
    return (
      <View style={{ flex: 1 }}>
        <FlashMessage position="top" animated={true} />
      </View>
    );
  }
}

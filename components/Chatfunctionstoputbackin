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

  //check for duplicates


  this.setState(previousState => ({
    messagesDisplayed: GiftedChat.append(previousState.messagesDisplayed, msg),
  }));

  this.props.seenNewGeneralMessage();
  this.updateLastSeen();

}

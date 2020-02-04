const helpers = {
    retrieveNameFromRoomObject: function(room, contacts, displayName){

      /* if empty */
      if(!room || !contacts){
        return;
      }

      const roomParticipants = room.Participants.$values;
      let roomParticipant = roomParticipants.length ? roomParticipants[0].Name : displayName;

      const safeRoomParticipant = roomParticipant.replace('+', '');
      const roomParticipantType = safeRoomParticipant.match(/^\d/) ? "number" : 'string';

      let returnName = roomParticipant;

      /* if matches phone number in contactSearch */
      if(contacts && roomParticipantType==='number'){
        /* see if number matches a contact */
        const comparison = this.retrieveNameFromContacts(roomParticipant, contacts);

        if(comparison){
            const firstName = comparison.firstName ? comparison.firstName : '';
            const lastName = comparison.lastName ? comparison.lastName : '';
           returnName = firstName + ' ' + lastName;
        }
      }

      /* return string name */
      return returnName;

    },

    retrieveNameFromContacts: function(targetNumber, targetArray){

      /* see if a number matches a native or AD contact to retrieve a name */

      const targSanitized  = targetNumber
                               .replace (/[^\d]/g, "")
                               .replace (/^.*(\d{10})$/, "$1");

      const result = targetArray.filter(obj => {
        return obj.phoneNumber
                      .replace (/[^\d]/g, "")
                      .replace (/^.*(\d{10})$/, "$1") === targSanitized;
      });

      return result[0];

    },
    helper3: function(param1, param2){

    }
}

export default helpers;

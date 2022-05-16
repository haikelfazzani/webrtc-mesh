module.exports = class MemUsers {

  static add(roomID, user, users = {}) {
    if (!users[roomID]) {
      users[roomID] = [user]
    }
    else {
      const isFound = users[roomID].find(u => u.username === user.username || u.id === user.id);
      if (!isFound) users[roomID].push(user)
    }
    return users[roomID].filter(u => u.username !== user.username || u.id !== user.id);
  }

  static remove(users, roomID, userID) {
    if (users[roomID]) {
      const newUsers = users[roomID].filter(u => u.id === userID)
      users[roomID] = newUsers
      return users[roomID];
    }
  }

  static allUsersInRoom(roomID, users, peerCaller) {
    return users[roomID].filter(u => u.id !== peerCaller.id)
  }

  static getCreatorOfRoomId(roomID, users) {
    return users[roomID].find(u => u.isCreatorOfRoom).id;
  }

  static getUserByUsername(roomID, username, users) {
    return users[roomID].find(u => u.username === username && u.roomID === roomID);
  }
}
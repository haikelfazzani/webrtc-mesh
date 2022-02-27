const users = {};

module.exports = class MemUsers {
  static add(roomID, user) {
    if (!users[roomID]) {
      users[roomID] = [user]
    }
    else {
      const isFound = users[roomID].find(u => u.id === user.id || u.username === user.username)
      if (!isFound) users[roomID].push(user)
    }
    return users[roomID].filter(u => u.id !== user.id);
  }

  static remove(roomID, userID) {
    if (users[roomID]) {
      const newUsers = users[roomID].filter(u => u.id === userID)
      users[roomID] = newUsers
      return users[roomID];
    }
    return null;
  }

  static all(roomID) {
    return users[roomID]
  }
}
const users = {};

module.exports = function socketHandler(socket, io) {
  socket.on("join room", async ({ roomID, username }) => {

    socket.data.id = socket.id;
    socket.data.roomID = roomID;
    socket.data.username = username;

    await socket.join(roomID);

    if (users[roomID]) {
      if (!users[roomID].some(id => id === socket.id)) users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }

    const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
    socket.emit("get-users", { usersInThisRoom, currentUserId: socket.id });
    io.to(roomID).emit('message', { username, message: ' Join room', type: 1 });
  });

  socket.on("sending signal", ({ signal, userToSignal, callerID, username }) => {
    io.to(userToSignal).emit('user joined', { signal, callerID, username });
  });

  socket.on("returning signal", ({ signal, callerID }) => {
    io.to(callerID).emit('receiving returned signal', { signal, id: socket.id });
  });

  socket.on("message", ({ roomID, username, message, type }) => {
    io.to(roomID).emit('message', { username, message, type: type || 0 });
  });

  for (const msg of ["disconnect", "disconnecting", "error"]) {
    socket.on(msg, () => {
      const roomID = socket.data.roomID;
      const username = socket.data.username;

      let room = users[roomID];

      if (room) {
        room = room.filter(id => id !== socket.id);
        users[roomID] = room;
      }

      console.log('disconnect -------> ', 'Room: ' + roomID, socket.id, users);
      io.to(roomID).emit('user-leave', { username, peerID: socket.id, users, type: 2 });
      io.to(roomID).emit('get-users', users);
    });
  }
}
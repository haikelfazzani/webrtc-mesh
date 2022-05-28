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
  });

  socket.on("sending signal", ({ signal, userToSignal, callerID, username }) => {
    io.to(userToSignal).emit('user joined', { signal, callerID, username });
  });

  socket.on("returning signal", ({ signal, callerID }) => {
    io.to(callerID).emit('receiving returned signal', { signal, id: socket.id });
  });

  for (const msg of ["disconnect", "disconnecting", "error"]) {
    socket.on(msg, () => {
      const roomID = socket.data.roomID;
      let room = users[roomID];

      if (room) {
        room = room.filter(id => id !== socket.id);
        users[roomID] = room;
      }

      console.log('disconnect -------> ', 'Room: ' + roomID, socket.id, users);
      io.to(roomID).emit('user-leave', { peerID: socket.id, users });
      io.to(roomID).emit('get-users', users);
    });
  }
}
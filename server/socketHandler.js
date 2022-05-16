const users = {};
const socketToRoom = {};
const numberOfUsersInRoom = 4;

module.exports = function socketHandler(socket, io) {

  socket.on("join room", async roomID => {

    socket.data.id = socket.id;
    socket.data.roomID = roomID;

    await socket.join(roomID);
    
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === numberOfUsersInRoom) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }

    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

    socket.emit("get-users", { usersInThisRoom, currentUserId: socket.id });
  });

  socket.on("sending signal", ({ signal, userToSignal, callerID }) => {
    io.to(userToSignal).emit('user joined', { signal, callerID });
  });

  socket.on("returning signal", ({ signal, callerID }) => {
    io.to(callerID).emit('receiving returned signal', { signal, id: socket.id });
  });

  socket.on('disconnect', () => {
    let room = users[socket.data.roomID];
    if (room) {
      room = room.filter(id => id !== socket.id);
      users[socket.data.roomID] = room;
    }
    console.log('disconnect -------> ', 'Room: ' + socket.data.roomID, socket.id, users);
    socket.to(socket.data.roomID).emit('user-leave', { peerID: socket.id, users });
    socket.to(socket.data.roomID).emit('get-users', users);
  });
}
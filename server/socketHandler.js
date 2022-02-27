const MemUsers = require('./MemUsers');

const users = {};
const socketToRoom = {};
const numberOfUsersInRoom = 4;
let currentRoomID = null;


module.exports = function socketHandler(socket, io) {

  socket.on("join room", async ({ roomID, username }) => {
    socket.data.username = username;
    if (username) {
      currentRoomID = roomID;
      console.log("join room -------> ", 'Room: ' + roomID, socket.id);
      socket.emit("user-wants-to-join-room", { peerID: socket.id });
    }
  });

  socket.on("accept-user-to-join", async ({ roomID, peerCaller }) => {
    currentRoomID = roomID;
    await socket.join(roomID);
    console.log("join room -------> ", 'Room: ' + roomID, peerCaller, socket.id);
    MemUsers.add(roomID, peerCaller)
    socketToRoom[socket.id] = roomID;
    socket.emit("get-users", { MemUsers: MemUsers.add(roomID, peerCaller), peerID: socket.id });
  });

  socket.on("sending signal", ({ signal, userToSignal, callerID }) => {
    io.to(userToSignal).emit('user joined', { signal, callerID });
  });

  socket.on("returning signal", ({ signal, callerID }) => {
    io.to(callerID).emit('receiving returned signal', { signal, id: socket.id });
  });

  socket.on('disconnect', () => {
    const roomID = socketToRoom[socket.id];
    const users = MemUsers.remove(roomID, socket.id);
    socket.to(currentRoomID).emit('user-leave', { peerID: socket.id, users });
    socket.to(currentRoomID).emit('get-users', users);
  });


  // socket.emit("userId", socket.id);
  // console.log('----------------------------------------------------------------\n');
  // console.log('user connected ........', socket.id);

  // socket.on('joined', async ({ username, roomID, userId }) => {
  //     currentRoomID = roomID;
  //     socket.data.username = username;
  //     await socket.join(roomID);

  //     usersByRoom.push({ roomID, userId, username });
  //     //console.log('usersByRoom --- > ', usersByRoom);

  //     const ids = await io.in(roomID).allSockets();
  //     console.log(socket.rooms.size, ids);

  //     if (ids.size < numberOfUsersInRoom) {
  //         const sockets = await io.in(roomID).fetchSockets();
  //         const users = [];

  //         for (const sk of sockets) {
  //             users.push({
  //                 id: sk.id,
  //                 room: [...sk.rooms][1],
  //                 username: sk.data.username
  //             });
  //         }
  //         console.log('joined --------> ', 'username = ' + username, ' | roomID = ' + roomID, ' | currentUserId = ' + userId);
  //         io.to(roomID).emit("get-Users", users);
  //     }
  //     else {
  //         socket.leave(roomID)
  //     }
  // });

  // socket.on("start-call-user", (data) => {
  //     io.to(data.userToCall).emit('receiving-call', { signal: data.signalData, from: data.from });
  // })

  // socket.on("accept-user-call", (data) => {
  //     io.to(data.to).emit('callAccepted', data.signal);
  // });

  // socket.on('disconnect', async () => {
  //     console.log(currentRoomID, socket.id);
  //     socket.broadcast.to(currentRoomID).emit('user-leaved-room', { currentRoomID, id:socket.id });
  // });

  // room events
  // io.of("/").adapter.on("create-room", (room) => {
  //     console.log(`room ${room} was created`);
  // });

  // io.of("/").adapter.on("leave-room", (room, id) => {
  //     console.log(`socket ${id} has leaved room ${room}`);
  //     io.to(room).emit('user-leaved-room', { room, id });
  // });
}
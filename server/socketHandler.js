let currentRoomID = null;
let currentUserId = null;

module.exports = function socketHandler(socket, io) {
    socket.emit("userId", socket.id);
    console.log('----------------------------------------------------------------\n');
    console.log('user connected ...', socket.id);
    currentUserId = socket.id;

    //console.log(socket.handshake.query.roomID);

    socket.on('joined', async ({ username, roomID, userId }) => {
        currentRoomID = roomID;
        socket.data.username = username;
        await socket.join(roomID);

        const ids = await io.in(roomID).allSockets();
        console.log(socket.rooms.size,ids);

        if (ids.size < 3) {
            console.log('socket.rooms -- > ', socket.rooms);

            const sockets = await io.in(roomID).fetchSockets();
            const users = [];

            for (const sk of sockets) {
                users.push({
                    id: sk.id,
                    room: [...sk.rooms][1],
                    username: sk.data.username
                });
            }
            console.log('joined --------> ', 'username = ' + username, ' | roomID = ' + roomID, ' | currentUserId = ' + currentUserId);
            io.to(roomID).emit("allUsers", users);
        }
        else {
            socket.leave(roomID)
        }
    });

    socket.on('disconnect', async (socket) => {
        const sockets = await io.in(currentRoomID).fetchSockets();
        for (const sk of sockets) {
            console.log('disconnect ------> ', sk.id);
            //io.to(currentRoomID).emit('leaving-room', { userId:sk.id });
        }
        //socket.leave(currentUserId);
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from });
    })

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });

    // room events
    // io.of("/").adapter.on("create-room", (room) => {
    //     console.log(`room ${room} was created`);
    // });

    // io.of("/").adapter.on("leave-room", (room, id) => {
    //     console.log(`socket ${id} has joined room ${room}`);
    // });
}
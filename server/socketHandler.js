let currentRoomID = null;
let usersByRoom = [];
const numberOfUsersInRoom = 3; // max 2 + 1 for comparaison

module.exports = function socketHandler(socket, io) {
    socket.emit("userId", socket.id);
    console.log('----------------------------------------------------------------\n');
    console.log('user connected ........', socket.id);

    socket.on('joined', async ({ username, roomID, userId }) => {
        currentRoomID = roomID;
        socket.data.username = username;
        await socket.join(roomID);

        usersByRoom.push({ roomID, userId, username });
        //console.log('usersByRoom --- > ', usersByRoom);

        const ids = await io.in(roomID).allSockets();
        console.log(socket.rooms.size, ids);

        if (ids.size < numberOfUsersInRoom) {
            const sockets = await io.in(roomID).fetchSockets();
            const users = [];

            for (const sk of sockets) {
                users.push({
                    id: sk.id,
                    room: [...sk.rooms][1],
                    username: sk.data.username
                });
            }
            console.log('joined --------> ', 'username = ' + username, ' | roomID = ' + roomID, ' | currentUserId = ' + userId);
            io.to(roomID).emit("get-Users", users);
        }
        else {
            socket.leave(roomID)
        }
    });

    socket.on("start-call-user", (data) => {
        io.to(data.userToCall).emit('receiving-call', { signal: data.signalData, from: data.from });
    })

    socket.on("accept-user-call", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });

    socket.on('disconnect', async (socket) => {
        console.log(socket.id);
    });

    // room events
    // io.of("/").adapter.on("create-room", (room) => {
    //     console.log(`room ${room} was created`);
    // });

    io.of("/").adapter.on("leave-room", (room, id) => {
        console.log(`socket ${id} has leaved room ${room}`);
        io.to(room).emit('user-leaved-room', { room, id });
    });
}
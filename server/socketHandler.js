let currentRoomID = null;

module.exports = function socketHandler(socket, io) {
    socket.emit("userId", socket.id);
    console.log('user connected ...', socket.id);

    socket.on('joined', async ({ username, roomID, userId }) => {
        currentRoomID = roomID;
        socket.data.username = username;
        socket.join(roomID);

        const sockets = await io.in(roomID).fetchSockets();
        const users = [];

        for (const sk of sockets) {
            users.push({ id: sk.id, room: [...sk.rooms][1], username: sk.data.username });
        }

        console.log('joined --------> ', username, roomID, userId);
        io.sockets.in(roomID).emit("allUsers", users);
    });

    socket.on('disconnect', async () => {
        const sockets = await io.in(currentRoomID).fetchSockets();
        for (const sk of sockets) {
            console.log('disconnect ------> ', sk.id);
        }
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from });
    })

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });
}
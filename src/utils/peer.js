export function createPeer(userToSignal, callerID, stream, socket) {
    const peer = new window.SimplePeer({ initiator: true, trickle: false, stream, });

    peer.on("signal", signal => {
        socket.emit("sending signal", { userToSignal, callerID, signal })
    })

    return peer;
}

export function addPeer(incomingSignal, callerID, stream, socket) {
    const peer = new window.SimplePeer({ initiator: false, trickle: false, stream, })

    peer.on("signal", signal => {
        socket.emit("returning signal", { signal, callerID })
    })

    peer.signal(incomingSignal);

    return peer;
}
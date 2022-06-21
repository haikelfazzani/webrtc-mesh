import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import LocalAudio from "../../components/LocalAudio";
import iceServersConfig from "../../utils/iceServersConfig";
import makeid from "../../utils/makeid";
import setMediaBitrate from "../../utils/setMediaBitrate";

let io = window.io;
let Peer = window.SimplePeer;

const mediaConstraints = {
  video: false,
  audio: {
    sampleSize: 16,
    channelCount: 2
  }
};

const proxy_server = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:5000';

export default function AudioRoom(props) {
  const queryParams = useParams();

  const roomID = queryParams.roomID;
  const username = queryParams.username || makeid(5);
  const peerid = queryParams.peerid || Date.now();

  const [media, setMedia] = useState({ audio: false, stream: null });

  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    socketRef.current = io.connect(proxy_server);
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {

      stream.getAudioTracks()[0].enabled = media.audio;
      socketRef.current.emit("join room", { roomID, username });
      setMedia({ ...media, stream })

      socketRef.current.on("get-users", ({ usersInThisRoom, currentUserId }) => {
        if (usersInThisRoom) {
          const npeers = [];

          usersInThisRoom.forEach(userID => {
            const peer = createPeer(userID, socketRef.current.id, stream, currentUserId);
            peersRef.current.push({ peerID: userID, peer, });
            npeers.push(peer);
          });
          setPeers(npeers);
        }
      });

      socketRef.current.on("user joined", ({ signal, callerID }) => {
        const peer = addPeer(signal, callerID, stream);
        peersRef.current.push({ peerID: callerID, peer, })
        setPeers(users => [...users, peer]);
      });

      socketRef.current.on("receiving returned signal", ({ signal, id }) => {
        const item = peersRef.current.find(p => p.peerID === id);
        item.peer.signal(signal);
      });

      socketRef.current.on("user-leave", ({ peerID }) => {
        const leftPeer = peersRef.current.find(u => u.peerID === peerID);
        leftPeer.peer.destroy();

        const newPeers = peersRef.current.filter(u => u.peerID !== peerID);
        peersRef.current = newPeers;

        setPeers(newPeers);
      });

      socketRef.current.on("disconnect", payload => {
        if (media.stream) media.stream.getTracks().forEach((track) => track.stop());
        if (media.oldStream) media.oldStream.getTracks().forEach((track) => track.stop());

        console.log('disconnect -----> ', payload);
      });
    })

    return () => {
      if (media.stream) media.stream.getTracks().forEach((track) => track.stop());
      if (media.oldStream) media.oldStream.getTracks().forEach((track) => track.stop());

      peersRef.current.forEach(u => u.peer.destroy());
      socketRef.current.close();
      socketRef.current.disconnect();
    }
  }, [roomID]);

  function createPeer(userToSignal, callerID, stream, currentUserId) {
    if (userToSignal && callerID) {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        allowHalfTrickle: true,
        stream,
        config: iceServersConfig,
        sdpTransform: (sdp) => setMediaBitrate(sdp, 0)
      });

      peer.on("signal", signal => {
        socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
      });

      peer.on('close', () => {
        console.log('Peer close');
      });

      peer.on('error', (err) => {
        console.log(err);
        peersRef.current.forEach(u => u.peer.destroy());
        props.history.push('/');
      });

      return peer;
    }
  }

  function addPeer(incomingSignal, callerID, stream) {
    if (incomingSignal && callerID) {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        allowHalfTrickle: true,
        stream,
        config: iceServersConfig,
        sdpTransform: (sdp) => setMediaBitrate(sdp, 0)
      });

      peer.on("signal", signal => {
        socketRef.current.emit("returning signal", { signal, callerID })
      });

      peer.on('close', () => {
        const newPeers = peersRef.current.filter(u => u.peerID !== callerID);
        peersRef.current = newPeers;
        setPeers(newPeers);
      });

      peer.on('error', (err) => {
        console.log('error', err);
        peersRef.current.forEach(u => {
          console.log('Error ---> ', u);
        });
        // props.history.push('/');
      });

      peer.signal(incomingSignal);
      return peer;
    }
  }

  const onToggleAudio = () => {
    media.stream.getAudioTracks()[0].enabled = !media.stream.getAudioTracks()[0].enabled
    setMedia({ ...media, audio: !media.audio })
  }

  const onHangout = () => {
    if (media.stream) media.stream.getTracks().forEach((track) => track.stop());
    if (media.oldStream) media.oldStream.getTracks().forEach((track) => track.stop());

    peersRef.current.forEach(u => u.peer.destroy());
    socketRef.current.close();
    socketRef.current.disconnect();
    props.history.push('/')
  }

  return (
    <main>
      <div className={'w-100 h-100 justify-center align-center media-grid-' + (peersRef.current.length + 1)}>
        {media.stream && <LocalAudio isLocal={true} media={media} autoPlay playsInline />}
        {peersRef.current.length > 0 && peersRef.current.map((user, index) => <LocalAudio key={index} user={user} />)}
      </div>

      <div className='w-100 media-controls d-flex justify-between'>
        <div className="d-flex align-center">
          <small title="Number of users" disabled><i className="fa fa-link mr-1"></i>{window.location.href}</small>
        </div>

        <div>
          <button onClick={onToggleAudio} title="Toggle Audio">
            <i className={media.audio ? 'fa fa-microphone' : 'fa fa-microphone-slash'}></i>
          </button>

          <button className="bg-red" onClick={onHangout} title="Hangout">
            <i className='fa fa-phone-slash'></i>
          </button>
        </div>

        <div>
          <button title="Open chat box" disabled>
            <i className="fa fa-comments mr-1"></i>{peersRef.current.length + 1}
          </button>
        </div>
      </div>

      {/* <div className="chat-box">
        <ul>
          {peersRef.current && peersRef.current.map((peer, index) => <li key={index}>{peer.peerID}</li>)}
        </ul>
      </div> */}
    </main>
  );
};
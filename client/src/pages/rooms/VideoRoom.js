import React, { useEffect, useRef, useState } from "react";
import LocalVideo from "../../components/LocalVideo";

import RemoteVideo from "../../components/RemoteVideo";
import useQuery from "../../hooks/useQuery";
import iceServersConfig from "../../utils/iceServersConfig";
import setMediaBitrate from "../../utils/setMediaBitrate";

import './Room.css';

let io = window.io;
let Peer = window.SimplePeer;

const mediaConstraints = {
  video: {
    width: { max: 320 },
    height: { max: 240 },
    // aspectRatio: 1,
    frameRate: { ideal: 10, max: 15 }
  },
  audio: {
    sampleSize: 16,
    channelCount: 2
  }
};

const screenShareMediaConstraints = {
  video: {
    width: { max: 1280 },
    height: { max: 720 },
    aspectRatio: 1,
    frameRate: { ideal: 10, max: 15 }
  },
  audio: {
    sampleSize: 16,
    channelCount: 2
  },
  cursor: true
};

const proxy_server = process.env.NODE_ENV === 'production'
  ? 'https://maxiserv.azurewebsites.net'
  : 'http://localhost:8000';

export default function VideoRoom(props) {
  const query = useQuery();
  const roomID = query.get('roomID');
  const username = query.get('username');

  const [media, setMedia] = useState({
    audio: false,
    video: false,
    isSharingScreen: false,
    oldStream: null,
    stream: null
  });

  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    socketRef.current = io.connect(proxy_server, { forceNew: true });
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {

      stream.getVideoTracks()[0].enabled = media.video;
      stream.getAudioTracks()[0].enabled = media.audio;

      socketRef.current.emit("join room", { roomID, username });
      setMedia({ ...media, stream, oldStream: stream })

      socketRef.current.on("get-users", ({ usersInThisRoom }) => {
        if (usersInThisRoom) {
          const npeers = [];

          usersInThisRoom.forEach(userID => {
            const peer = createPeer(userID, socketRef.current.id, stream);
            peersRef.current.push({ peerID: userID, peer, });
            npeers.push(peer);
          });
          setPeers(npeers);
        }
      });

      socketRef.current.on("user joined", ({ signal, callerID, username }) => {
        const peer = addPeer(signal, callerID, stream);
        peersRef.current.push({ peerID: callerID, peer, username });
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

  function createPeer(userToSignal, callerID, stream) {
    if (userToSignal && callerID) {

      const peer = new Peer({
        initiator: true,
        trickle: false,
        allowHalfTrickle: true,
        streams: [stream],
        config: iceServersConfig,
        sdpTransform: (sdp) => setMediaBitrate(sdp)
      });

      peer.on("signal", signal => {
        socketRef.current.emit("sending signal", { userToSignal, callerID, signal, username })
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
        streams: [stream],
        config: iceServersConfig,
        sdpTransform: (sdp) => setMediaBitrate(sdp)
      });

      peer.on("signal", signal => {
        socketRef.current.emit("returning signal", { signal, callerID })
      });

      peer.on('close', () => {
        console.log('Peer close');
        const newPeers = peersRef.current.filter(u => u.peerID !== callerID);
        peersRef.current = newPeers;
        setPeers(newPeers);
      });

      peer.on('error', (err) => {
        console.log('error', err);
        // props.history.push('/');
      });

      peer.signal(incomingSignal);
      return peer;
    }
  }

  const onMedia = async (mediaType) => {
    switch (mediaType) {
      case 'audio':
        media.stream.getAudioTracks()[0].enabled = !media.stream.getAudioTracks()[0].enabled
        setMedia({ ...media, audio: !media.audio })
        break;

      case 'video':
        const isVideoEnabled = !media.oldStream.getVideoTracks()[0].enabled;
        media.oldStream.getVideoTracks()[0].enabled = isVideoEnabled;
        setMedia({ ...media, stream: media.oldStream, video: isVideoEnabled, isSharingScreen: false })
        break;

      case 'share-screen':
        const shareStream = await navigator.mediaDevices.getDisplayMedia(screenShareMediaConstraints);
        const screenTrack = shareStream.getTracks()[0];
        console.log('Start sharing screen');

        if (peersRef.current[0]) {
          peersRef.current[0].peer.replaceTrack(
            peersRef.current[0].peer.streams[0].getVideoTracks()[0],
            screenTrack,
            peersRef.current[0].peer.streams[0]
          );
          setMedia({ ...media, isSharingScreen: true, stream: shareStream });

          screenTrack.onended = () => {
            peersRef.current[0].peer.replaceTrack(
              peersRef.current[0].peer.streams[0].getVideoTracks()[0],
              media.oldStream.getVideoTracks()[0],
              media.oldStream
            );

            setMedia({ ...media, isSharingScreen: false, stream: media.oldStream });
            console.log('End sharing screen');
          }
        }
        break;

      default:
        break;
    }
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
      <div
        className={'w-100 h-100 justify-center align-center media-grid-' + (peersRef.current.length + 1)}
      >
        <LocalVideo media={media} />
        {peersRef.current.length > 0 && peersRef.current.map((user, index) => <RemoteVideo key={index} user={user} />)}
      </div>

      <div className='w-100 media-controls d-flex justify-between'>

        <div>
          <button title="Number of users" disabled>
            <i className="fa fa-users"></i> {peersRef.current.length + 1}
          </button>
        </div>

        <div>
          <button onClick={() => { onMedia('audio'); }} title="Toggle Audio">
            <i className={media.audio ? 'fa fa-microphone' : 'fa fa-microphone-slash'}></i>
          </button>

          <button onClick={() => { onMedia('video'); }} title="Toggle Video">
            <i className={media.video ? 'fa fa-video' : 'fa fa-video-slash'}></i>
          </button>

          <button onClick={() => { onMedia('share-screen'); }} title="Toggle Share Screen">
            <i className={media.isSharingScreen ? 'bi bi-tv-fill' : 'fa fa-desktop'}></i>
          </button>

          <button className="bg-red" onClick={onHangout} title="Hangout">
            <i className='fa fa-phone-slash'></i>
          </button>
        </div>

        <div>
          <button title="Open chat box" disabled>
            <i className="fa fa-comments"></i>
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

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppConfig from "../../AppConfig";
import LocalVideo from "../../components/LocalVideo";

import RemoteVideo from "../../components/RemoteVideo";
import iceServersConfig from "../../utils/iceServersConfig";
import makeid from "../../utils/makeid";
import setMediaBitrate from "../../utils/setMediaBitrate";

let io = window.io;
let Peer = window.SimplePeer;

const mediaConstraints = {
  // video: {
  //   width: { max: 320 },
  //   height: { max: 240 },
  //   // aspectRatio: 1,
  //   frameRate: { ideal: 10, max: 15 }
  // },
  video: true,
  audio: true
};

const screenShareMediaConstraints = {
  // video: {
  //   width: { max: 1280 },
  //   height: { max: 720 },
  //   aspectRatio: 1,
  //   frameRate: { ideal: 10, max: 15 }
  // },
  video: true,
  audio: true,
  cursor: true
};

let username = localStorage.getItem('username') || makeid(5);

export default function VideoRoom(props) {
  const queryParams = useParams();
  const roomID = queryParams.roomID;

  const [media, setMedia] = useState({ audio: false, video: false, sharingScreen: false });
  const [localStream, setLocalStream] = useState({ current: null, old: null })

  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const peersRef = useRef([]);
  const messagesRef = useRef();

  const [showAside, setShowAside] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    socketRef.current = io.connect(AppConfig.BACKEND_URL, { forceNew: true });
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {

      stream.getVideoTracks()[0].enabled = media.video;
      stream.getAudioTracks()[0].enabled = media.audio;

      socketRef.current.emit("join room", { roomID, username });
      setLocalStream({ current: stream, old: stream });

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

      socketRef.current.on("message", payload => {
        const time = new Date().toLocaleTimeString().slice(0, 4);
        const isYou = username === payload.username ? 'You' : payload.username.replace(/-\d+/g, '');

        console.log(payload);

        if (!messagesRef || !messagesRef.current) return;

        if (+payload.type > 1) { // left room
          messagesRef.current.innerHTML += `<li style="color:red">${isYou} ${payload.message} ${time}</li>`;
        }

        if (+payload.type === 1) { // join room
          messagesRef.current.innerHTML += `<li style="color:#8bc34a">${isYou} ${payload.message} ${time}</li>`;
        }

        if (+payload.type < 1) {// chat message
          messagesRef.current.innerHTML += `<li>
          <h3 style="color: #00bcd4;font-weight: 600;margin:0;">
          <i class="fa fa-user"></i> ${isYou}: <small style="color: #9f9f9f;">${time}</small></h3>
          <br/>${payload.message}
          </li>`;
        }

        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      });

      socketRef.current.on("user-leave", ({ peerID, username }) => {
        const leftPeer = peersRef.current.find(u => u.peerID === peerID);
        if (leftPeer) {
          leftPeer.peer.destroy();

          const newPeers = peersRef.current.filter(u => u.peerID !== peerID);
          peersRef.current = newPeers;

          setPeers(newPeers);

          socketRef.current.emit('message', { roomID, username, message: ' Left room', type: 2 });
        }
      });

      socketRef.current.on("disconnect", payload => {
        console.log('disconnect -----> ', payload);
      });
    })

    return () => {
      if (localStream.current) localStream.current.getTracks().forEach((track) => track.stop());
      if (localStream.old) localStream.old.getTracks().forEach((track) => track.stop());

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
        // sdpTransform: (sdp) => setMediaBitrate(sdp)
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
        // sdpTransform: (sdp) => setMediaBitrate(sdp)
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
        const isAudioEnabled = localStream.current.getAudioTracks()[0].enabled;
        localStream.current.getAudioTracks()[0].enabled = !isAudioEnabled;
        setMedia({ ...media, audio: !isAudioEnabled })
        break;

      case 'video':
        const isVideoEnabled = localStream.current.getVideoTracks()[0].enabled;
        localStream.current.getVideoTracks()[0].enabled = !isVideoEnabled;
        setMedia({ ...media, video: !isVideoEnabled, sharingScreen: false });
        if (media.sharingScreen) {
          localStream.old.getVideoTracks()[0].enabled = !isVideoEnabled;
          setLocalStream({ ...localStream, current: localStream.old });
        }
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

          setMedia({ ...media, sharingScreen: true });
          setLocalStream({ ...localStream, current: shareStream });

          screenTrack.onended = () => {
            peersRef.current[0].peer.replaceTrack(
              peersRef.current[0].peer.streams[0].getVideoTracks()[0],
              localStream.old.getVideoTracks()[0],
              localStream.old
            );

            setMedia({ ...media, sharingScreen: false });
            setLocalStream({ ...localStream, current: localStream.old });
            console.log('End sharing screen');
          }
        }
        break;

      default:
        break;
    }
  }

  const onHangout = () => {
    if (localStream.current) localStream.current.getTracks().forEach((track) => track.stop());
    if (localStream.old) localStream.old.getTracks().forEach((track) => track.stop());

    peersRef.current.forEach(u => u.peer.destroy());
    socketRef.current.close();
    socketRef.current.disconnect();
    props.history.push('/')
  }

  const onSendMessage = e => {
    e.preventDefault();
    const message = e.target.elements[0].value;
    socketRef.current.emit('message', { roomID, username, message, type: 0 });
    e.target.reset();
  }

  const onSaveUsername = e => {
    e.preventDefault();
    const userName = e.target.elements[0].value + '-' + Date.now();
    username = userName;
    localStorage.setItem('username', userName);
    e.target.reset();
  }

  return (<main style={{ width: showAside ? 'calc(100vw - 320px)' : '100vw' }}>
    <div className={'w-100 h-100 justify-center align-center media-grid-' + (peersRef.current.length + 1)}>
      <LocalVideo stream={localStream.current} />
      {peersRef.current.length > 0 && peersRef.current.map((user, index) => <RemoteVideo key={index} user={user} />)}
    </div>

    <div className='w-100 media-controls'>

      <div className="d-flex align-center"></div>

      <div>
        <button onClick={() => { onMedia('audio'); }} title="Toggle Audio">
          <i className={media.audio ? 'fa fa-microphone' : 'fa fa-microphone-slash'}></i>
        </button>

        <button onClick={() => { onMedia('video'); }} title="Toggle Video">
          <i className={media.video ? 'fa fa-video' : 'fa fa-video-slash'}></i>
        </button>

        <button onClick={() => { onMedia('share-screen'); }} title="Toggle Share Screen">
          <i className={media.sharingScreen ? 'bi bi-tv-fill' : 'fa fa-desktop'}></i>
        </button>

        <button onClick={onHangout} title="Hangout">
          <i className='fa fa-phone-slash'></i>
        </button>

        <button title="Open chat box" onClick={() => { setShowAside(!showAside) }}>
          <i className="fa fa-comments mr-1"></i>{peersRef.current.length + 1}
        </button>
      </div>

      <div></div>
    </div>

    {showAside && <div className="h-100 chat-box" style={{ width: showAside ? '320px' : '0' }}>
      <header>
        <span onClick={() => { setShowSettings(false) }}><i className="fa fa-comments mr-1"></i>Chat box ({peersRef.current.length + 1})</span>
        <span onClick={() => { setShowSettings(true) }}><i className="fa fa-cogs mr-1"></i>Settings</span>
      </header>

      {showSettings
        ? <>
          <ul>
            <li>
              <form className="d-flex" onSubmit={onSaveUsername}>
                <input className="w-100" type="text" name="username" placeholder="username.." required />
                <button className="btn h-100" type="submit">save</button>
              </form>
            </li>
          </ul>

          <form>
            <label>Share url with friends</label>
            <input className="w-100" type="url" defaultValue={window.location.href} readOnly />
          </form>
        </>

        : <>
          <ul ref={messagesRef}></ul>

          <form className="w-100 d-flex justify-between align-center" onSubmit={onSendMessage}>
            <input className="w-100 h-100" type="text" name="message" placeholder="message.." required />
            <button className="btn" type="submit"><i className="fa fa-paper-plane"></i></button>
          </form>
        </>}
    </div>}

  </main>);
};

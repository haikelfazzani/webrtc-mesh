import React, { useEffect, useRef, useState } from "react";

import VideoEL from "../components/VideoEL";
import useQuery from "../hooks/useQuery";
import iceServersConfig from "../utils/iceServersConfig";

import poster from '../utils/poster'

import './Room.css';

let io = window.io;
let Peer = window.SimplePeer;

const mediaConstraints = {
  video: {
    width: { exact: 320 },
    height: { exact: 240 },
    frameRate: { ideal: 10, max: 15 }
  }, audio: true
};

const proxy_server = process.env.NODE_ENV === 'production'
  ? 'https://maxiserv.azurewebsites.net'
  : 'http://localhost:8000';

export default function Room(props) {
  const query = useQuery();
  const [media, setMedia] = useState({ audio: false, video: false, oldStream: null, stream: null });
  const roomID = query.get('roomID');

  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    socketRef.current = io.connect(proxy_server, { forceNew: true });
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {

      stream.getVideoTracks()[0].enabled = media.video;
      stream.getAudioTracks()[0].enabled = media.audio;

      window.currentMediaStream = stream;
      userVideo.current.srcObject = stream;
      socketRef.current.emit("join room", roomID);
      setMedia({ ...media, stream, oldStream: stream })

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
        console.log('disconnect -----> ', payload);
      });
    })

    return () => {
      window.currentMediaStream.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach(u => u.peer.destroy());
      if (userVideo.current) userVideo.current.srcObject = null;
      socketRef.current.close();
      socketRef.current.disconnect();
    }
  }, [roomID]);

  function createPeer(userToSignal, callerID, stream, currentUserId) {
    if (userToSignal && callerID) {
      const peer = new Peer({ initiator: true, trickle: false, stream, config: iceServersConfig });

      peer.on("signal", signal => {
        socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
      });

      peer.on('close', () => {
        console.log('Peer close');
      });

      peer.on('error', (err) => {
        peersRef.current.forEach(u => u.peer.destroy());
        props.history.push('/');
      });

      return peer;
    }
  }

  function addPeer(incomingSignal, callerID, stream) {
    if (incomingSignal && callerID) {
      const peer = new Peer({ initiator: false, trickle: false, stream, config: iceServersConfig })

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

  const onMedia = async (mediaType) => {
    switch (mediaType) {
      case 'audio':
        media.stream.getAudioTracks()[0].enabled = !media.stream.getAudioTracks()[0].enabled
        setMedia({ ...media, audio: !media.audio })
        break;

      case 'video':
        const isVideoEnabled = !media.oldStream.getVideoTracks()[0].enabled;
        media.oldStream.getVideoTracks()[0].enabled = isVideoEnabled;
        setMedia({ ...media, stream: media.oldStream, video: isVideoEnabled })
        break;

      case 'share-screen':

        const constraints = { cursor: true };
        const shareStream = await navigator.mediaDevices.getDisplayMedia(constraints);
        const screenTrack = shareStream.getTracks()[0];

        if (userVideo && userVideo.current) userVideo.current.srcObject = shareStream;

        if (peersRef.current[0]) {
          peersRef.current[0].peer.replaceTrack(
            peersRef.current[0].peer.streams[0].getVideoTracks()[0],
            screenTrack,
            media.stream
          )

          screenTrack.onended = function () {
            peersRef.current[0].peer.replaceTrack(
              peersRef.current[0].peer.streams[0].getVideoTracks()[0],
              media.stream.getVideoTracks()[0],
              media.stream
            );
            userVideo.current.srcObject = media.stream;
            setMedia({ ...media, controls: false })
          }

          setMedia({ ...media, video: true, controls: !media.controls, stream: shareStream });
        }
        break;

      case 'hangout':
        if (!media.stream) return;
        media.stream.getTracks().forEach((track) => track.stop());

        peersRef.current.forEach(u => {
          u.peer.destroy();
        });

        userVideo.current.srcObject = null;
        socketRef.current.close();
        socketRef.current.disconnect();
        props.history.push('/')
        break;

      default:
        break;
    }
  }

  return (
    <main>
      <div
        className={'w-100 h-100 media-videos justify-center align-center grid-' + (peersRef.current.length + 1)}
      >

        <video className="w-100 h-100 br7"
          poster={poster('You')}
          ref={userVideo}
          autoPlay
          playsInline
          controls
          style={{ display: media.video ? 'block' : 'none' }}>
        </video>

        <div className="w-100 h-100 bg-black d-flex justify-center align-center br7"
          style={{ display: media.video ? 'none' : 'flex' }}>
          <img height="100" width="100" src={poster('You')} alt="You" />
        </div>

        {peersRef.current.length > 0 && peersRef.current.map((user, index) => <VideoEL
          clx="br7"
          key={index}
          user={user}
        />)}
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

          <button onClick={() => { onMedia('share-screen'); }}><i className='fa fa-desktop'></i></button>

          <button className="bg-red" onClick={() => { onMedia('hangout'); }} title="Hangout">
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
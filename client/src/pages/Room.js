import React, { useEffect, useRef, useState } from "react";

import VideoEL from "../components/VideoEL";
import useQuery from "../hooks/useQuery";
import iceServersConfig from "../utils/iceServersConfig";
import './Room.css'

import { PackedGrid } from 'react-packed-grid';


let io = window.io;
let Peer = window.SimplePeer;

const mediaConstraints = {
  video: {
    width: { min: 320, max: 480 },
    height: { min: 414, max: 853 },
    frameRate: { ideal: 10, max: 15 }
  }, audio: true
};

const proxy_server = process.env.NODE_ENV === 'production'
  ? 'https://maxiserv.azurewebsites.net'
  : 'http://localhost:8000';

export default function Room(props) {

  const query = useQuery()
  const [media, setMedia] = useState({ audio: false, video: false });
  const roomID = query.get('roomID');

  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);

  const videosRef = useRef(null)

  useEffect(() => {
    socketRef.current = io.connect(proxy_server, { forceNew: true });
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {

      stream.getVideoTracks()[0].enabled = media.video;
      stream.getAudioTracks()[0].enabled = media.audio;

      window.currentMediaStream = stream;
      userVideo.current.srcObject = stream;
      socketRef.current.emit("join room", roomID);
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
          console.log(npeers, peersRef.current, currentUserId);
        }
      });

      socketRef.current.on("user joined", ({ signal, callerID }) => {
        const peer = addPeer(signal, callerID, stream);
        peersRef.current.push({ peerID: callerID, peer, })
        setPeers(users => [...users, peer]);
        console.log(callerID);
      });

      socketRef.current.on("receiving returned signal", ({ signal, id }) => {
        const item = peersRef.current.find(p => p.peerID === id);
        item.peer.signal(signal);
        console.log(id);
      });

      socketRef.current.on("user-leave", ({ peerID }) => {
        const newPeers = peersRef.current.filter(u => u.peerID !== peerID);
        peersRef.current = newPeers;
        setPeers(newPeers);
      });

      socketRef.current.on("disconnect", payload => {
        console.log('disconnect ', 'payload');
      });
    })

    return () => {
      window.currentMediaStream.getTracks().forEach((track) => track.stop());
      userVideo.current.srcObject = null;
      socketRef.current.close();
      socketRef.current.disconnect();
    }
  }, [roomID]);

  function createPeer(userToSignal, callerID, stream, currentUserId) {
    console.log('currentUserId ', currentUserId);
    if (userToSignal && callerID) {
      const peer = new Peer({ initiator: true, trickle: false, stream, config: iceServersConfig });

      peer.on("signal", signal => {
        socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
      });

      peer.on('close', () => {
        console.log('Peer close');
      });

      peer.on('error', (err) => {
        console.log(err);
      });

      return peer;
    }
  }

  function addPeer(incomingSignal, callerID, stream) {
    console.log('callerID ', callerID);
    if (incomingSignal && callerID) {
      const peer = new Peer({ initiator: false, trickle: false, stream, config: iceServersConfig })

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
        console.log(callerID, err);
        const newPeers = peersRef.current.filter(u => u.peerID !== callerID);
        peersRef.current = newPeers;
        setPeers(newPeers);
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
        const isVideoEnabled = !media.stream.getVideoTracks()[0].enabled;
        media.stream.getVideoTracks()[0].enabled = isVideoEnabled;
        setMedia({ ...media, video: isVideoEnabled })
        break;

      case 'share-screen':
        console.log(peersRef.current);
        const constraints = { cursor: true };
        const shareStream = await navigator.mediaDevices.getDisplayMedia(constraints);
        const screenTrack = shareStream.getTracks()[0];
        if (userVideo && userVideo.current) userVideo.current.srcObject = shareStream;
        setMedia({ ...media, controls: !media.controls, stream: shareStream })

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
        }
        break;

      case 'hangout':
        const newPeers = peersRef.current.filter(u => u.peerID !== peerID);
        peersRef.current = newPeers;
        media.stream.getTracks().forEach((track) => track.stop());
        userVideo.current.srcObject = null;
        socketRef.current.close();
        socketRef.current.disconnect();
        setPeers(newPeers);
        props.history.push('/')
        break;

      default:
        break;
    }
  }

  return (
    <main> {console.log(peers.length)}
      <PackedGrid
        className="w-100 h-100 align-center justify-center video-grid"
      >
        <div className="w-100 box"><video className="w-100 br7" muted ref={userVideo} autoPlay playsInline controls></video></div>
        {peersRef.current.length > 0 && peersRef.current.map((user, index) => <VideoEL
          clx="br7"
          key={index}
          user={user}
        />)}
      </PackedGrid>

      <div className='media-controls d-flex justify-center align-center blur br7'>
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
      </div>

      {/* <div className="chat-box">
        <ul>
          {peersRef.current && peersRef.current.map((peer, index) => <li key={index}>{peer.peerID}</li>)}
        </ul>
      </div> */}
    </main>
  );
};
import React, { useEffect, useRef, useState } from "react";
import AlertModal from "../components/AlertModal";
import Video from "../components/Video";
import useQuery from "../hooks/useQuery";
import makeid from "../utils/makeid";
import './Room.css'

let io = window.io;
let Peer = window.SimplePeer;


const proxy_server = process.env.NODE_ENV === 'production'
  ? 'https://maxiserv.azurewebsites.net'
  : 'http://localhost:8000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function Room() {

  const query = useQuery()
  const roomID = query.get('roomID');
  //const initiator = query.get('initiator');

  const [media, setMedia] = useState({ audio: false, video: false, stream: null });
  const [showUsersOrChat, setShowUsersOrChat] = useState({ users: false, chat: false });
  const [users, setUsers] = useState(null)

  // peer who wants to join the room
  const [peerCaller, setPeerCaller] = useState({
    id: null,
    isAccepted: false,
    isCreatorOfRoom: false,
    username: makeid(5)
  });

  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);

  const mediaConstraints = {
    "audio": true,
    "video": {
      "width": {
        "min": "200",
        "max": "640"
      },
      "height": {
        "min": "100",
        "max": "480"
      },
      "frameRate": {
        "min": "1",
        "max": "30"
      }
    }
  };

  useEffect(() => {
    socketRef.current = io.connect(proxy_server);
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {

      stream.getVideoTracks()[0].enabled = media.video;
      stream.getAudioTracks()[0].enabled = media.audio;

      userVideo.current.srcObject = stream;
      socketRef.current.emit("join room", { roomID, username: peerCaller.username });
      setMedia({ ...media, stream });

      socketRef.current.on("user-wants-to-join-room", async ({ peerID }) => {
        console.log("user-wants-to-join-room --> ", peerID);
        setPeerCaller({ ...peerCaller, isAccepted: false, id: peerID })
      });

      socketRef.current.on("get-users", async ({ MemUsers, peerID }) => {
        await sleep(1000)
        if (MemUsers) {
          const npeers = [];
          MemUsers.forEach(user => {
            const peer = createPeer(user.id, socketRef.current.id, stream, peerID);
            peersRef.current.push({ peerID: user.id, peer, });
            npeers.push(peer);
          });
          setPeers(npeers);
          setUsers(MemUsers)
        }
      });

      socketRef.current.on("user joined", async ({ signal, callerID }) => {
        const peer = addPeer(signal, callerID, stream);
        peersRef.current.push({ peerID: callerID, peer, })
        setPeers(users => [...users, peer]);
        console.log(callerID);
      });

      socketRef.current.on("receiving returned signal", async ({ signal, id }) => {
        await sleep(1000)
        const item = peersRef.current.find(p => p.peerID === id);
        item.peer.signal(signal);
        console.log(id);
      });

      socketRef.current.on("user-leave", async ({ peerID }) => {
        await sleep(1000)
        const newPeers = peersRef.current.filter(u => u.peerID !== peerID);
        peersRef.current = newPeers;
        setPeers(newPeers);
        await new Audio('https://www.myinstants.com/media/sounds/leave_call_bfab46cf473a2e5d474c1b71ccf843a1.mp3').play()
      });

      socketRef.current.on("disconnect", payload => {
        console.log('disconnect ', 'payload');
      });
    })
  }, [roomID]);

  function createPeer(userToSignal, callerID, stream, currentUserId) {
    console.log('currentUserId ', currentUserId);
    if (userToSignal && callerID) {
      const peer = new Peer({ initiator: true, trickle: false, stream, });

      peer.on("signal", signal => {
        console.log(signal);
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
    console.log('callerID ', incomingSignal, callerID);
    if (incomingSignal && callerID) {
      const peer = new Peer({ initiator: false, trickle: false, stream, })

      peer.on("signal", async signal => {
        socketRef.current.emit("returning signal", { signal, callerID })
        await new Audio('https://www.myinstants.com/media/sounds/join_call_6a6a67d6bcc7a4e373ed40fdeff3930a.mp3').play()
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
        media.stream.getVideoTracks()[0].enabled = !media.stream.getVideoTracks()[0].enabled
        setMedia({ ...media, video: !media.video })
        break;

      case 'share-screen':
        console.log(peersRef.current);
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
          }
        }
        break;

      case 'hangout':
        window.location.href = '/'
        break;

      case 'show-users':
        setShowUsersOrChat({ ...showUsersOrChat, users: !showUsersOrChat.users })
        break;

      case 'show-chat':
        setShowUsersOrChat({ ...showUsersOrChat, chat: !showUsersOrChat.chat })
        break;

      default:
        break;
    }
  }

  const onAcceptToJoin = (accepted) => {
    if (accepted) {
      socketRef.current.emit("accept-user-to-join", { roomID, peerCaller });
      setPeerCaller({ ...peerCaller, isAccepted: true })
    }
  }

  return (
    <main> {console.log(peers.length)}

      {!peerCaller.isAccepted && !peerCaller.isCreatorOfRoom && <AlertModal status={true}>
        <p>{peerCaller.id}</p>
        <button className='btn' onClick={() => { onAcceptToJoin(true) }}>Accept</button>
        <button className='btn' onClick={() => { onAcceptToJoin(false) }}>Cancel</button>
      </AlertModal>}


      <div className={"h-100 w-100 media-videos justify-between col-" + (peers ? peers.length + 1 : 1)}>

        <div className="box scale vertical-align">
          <video className="br7" muted ref={userVideo} autoPlay playsInline></video>
          {!media.video && <div className="w-100 h-100 vertical-align"><img alt="video conf" src="https://i.ibb.co/b3GzJn1/user.png" /></div>}
        </div>
        {peersRef.current.length > 0 && peersRef.current.map((user, index) => <Video key={index} user={user} />)}
      </div>

      <div className='media-controls d-flex justify-center align-center blur br7'>
        <div>
          <button onClick={() => { onMedia('audio'); }} title="Toggle Audio">
            <i className={media.audio ? 'fa fa-microphone' : 'fa fa-microphone-slash'}></i>
          </button>

          <button onClick={() => { onMedia('video'); }} title="Toggle Video">
            <i className={media.video ? 'fa fa-video' : 'fa fa-video-slash'}></i>
          </button>

          <button onClick={() => { onMedia('share-screen'); }}><i className='fa fa-desktop'></i></button>
          <button onClick={() => { onMedia('show-chat'); }}><i className='fa fa-comments'></i></button>
          <button onClick={() => { onMedia('show-users'); }}><i className='fa fa-users'></i></button>
          <button onClick={() => { onMedia('show-users'); }}><i className='fa fa-folder-open'></i></button>

          <button className="bg-red" onClick={() => { onMedia('hangout'); }} title="Hangout">
            <i className='fa fa-phone-slash'></i>
          </button>
        </div>
      </div>

      {showUsersOrChat.users && <div className="h-100 bg-dark chat-box">
        <ul>
          {users && users.map((peer, index) => <li key={index}>{peer.username}</li>)}
        </ul>
      </div>}

      {showUsersOrChat.chat && <div className="h-100 bg-dark chat-box">
        <ul>
          {peersRef.current && peersRef.current.map((peer, index) => <li key={index}>{peer.peerID}</li>)}
        </ul>
      </div>}
    </main>
  );
};

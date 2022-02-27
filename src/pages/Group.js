import React, { useEffect, useState, useRef } from 'react';
import AlertModal from '../components/AlertModal';
import useQuery from '../hooks/useQuery';
import makeid from '../utils/makeid';
import './Room.css'

const proxy_server = process.env.NODE_ENV === 'production'
  ? 'https://maxiserv.azurewebsites.net'
  : 'http://localhost:8000';

export default function Room() {

  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const [currentUser, setCurrentUser] = useState({ id: '', username: makeid(5) });
  const currentPeer = useRef(null)

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  let query = useQuery();
  const connectedUsers = useRef([]);
  const [media, setMedia] = useState({ video: false, audio: false, stream: null, controls: false });
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    socket.current = window.io.connect(proxy_server);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      stream.getVideoTracks()[0].enabled = false;
      stream.getAudioTracks()[0].enabled = false;

      setMedia({
        audio: stream.getAudioTracks()[0].enabled,
        video: stream.getVideoTracks()[0].enabled,
        stream
      });

      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    socket.current.on("connect", () => {
      socket.current.emit('joined', {
        username: currentUser.username,
        roomID: query.get('roomID'),
        userId: socket.current.id
      });
    });

    socket.current.on("userId", (id) => {
      setCurrentUser({ ...currentUser, id });
    });

    socket.current.on("get-Users", (users) => {
      connectedUsers.current = users;
    });

    socket.current.on("receiving-call", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.current.on("user-leaved-room", async ({ currentRoomID, id }) => {
      console.log('user-leaved-room -----> ', currentRoomID);
      const filtredUsers = connectedUsers.current.filter(u => u.id !== id);
      console.log(filtredUsers);
      connectedUsers.current = filtredUsers;
      await new Audio('https://www.myinstants.com/media/sounds/leave_call_bfab46cf473a2e5d474c1b71ccf843a1.mp3').play()
      setCallAccepted(false)
      setReceivingCall(false)
      // if (currentPeer && currentPeer.current) {
      //   userVideo.current = null;
      //   partnerVideo.current = null;
      // }
    });

    socket.current.on("disconnect", () => {
      console.log('disconnect --- > ');
      if (currentPeer) {
        setMedia(null)
        currentPeer.current.destroy()
        currentPeer.current.removeStream(media.stream)
      }
    })
  }, []);

  function startCall(id) {
    const peer = new window.SimplePeer({
      initiator: true,
      trickle: false,
      stream: media.stream,
      channelName: query.get('roomID')
    });

    currentPeer.current = peer

    peer.on("signal", async data => {
      socket.current.emit("start-call-user", { userToCall: id, signalData: data, from: currentUser.id });
      await new Audio('https://www.myinstants.com/media/sounds/google-meet-ask-to-join-sound.mp3').play()
    })

    peer.on("stream", stream => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", signal => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    socket.current.on("disconnect", async () => {
      peer.removeStream(media.stream)
      peer.destroy()
    });
  }

  function onAcceptOrCancelCall(isCallAccepted) {
    setCallAccepted(isCallAccepted);

    if (!isCallAccepted) return;

    const peer = new window.SimplePeer({
      initiator: false,
      trickle: false,
      stream: media.stream,
      channelName: query.get('roomID')
    });

    currentPeer.current = peer

    peer.on("signal", async data => {
      socket.current.emit("accept-user-call", { signal: data, to: caller });
      await new Audio('https://www.myinstants.com/media/sounds/join_call_6a6a67d6bcc7a4e373ed40fdeff3930a.mp3').play()
    })

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);

    socket.current.on("disconnect", () => {
      peer.removeStream(media.stream)
      peer.destroy()
    })
  }

  // media handling
  const onScreenShare = async () => {
    const constraints = { cursor: true };
    const shareStream = await navigator.mediaDevices.getDisplayMedia(constraints);
    const screenTrack = shareStream.getTracks()[0];
    if (userVideo && userVideo.current) userVideo.current.srcObject = shareStream;
    setMedia({ ...media, controls: !media.controls })

    if (currentPeer.current) {
      currentPeer.current.replaceTrack(
        currentPeer.current.streams[0].getVideoTracks()[0],
        screenTrack,
        media.stream
      )

      screenTrack.onended = function () {
        currentPeer.current.replaceTrack(
          currentPeer.current.streams[0].getVideoTracks()[0],
          media.stream.getVideoTracks()[0],
          media.stream
        );
        userVideo.current.srcObject = media.stream;
        setMedia({ ...media, controls: false })
      }
    }
  }

  const onToggleCam = () => {
    media.stream.getVideoTracks()[0].enabled = !media.stream.getVideoTracks()[0].enabled
    setMedia({ ...media, video: !media.video });
  }

  const onToggleAudio = () => {
    media.stream.getAudioTracks()[0].enabled = !media.stream.getAudioTracks()[0].enabled
    setMedia({ ...media, audio: !media.audio })
  }

  const onChat = () => { setShowChat(!showChat) }

  return (<main>

    <div className='w-100 media-videos'>
      {media && media.stream && <video className='br7' playsInline ref={userVideo} autoPlay controls={media.controls} />}
      {callAccepted && <video className='br7' playsInline ref={partnerVideo} autoPlay controls={media.controls}></video>}
    </div>

    {currentUser && <div className='media-controls d-flex justify-center align-center blur'>
      <div>
        <button onClick={onToggleCam} title="Toggle Video">
          <i className={media.video ? 'fa fa-video' : 'fa fa-video-slash'}></i>
        </button>
        <button onClick={onToggleAudio} title="Toggle Audio">
          <i className={media.audio ? 'fa fa-microphone' : 'fa fa-microphone-slash'}></i>
        </button>
        <button onClick={onScreenShare}><i className='fa fa-desktop'></i></button>
        <button onClick={onChat}><i className='fa fa-comments'></i></button>
      </div>
    </div>}

    {showChat && <div className='h-100 chat-box bg-dark'>
      <ul>
        {connectedUsers.current.map(u => <li key={u.id}>{u.username} ({u.id})</li>)}
      </ul>

      <form>
        <input type="text" placeholder='message' required />
        <button className='btn' type='submit'>send</button>
      </form>
    </div>}

    {!query.get('initiator') && <AlertModal status={true}>
      {!callAccepted && connectedUsers.current && connectedUsers.current.map(user => {
        if (user.id === currentUser.id) {
          return null;
        }
        return (
          <button className='btn' key={user.id} onClick={() => startCall(user.id)}>Join room</button>
        );
      })}
    </AlertModal>}

    {query.get('initiator') && !receivingCall && <AlertModal status={true}>
      <input className='w-100' type="text" defaultValue={window.location.href.replace(/&initiator=true/g, '')} />
    </AlertModal>}


    {!callAccepted && receivingCall && <AlertModal status={true}>
      <p>{caller} is calling you</p>
      <button className='btn' onClick={() => { onAcceptOrCancelCall(true) }}>Accept</button>
      <button className='btn' onClick={() => { onAcceptOrCancelCall(false) }}>Cancel</button>
    </AlertModal>}

  </main>
  );
}

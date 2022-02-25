import React, { useEffect, useState, useRef } from 'react';
import useQuery from '../hooks/useQuery';
import makeid from '../utils/makeid';

const proxy_server = process.env.NODE_ENV === 'production'
  ? 'https://maxiserv.azurewebsites.net'
  : 'http://localhost:8000';

function Room() {
  const [users, setUsers] = useState([]);

  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const [currentUser, setCurrentUser] = useState({ id: '', username: makeid(5) });
  const [currentPeer, setCurrentPeer] = useState()

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  let query = useQuery();
  const [media, setMedia] = useState({ video: false, audio: false, stream: null });

  useEffect(() => {
    socket.current = window.io.connect(proxy_server);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      stream.getVideoTracks()[0].enabled = false;
      stream.getAudioTracks()[0].enabled = false;

      console.log(query.get('initiator'));

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
        roomID : query.get('roomID'), 
        currentUser 
      });
    });

    socket.current.on("userId", (id) => {
      setCurrentUser({ ...currentUser, id });
    });

    socket.current.on("allUsers", (users) => {
      setUsers(users);
    });

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.current.on("disconnect", (data) => {
      console.log('disconnect');
      currentPeer.removeStream(media.stream)
      currentPeer.destroy()
    })
  }, []);

  function startCall(id) {
    const peer = new window.SimplePeer({
      initiator: true,
      trickle: false,
      stream: media.stream,
      channelName: query.get('roomID')
    });

    peer.on("signal", data => {
      socket.current.emit("callUser", { userToCall: id, signalData: data, from: currentUser.id })
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

    socket.current.on("disconnect", () => {
      userVideo.current = null;
      partnerVideo.current = null;
      media.stream(null);
      setCallAccepted(false)
      setReceivingCall(false)
    });

    setCurrentPeer(peer);
  }

  function acceptCall() {
    setCallAccepted(true);
    const peer = new window.SimplePeer({
      initiator: false,
      trickle: false,
      stream: media.stream,
      channelName: query.get('roomID')
    });

    peer.on("signal", data => {
      socket.current.emit("acceptCall", { signal: data, to: caller })
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

  const onScreenShare = async () => {
    const constraints = { cursor: true };
    const shareStream = await navigator.mediaDevices.getDisplayMedia(constraints);
    const screenTrack = shareStream.getTracks()[0];

    // const res = stream.getVideoTracks().find((sender) => sender.track.kind === 'video');
    // console.log(res);

    console.log(currentPeer, media.stream.getTracks());

    if (currentPeer) {
      media.stream.getTracks().forEach(track => {
        console.log(track);
        currentPeer.removeTrack(track, media.stream)
      });


      currentPeer.addTrack(screenTrack, media.stream)
      userVideo.current.srcObject = shareStream
      // currentPeer.removeStream(shareStream)
      // currentPeer.addStream(stream)
    }
  }

  const onToggleCam = () => {
    media.stream.getVideoTracks()[0].enabled = media.video
    setMedia({ ...media, video: !media.video })
  }

  const onToggleAudio = () => {
    media.stream.getAudioTracks()[0].enabled = media.audio
    setMedia({ ...media, audio: !media.audio })
  }

  return (<main>

    <div className='grid-4'>
      <div> {console.log(users)}
        {media.stream && <video playsInline muted ref={userVideo} autoPlay />}
        {currentUser && <span>{currentUser.username}</span>}
        <button onClick={onToggleCam}>{media.video ? 'enable Video' : 'disbale Video'}</button>
        <button onClick={onToggleAudio}>{media.audio ? 'enable Audio' : 'disbale Audio'}</button>
        {/* <button onClick={onScreenShare}>Screen Share</button> */}
      </div>

      {callAccepted && <div><video playsInline ref={partnerVideo} autoPlay /></div>}
    </div>

    <div className='h-100 bg-dark'>
      <form>
        <input type="text" required />
        <button>send</button>
      </form>
    </div>

    {!query.get('initiator') && <div className='pub'>
      {!callAccepted && users && users.map(user => {
        if (user.id === currentUser.id) {
          return null;
        }
        return (
          <button key={user.id} onClick={() => startCall(user.id)}>get in to room</button>
        );
      })}
    </div>}

    {query.get('initiator') && !receivingCall && <div className='pub'>
      <input className='w-100' type="text" defaultValue={window.location.href.replace(/&initiator=true/g,'')} />
    </div>}


    {!callAccepted && receivingCall && <div className='pub'>
      <p>{caller} is calling you</p>
      <button onClick={acceptCall}>Accept</button>
    </div>}
  </main>
  );
}

export default Room;

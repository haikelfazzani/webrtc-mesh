import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import makeid from '../utils/makeid';

const proxy_server = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_PROXY
  : 'http://localhost:8000';

function Room() {
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const [currentUser, setCurrentUser] = useState();

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  const { roomID } = useParams()

  useEffect(() => {
    socket.current = window.io.connect(proxy_server);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    socket.current.on("connect", () => {
      const username = makeid(5);
      socket.current.emit('joined', { username, roomID, currentUser });
      setCurrentUser({ ...currentUser, username });
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
    })
  }, []);

  function callPeer(id) {
    const peer = new window.SimplePeer({ initiator: true, trickle: false, stream: stream });

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
    })
  }

  function acceptCall() {
    setCallAccepted(true);
    const peer = new window.SimplePeer({ initiator: false, trickle: false, stream: stream });
    peer.on("signal", data => {
      socket.current.emit("acceptCall", { signal: data, to: caller })
    })

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  const onDisbleVid = () => {
    const isEnabled = stream.getVideoTracks()[0].enabled;
    stream.getVideoTracks()[0].enabled = !isEnabled
  }

  const onDisbleAudio = () => {
    const isEnabled = stream.getAudioTracks()[0].enabled;
    stream.getAudioTracks()[0].enabled = !isEnabled
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <video playsInline muted ref={userVideo} autoPlay />
    );
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <video playsInline ref={partnerVideo} autoPlay />
    );
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (
      <>
        <p>{caller} is calling you</p>
        <button onClick={acceptCall}>Accept</button>
      </>
    )
  }
  return (
    <div className='grid-2'>
      <div className='grid-4'>
        <div>
          {UserVideo}
          <button onClick={onDisbleVid}>disbale Video</button>
          <button onClick={onDisbleAudio}>disbale Audio</button>
        </div>
        <div>
          {PartnerVideo}
        </div>
      </div>


      <div className='grid-2'> {console.log(users)}
        {users && users.map(user => {
          if (user.id === currentUser.id) {
            return null;
          }
          return (
            <button key={user.id} onClick={() => callPeer(user.id)}>get in to room</button>
          );
        })}
      </div>
      {!callAccepted && <div className='pub'>{incomingCall}</div>}
    </div>
  );
}

export default Room;

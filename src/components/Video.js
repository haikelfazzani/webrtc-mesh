import { useEffect, useRef } from "react";

export default function Video({ user , clx}) {
  const ref = useRef();

  useEffect(() => {
    if(user && user.peer) {
      user.peer.on("stream", stream => {
        ref.current.srcObject = stream;
      })
    }
  }, []);

  return (<div className="box scale">
    <video className="br7" playsInline autoPlay ref={ref}></video>
    <span>{user.peerID}</span>
  </div>);
}
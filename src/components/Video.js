import { useEffect, useRef } from "react";

export default function Video({ user , media}) {
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
    <div className="w-100 h-100 vertical-align"><img alt="video conf" src="https://i.ibb.co/b3GzJn1/user.png" /></div>
  </div>);
}
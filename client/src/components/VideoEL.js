import { useEffect, useRef } from "react";

export default function VideoEL({ user , media}) {
  const ref = useRef();

  useEffect(() => {
    if(user && user.peer) {
      user.peer.on("stream", stream => {
        ref.current.srcObject = stream;
      })
    }
  }, []);

  return (<div className="w-100 box">
    <video className="w-100 br7" playsInline autoPlay ref={ref} controls></video>
    {/* <div className="w-100 h-100 vertical-align"><img alt="video conf" src="https://i.ibb.co/b3GzJn1/user.png" /></div> */}
  </div>);
}
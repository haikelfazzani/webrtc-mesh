import { useEffect, useRef } from "react";

export default function VideoEL({ user , media}) {
  const ref = useRef();

  useEffect(() => {
    if(user && user.peer) {
      user.peer.on("stream", stream => {
        ref.current.srcObject = stream;
      })
    }

    //console.log(media, user);
  }, []);

  return <video className="w-100 h-100 br7" playsInline autoPlay ref={ref} controls></video>;
}
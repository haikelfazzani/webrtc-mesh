import { useEffect, useRef } from "react";
import poster from '../utils/poster';

export default function LocalAudio({ user, media, isLocal = false }) {
  const ref = useRef();

  useEffect(() => {
    if (!isLocal && user && user.peer) {
      user.peer.on("stream", stream => {
        ref.current.srcObject = stream;
      });
    }
  }, []);

  if (isLocal && media.stream) {
    return <div className="w-100 h-100 bg-black d-flex justify-center align-center br7">
      <img height="100" width="100" src={poster('You')} alt="You" />
      <audio className="w-100 h-100 br7" playsInline autoPlay src={media.stream}></audio>
    </div>
  }
  else {
    return <div className="w-100 h-100 bg-black d-flex justify-center align-center br7">
      <img height="100" width="100" src={poster(user.peerID)} alt="You" />
      <audio className="w-100 h-100 br7" playsInline autoPlay ref={ref}></audio>
    </div>
  }
}
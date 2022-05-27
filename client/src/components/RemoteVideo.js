import { useEffect, useRef } from "react";
import poster from '../utils/poster';

export default function RemoteVideo({ user }) {
  const videoRef = useRef();

  useEffect(() => {
    if (user && user.peer) {
      user.peer.on("stream", stream => {
        videoRef.current.srcObject = stream;
      });

      // user.peer.on('track', (track, stream) => {
      //   console.log(track, stream);
      // })
    }
  }, []);

  return <div className="w-100 h-100 bg-black d-flex justify-center align-center br7">
    {/* <img height="100" width="100" src={poster(user.username)} alt="You" /> */}
    <video
      className="w-100 h-100 br7"
      poster={poster(user.username)}
      playsInline
      autoPlay
      ref={videoRef}
      controls></video>
  </div>
}
import { memo, useEffect, useRef } from "react";
import poster from '../utils/poster';

function LocalVideo({ media }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef && videoRef.current) videoRef.current.srcObject = media.stream;

    return () => {
      if (videoRef && videoRef.current) videoRef.current.srcObject = null;
    }
  }, [media]);

  if (media.video) {
    return <video
      ref={videoRef}
      className="w-100 h-100 br7"
      poster={poster('You')}
      playsInline
      autoPlay
      controls={media.isSharingScreen}>
    </video>
  }
  else {
    return <div className="w-100 h-100 bg-black d-flex justify-center align-center br7">
      <img height="100" width="100" src={poster('You')} alt="You" />
    </div>
  }
}

export default memo(LocalVideo)
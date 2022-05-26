import React from 'react'
import makeid from '../../utils/makeid';

export default function CreateRoom(props) {

  const roomID = window.cryptoUid(12);

  const onCreateRoom = () => {
    props.history.push(`/room?roomID=${roomID}&username=${makeid(5)}&initiator=true`)
  }

  const onCreateAudioRoom = () => {
    props.history.push(`/audio-room?roomID=${roomID}&username=${makeid(5)}&initiator=true`)
  }

  return (
    <div>CreateRoom
      <button className='btn mb-3' onClick={onCreateRoom}>Create room</button>
      <div></div>
      <button className='btn' onClick={onCreateAudioRoom}>Create audio room</button>
    </div>
  )
}

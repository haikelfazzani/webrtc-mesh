import React from 'react'
import makeid from '../utils/makeid';

export default function CreateRoom(props) {

  const roomID = window.cryptoUid(12);

  const onCreateRoom = () => {
    props.history.push(`/room?roomID=${roomID}&username=${makeid(5)}&initiator=true`)
  }

  return (
    <div>CreateRoom

      <button className='btn' onClick={onCreateRoom}>Create room</button>
    </div>
  )
}

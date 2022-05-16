import React from 'react'
import useQuery from '../hooks/useQuery'
import makeid from '../utils/makeid'

export default function JoinRoom(props) {

  const query = useQuery()
  const roomID = query.get('roomID');

  const onJoinRoom = () => {
    props.history.push(`/room?roomID=${roomID}&username=${makeid(5)}&initiator=false`)
  }

  return (
    <div>JoinRoom


      <button className='btn' onClick={onJoinRoom}>Join room</button>
    </div>
  )
}

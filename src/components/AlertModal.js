import React, { useState } from 'react'
import "./AlertModal.css";

export default function AlertModal({ children, status = false }) {

  const [state, setState] = useState(status)

  return (
    <div className='alert-modal br7 blur' style={{ display: state ? ' flex' : 'none' }}>
      <div>{children}</div>
      <button className='btn ml-2' onClick={() => { setState(!state) }}>x</button>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

export default function Nav() {
  return <nav className='w-100 container d-flex justify-between align-center'>
    <ul className='d-flex align-center'>
      <li className='nav-brand pl-0'><Link to="/"><i className='fa fa-video mr-1'></i>La Reunion</Link></li>
      <li><Link to="/">Home</Link></li>
      <li><Link to="/about">About</Link></li>
    </ul>

    <ul className='d-flex align-center'>
      <li>{new Date().toLocaleString()}</li>
      <li><i className='fa fa-info-circle'></i></li>
      <li><i className='fa fa-cog'></i></li>
      <li><Link className='btn black' to="/login"><i className='fa fa-sign-in-alt mr-1'></i>Login</Link></li>
    </ul>
  </nav>
}

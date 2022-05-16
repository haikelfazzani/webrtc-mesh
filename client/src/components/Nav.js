import React from 'react'
import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className='w-100 container d-flex justify-between'>
      <ul className='d-flex'>
        <li className='nav-brand pl-0'><Link to="/"><i className='fa fa-video'></i> Friend Call</Link></li>
        <li><Link to="/">home</Link></li>
        <li><Link to="/">about</Link></li>
      </ul>


      <ul>
        <li>{new Date().toUTCString()}</li>
        <li><i className='fa fa-info-circle'></i></li>
        <li><i className='fa fa-cog'></i></li>
      </ul>
    </nav>
  )
}

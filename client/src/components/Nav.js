import { useAuth0 } from '@auth0/auth0-react';
import React from 'react'
import { Link } from 'react-router-dom';

export default function Nav() {

  const { isLoading, isAuthenticated, error, user, loginWithRedirect, logout } = useAuth0();

  const onLogin = () => {
    loginWithRedirect()
  }

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

      {isAuthenticated
        ? <li><button className='btn bg-red' onClick={() => { logout({ logoutParams: { returnTo: window.location.origin } }) }}>
          <i className='fa fa-sign-out-alt mr-1'></i>Logout</button></li>
        : <li><button className='btn black' onClick={onLogin}><i className='fa fa-sign-in-alt mr-1'></i>Login</button></li>
      }
    </ul>
  </nav>
}

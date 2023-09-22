import React, { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useHistory } from 'react-router-dom';
import AuthService from '../services/AuthService';
import Spinner from '../components/Spinner';

export default function Login() {

  const history = useHistory();
  const [message, setMessage] = useState(null);
  const [isLoginProcess, setIsLoginProcess] = useState(false)

  const onConnect = (e) => {
    e.preventDefault();
    setIsLoginProcess(true);
    const email = e.target.elements[0].value;
    const password = e.target.elements[1].value;

    setTimeout(() => {
      if (AuthService.login(email, password)) history.push('/profile');
      else setMessage('User is not found');

      setIsLoginProcess(false);
    }, 3000);
  }

  return (
    <div>
      <Nav />

      <main className='container d-flex flex-column align-center'>
        <h1 className='m-0 mb-1'><i className="fas fa-user-shield"></i></h1>
        <p className='m-0 mb-3 uppercase'>Connect to your account</p>

        <form className='shadow p-3 br7' onSubmit={onConnect}>
          <div className='d-flex flex-column mb-2'>
            <label htmlFor='email'>Email</label>
            <input className='mt-1' type='email' name='email' id='email' placeholder='example@gmail.com' required />
          </div>

          <div className='d-flex flex-column mb-2'>
            <label htmlFor='password'>Mot de passe</label>
            <input className='mt-1' type='password' name='password' id='password' placeholder='****' required />
          </div>

          <button className='w-100 btn'>Sign in</button>
        </form>

        {message && <p className='red'><i className='fa fa-info-circle mr-1'></i>{message}</p>}
      </main>

      {isLoginProcess && <Spinner />}
      <Footer />
    </div>
  )
}
import React from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useAuth0 } from '@auth0/auth0-react';

export default function Profile() {

  const { user } = useAuth0();

  const onEdit = (e) => {
    e.preventDefault();
    e.target.reset();
  }

  if (!user) return <></>
  return (
    <div>
      <Nav />

      <main className='container d-flex align-center justify-between'>

        <div className='w-100 d-flex align-center'>
          <div className='mr-3'><img className='br7' src={user.picture} alt={user.given_name} /></div>
          <div>
            <h2 className='m-0 mb-1'><i className="fas fa-user mr-1"></i>{user.name}</h2>
            <p className='m-0 mb-3 uppercase'>Update your personal information</p>
          </div>
        </div>

        <form className='w-100 shadow p-3 br7' onSubmit={onEdit}>
          <div className='d-flex flex-column mb-2'>
            <label htmlFor='name'>Name</label>
            <input className='mt-1' type='text' name='name' id='name' defaultValue={user.name} required />
          </div>

          <div className='d-flex flex-column mb-2'>
            <label htmlFor='nickname'>Username</label>
            <input className='mt-1' type='text' name='nickname' id='nickname' defaultValue={user.nickname} required />
          </div>

          <div className='d-flex flex-column mb-2'>
            <label htmlFor='email'>Email</label>
            <input className='mt-1' type='email' name='email' id='email' defaultValue={user.email} placeholder='example@gmail.com' required />
          </div>

          <div className='d-flex flex-column mb-2'>
            <label htmlFor='password'>Mot de passe</label>
            <input className='mt-1' type='password' name='password' id='password' placeholder='****' required />
          </div>

          <button className='w-100 btn'>update</button>
        </form>
      </main>

      <Footer />
    </div>
  )
}

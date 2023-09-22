import React from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function Profile() {

  const onEdit = (e) => {
    e.preventDefault();
  }

  return (
    <div>
      <Nav />

      <main className='container d-flex align-center justify-between'>

        <div className='w-100'>
          <h1 className='m-0 mb-1'><i className="fas fa-user-shield"></i></h1>
          <p className='m-0 mb-3 uppercase'>Update your personal information</p>
        </div>

        <form className='w-100 shadow p-3 br7' onSubmit={onEdit}>
          <div className='d-flex flex-column mb-2'>
            <label htmlFor='username'>Username</label>
            <input className='mt-1' type='text' name='username' id='username' placeholder='joedoe' required />
          </div>

          <div className='d-flex flex-column mb-2'>
            <label htmlFor='email'>Email</label>
            <input className='mt-1' type='email' name='email' id='email' placeholder='example@gmail.com' required />
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

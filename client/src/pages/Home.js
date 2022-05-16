import React from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

export default function Home() {
  return (
    <>
      <Nav />

      <section className='grid-2 container'>
        <div className='d-flex flex-column justify-center'>
          <h1>La visioconférence haute qualité, maintenant disponible pour tous</h1>
          <p>Nous avons adapté Google Meet, notre service de visioconférence professionnel sécurisé, afin de le rendre disponible pour tous.</p>

          <div>
            <p>Autorisez Meet à utiliser votre caméra et votre micro</p>
            <p>Meet doit pouvoir accéder à votre caméra et à votre micro pour permettre aux autres participants de vous voir et de vous entendre. Vous devrez confirmer ce choix sur chaque navigateur et ordinateur que vous utilisez.</p>
          </div>

          <Link className='btn bg-blue' to="/create-room"><i className='fa fa-phone'></i> Start Call</Link>
        </div>

        <img src="https://i.ibb.co/b3GzJn1/user.png" alt="video" />
      </section>
    </>
  )
}

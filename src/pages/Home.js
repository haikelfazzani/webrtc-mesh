import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h1>La visioconférence haute qualité, maintenant disponible pour tous</h1>
      <p>Nous avons adapté Google Meet, notre service de visioconférence professionnel sécurisé, afin de le rendre disponible pour tous.</p>


      <div>
        <p>Autorisez Meet à utiliser votre caméra et votre micro</p>
        <p>Meet doit pouvoir accéder à votre caméra et à votre micro pour permettre aux autres participants de vous voir et de vous entendre. Vous devrez confirmer ce choix sur chaque navigateur et ordinateur que vous utilisez.</p>
      </div>

      <Link className='btn' to={{ pathname: '/room', search: 'roomID=' + window.cryptoUid(12) + '&initiator=' + true }}>Create room</Link>
    </div>
  )
}

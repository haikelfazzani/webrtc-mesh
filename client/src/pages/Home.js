import React, { useEffect } from 'react';
import Nav from '../components/Nav';

export default function Home(props) {

  const roomID = window.cryptoUid(12);

  const onCreateRoom = () => {
    props.history.push('/rv/' + roomID)
  }

  const onCreateAudioRoom = () => {
    props.history.push('/ra/' + roomID)
  }

  useEffect(() => {

    const app = document.getElementById('app');

    if (!app) return;

    const typewriter = new window.Typewriter(app, { loop: true, delay: 75, });

    typewriter
      .typeString('Meet from anywhere.')
      .pauseFor(2000)
      .deleteChars(14)
      .typeString('for everyone.')
      .pauseFor(2000)
      .deleteAll()
      .typeString('Enjoy Time 🥳')
      .pauseFor(5000)
      .start();

    return () => {}
  }, [])


  return (<>
    <Nav />

    <section className='container'>

      <div className='d-flex flex-column align-center justify-center'>
        <h1 className='uppercase bleu' id='app'>Meet from anywhere.</h1>
        <h3 className='m-0 uppercase'>Free and simple video group for everyone</h3>

        <div className='d-flex mt-3'>
          <button className='btn mr-1' onClick={onCreateRoom}><i className='fa fa-video mr-1'></i>start Video room</button>
          <button className='btn ml-1' onClick={onCreateAudioRoom}><i className='fa fa-headphones mr-1'></i>start audio room</button>
        </div>
      </div>

    </section>

    <footer className='w-100 container text-center uppercase'>Created with <i className='fa fa-heart'></i> by Haikel Fazzani</footer>
  </>)
}

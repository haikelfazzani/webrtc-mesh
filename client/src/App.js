import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";

import Home from './pages/Home';

import CreateRoom from './pages/rooms/CreateRoom';
import JoinRoom from './pages/rooms/JoinRoom';

import AudioRoom from './pages/rooms/AudioRoom';
import VideoRoom from './pages/rooms/VideoRoom';

export default function App() {
  return (<>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/create-room" component={CreateRoom} />
        <Route path="/join-room" component={JoinRoom} />
        <Route path="/room" component={VideoRoom} />
        <Route path="/audio-room" component={AudioRoom} />
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  </>);
}
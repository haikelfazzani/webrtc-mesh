import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";

import Home from './pages/Home';
import AudioRoom from './pages/rooms/AudioRoom';
import VideoRoom from './pages/rooms/VideoRoom';

export default function App() {
  return (<>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />

        <Route path="/rv/:roomID" component={VideoRoom} />
        <Route path="/ra/:roomID" component={AudioRoom} />

        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  </>);
}
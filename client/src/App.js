import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";

import Home from './pages/Home';
import AudioRoom from './pages/rooms/AudioRoom';
import VideoRoom from './pages/rooms/VideoRoom';
import About from './pages/About';
import PrivateRoute from './components/PrivateRoute';
import Profile from './pages/Profile';

export default function App() {
  return (<>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/about" component={About} />
        <PrivateRoute exact path="/profile" component={Profile} />

        <Route path="/rv/:roomID" component={VideoRoom} />
        <Route path="/ra/:roomID" component={AudioRoom} />

        {/* <Redirect from="*" to="/" /> */}
      </Switch>
    </Router>
  </>);
}
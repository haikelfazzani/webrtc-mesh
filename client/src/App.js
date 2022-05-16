import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";

import Home from './pages/Home';
import Room from './pages/Room';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';

export default function App() {

  return (<>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/create-room" component={CreateRoom} />
        <Route path="/join-room" component={JoinRoom} />
        <Route path="/room" component={Room} />
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  </>);
}
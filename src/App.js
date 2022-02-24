import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch, Link } from "react-router-dom";

import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {

  return (<>
    <Router>

      <ul>
        <Link to="/">home</Link>
      </ul>

      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/room/:roomID/:muted/:videodisbaled" component={Room} />
        <Redirect from="*" to="/" />
      </Switch>

    </Router>
  </>);
}
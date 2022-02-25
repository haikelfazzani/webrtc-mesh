import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";

import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {

  return (<>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/room" component={Room} />
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  </>);
}
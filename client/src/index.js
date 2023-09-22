import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';

import './styles/Room.css';
import './styles/index.css';
import './styles/grid.css';

ReactDOM.render(
  <Auth0Provider
    domain="au-server.us.auth0.com"
    clientId="hzmbjo1PAdyLxoQGwni4Hm1DFCqzqrAc"
    authorizationParams={{
      redirect_uri: "http://localhost:3000/profile",
    }}
  >
    <App />
  </Auth0Provider>,
  document.getElementById('root')
);


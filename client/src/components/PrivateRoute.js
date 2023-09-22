import React from 'react'
import { Redirect, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export default function PrivateRoute({ children, ...rest }) {

  const { isLoading, isAuthenticated, error, user } = useAuth0();
  // const [isAuthenticated, setIsAuthenticated] = useState(false)

  console.log(isAuthenticated, user);

  return (
    <Route
      {...rest}
      render={() => {
        return isAuthenticated === true ? (
          children
        ) : (
          <Redirect to="/login" />
        );
      }}
    />
  );
}
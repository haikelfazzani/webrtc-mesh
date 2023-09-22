import React, { useEffect, useState } from 'react'
import { Redirect, Route } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function PrivateRoute({ children, ...rest }) {

  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());

    return () => {

    }
  }, [])

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
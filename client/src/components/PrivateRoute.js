import React, { useEffect, useState } from 'react'
import { Redirect, Route } from 'react-router-dom';

export default function PrivateRoute({ children, ...rest }) {

  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const local = localStorage.getItem('isAuthenticated');
    if (local) setIsAuthenticated(JSON.parse(local));

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
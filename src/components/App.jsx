import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import ResourceSearch from '../pages/ResourceSearch.jsx';
import AddResource from '../pages/AddResource.jsx';

// Task 10: Error boundary for robust React implementation
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  // Task 10: Check login status on mount to persist user session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // console.log('Checking login status');
        const response = await fetch('http://localhost:3000/api/users/user', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to check login status');
        }
        const data = await response.json();
        if (data.loggedIn) {
          // console.log('User logged in:', data.username);
          setUser({ username: data.username });
        } else {
          // console.log('No user logged in');
          setUser(null);
        }
      } catch (err) {
        console.error('Check login error:', err.message);
        setError('Failed to check login status. Please try again.');
      }
    };
    checkSession();
  }, []);

  // Task 10: Handle login with AJAX POST request
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // console.log('Attempting login:', loginData.username);
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      const data = await response.json();
      setUser({ username: data.username });
      setError(null);
      setLoginData({ username: '', password: '' });
      // console.log('Login successful:', data.username);
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err.message);
    }
  };

  // Task 10: Handle logout with AJAX POST request
  const handleLogout = async () => {
    try {
      // console.log('Attempting logout');
      const response = await fetch('http://localhost:3000/api/users/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      setUser(null);
      setError(null);
      // console.log('Logout successful');
    } catch (err) {
      setError(err.message);
      console.error('Logout error:', err.message);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Part G: Robust React component with error boundary
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div style={{ padding: '20px' }}>
          <nav style={{ marginBottom: '20px' }}>
            <Link to="/" style={{ marginRight: '10px' }}>Search Resources</Link>
            <Link to="/add">Add Resource</Link>
          </nav>
          <div style={{ marginBottom: '20px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p>Logged in as {user.username}</p>
                <button onClick={handleLogout} style={{ padding: '5px 10px' }}>
                  Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={handleLoginChange}
                  placeholder="Username"
                  style={{ padding: '5px' }}
                  id="username"
                  autocomplete="username"
                />
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Password"
                  style={{ padding: '5px' }}
                  id="password"
                  autocomplete="current-password"
                />
                <button type="submit" style={{ padding: '5px 10px' }}>
                  Login
                </button>
              </form>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
          <Routes>
            <Route path="/" element={<ResourceSearch user={user} />} />
            <Route path="/add" element={<AddResource user={user} />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
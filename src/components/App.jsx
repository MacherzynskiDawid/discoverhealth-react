import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ResourceSearch from '../pages/ResourceSearch.jsx';
import AddResource from '../pages/AddResource.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check login status on mount
    fetch('http://localhost:3000/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUser({ username: data.username });
        }
      })
      .catch(err => console.error('Check login error:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      const data = await response.json();
      setUser({ username: data.username });
      setError(null);
      setLoginData({ username: '', password: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  return (
    <BrowserRouter>
      <div>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Search Resources</Link>
          <Link to="/add">Add Resource</Link>
        </nav>
        <div>
          {user ? (
            <div>
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
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Password"
                style={{ padding: '5px' }}
              />
              <button type="submit" style={{ padding: '5px 10px' }}>
                Login
              </button>
            </form>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
        <Routes>
          <Route path="/" element={<ResourceSearch />} />
          <Route path="/add" element={<AddResource user={user} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
import UserDAO from '../daos/userDAO.mjs';

class UserController {
  constructor() {
    this.userDAO = new UserDAO('./database/discoverhealth.db');
  }

  async login(req, res) {
    const { username, password } = req.body;
    const validUsernamePattern = /^[0-9A-Za-z_]+$/;
    if (!username || !validUsernamePattern.test(username)) {
      return res.status(400).json({ error: 'Invalid or missing username' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    try {
      const user = await this.userDAO.getUser(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      req.session.user = { id: user.id, username: user.username };
      res.json({ message: 'Login successful', username: user.username });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  }

  signup(req, res) {
    const { username, password } = req.body;
    const validUsernamePattern = /^[0-9A-Za-z_]+$/;
    if (!username || !validUsernamePattern.test(username)) {
      return res.status(400).json({ error: 'Invalid or missing username' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    try {
      const userId = this.userDAO.createUser(username, password);
      res.status(201).json({ message: 'User created successfully', id: userId });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(400).json({ error: err.message });
    }
  }

  getUserStatus(req, res) {
    if (req.session.user) {
      res.json({ loggedIn: true, username: req.session.user.username });
    } else {
      res.json({ loggedIn: false });
    }
  }
}

export default new UserController();
import express from 'express';
import userController from '../controllers/userController.mjs';

const router = express.Router();

// POST /api/users/login
router.post('/login', (req, res) => userController.login(req, res));

// POST /api/users/logout
router.post('/logout', (req, res) => userController.logout(req, res));

// POST /api/users/signup
router.post('/signup', (req, res) => userController.signup(req, res));

// GET /api/users/user
router.get('/user', (req, res) => userController.getUserStatus(req, res));

export default router;
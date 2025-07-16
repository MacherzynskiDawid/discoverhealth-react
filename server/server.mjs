import express from 'express';
import cors from 'cors';
import ViteExpress from 'vite-express';
import { requestLogger, sessionMiddleware } from './middleware/middleware.mjs';
import resourcesRouter from './routes/resources.mjs';
import userController from './controllers/userController.mjs';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: `http://localhost:${PORT}`, credentials: true }));
app.use(requestLogger);
app.use(sessionMiddleware);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express server is running' });
});

// User routes
app.post('/api/users/login', (req, res) => userController.login(req, res));
app.post('/api/users/logout', (req, res) => userController.logout(req, res));
app.post('/api/users/signup', (req, res) => userController.signup(req, res));
app.get('/api/users/user', (req, res) => userController.getUserStatus(req, res));

// Resources routes
app.use('/api', resourcesRouter);

ViteExpress.listen(app, PORT, () =>
  console.log(`Server is listening on http://localhost:${PORT}`)
);
import express from 'express';
import ViteExpress from 'vite-express';
import cors from 'cors';
import resourcesRouter from './routes/resources.mjs';

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api', resourcesRouter);

ViteExpress.listen(app, 3000, () => console.log('Server running on http://localhost:3000'));
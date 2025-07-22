// Task 1: Simple test server to verify basic GET endpoint functionality
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
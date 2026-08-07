import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import studySetRoutes from './routes/studySets.js';
import progressRoutes from './routes/progress.js';
import topicRoutes from './routes/topics.js';

dotenv.config();

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'US-UK English Quizlet Server is running smooth!' });
});

// API Routes
app.use('/api/study-sets', studySetRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/topics', topicRoutes);

// Connect to MongoDB & Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 US-UK Quizlet Server running on http://localhost:${PORT}`);
  });
});

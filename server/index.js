import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import studySetRoutes from './routes/studySets.js';
import progressRoutes from './routes/progress.js';
import topicRoutes from './routes/topics.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();

// Enable CORS, cookie parsing, and JSON body parsing
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'US-UK English Quizlet Server is running smooth!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
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

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import StudySet from './models/StudySet.js';
import Topic from './models/Topic.js';
import { realStudySets } from './data/realStudySets.js';
import { realTopics } from './data/realTopics.js';

// Set public Google DNS for Node.js DNS resolver on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/usuk_quizlet_db';
    console.log('🍃 Connecting to MongoDB for Seeding...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');
    
    // Clear existing collections
    await StudySet.deleteMany({});
    console.log('🧹 Cleared existing StudySets.');

    await Topic.deleteMany({});
    console.log('🧹 Cleared existing Topics.');

    // Insert real datasets
    const insertedSets = await StudySet.insertMany(realStudySets);
    console.log(`✅ Seeded ${insertedSets.length} real StudySets successfully!`);

    const insertedTopics = await Topic.insertMany(realTopics);
    console.log(`✅ Seeded ${insertedTopics.length} real Topics successfully!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedDB();

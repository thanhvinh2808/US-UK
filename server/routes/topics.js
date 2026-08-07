import express from 'express';
import Topic from '../models/Topic.js';

const router = express.Router();

// GET all topics
router.get('/', async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single topic by slugId or Mongo _id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let topic = await Topic.findOne({ slugId: id });
    if (!topic && id.match(/^[0-9a-fA-F]{24}$/)) {
      topic = await Topic.findById(id);
    }
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create topic
router.post('/', async (req, res) => {
  try {
    const newTopic = new Topic(req.body);
    const saved = await newTopic.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

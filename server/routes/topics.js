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

// PUT update topic (theo slugId hoặc Mongo _id)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slugId: id };
    const updated = await Topic.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Topic not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE topic (theo slugId hoặc Mongo _id)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slugId: id };
    const deleted = await Topic.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'Topic not found' });
    res.json({ message: 'Topic deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

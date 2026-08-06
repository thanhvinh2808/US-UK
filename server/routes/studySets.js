import express from 'express';
import StudySet from '../models/StudySet.js';

const router = express.Router();

// GET all public study sets
router.get('/', async (req, res) => {
  try {
    const sets = await StudySet.find({ isPublic: true }).sort({ createdAt: -1 });
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single study set by ID
router.get('/:id', async (req, res) => {
  try {
    const set = await StudySet.findById(req.params.id);
    if (!set) return res.status(404).json({ message: 'Study set not found' });
    res.json(set);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new study set
router.post('/', async (req, res) => {
  try {
    const newSet = new StudySet(req.body);
    const saved = await newSet.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update study set
router.put('/:id', async (req, res) => {
  try {
    const updated = await StudySet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE study set
router.delete('/:id', async (req, res) => {
  try {
    await StudySet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Study set deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

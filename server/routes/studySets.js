import express from 'express';
import { studySetController } from '../controllers/studySetController.js';

const router = express.Router();

// GET all study sets
router.get('/', studySetController.getStudySets);

// GET single study set by ID
router.get('/:id', studySetController.getStudySetById);

// POST create new study set
router.post('/', studySetController.createStudySet);

// PUT update existing study set
router.put('/:id', studySetController.updateStudySet);

// DELETE study set by ID
router.delete('/:id', studySetController.deleteStudySet);

export default router;

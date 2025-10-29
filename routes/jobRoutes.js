const { createJob, getJobs, editJob, deleteJob } = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();

router.get('/', authMiddleware, getJobs);
router.post('/', authMiddleware, createJob);
router.delete('/:id', authMiddleware, deleteJob);
router.put('/:id', authMiddleware, editJob);

module.exports = router;

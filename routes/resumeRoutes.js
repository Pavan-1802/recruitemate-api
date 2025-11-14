const { fetchResumes, updateResumeStatus } = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();

router.get('/', authMiddleware, fetchResumes);
router.patch('/status/:candidateId', updateResumeStatus);

module.exports = router;
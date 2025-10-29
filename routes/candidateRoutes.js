const { processResumes, updateStatus, fetchCandidates, deleteCandidate } = require('../controllers/candidateController');
const upload = require('../middleware/upload');
const express = require('express');
const router = express.Router();

router.post('/upload-resumes/:jobId', upload.array('files'), processResumes);
router.patch('/status/:candidateId', updateStatus);
router.get('/:jobId', fetchCandidates);
router.delete('/:candidateId', deleteCandidate);

module.exports = router;
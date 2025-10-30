const { generateText } = require('../controllers/aiController');
const express = require('express');
const router = express.Router();

router.post('/generate-text', generateText);

module.exports = router;
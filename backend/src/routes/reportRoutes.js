const express = require('express');
const { generateReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', generateReport);

module.exports = router;

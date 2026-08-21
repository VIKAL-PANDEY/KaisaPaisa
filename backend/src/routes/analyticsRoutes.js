const express = require('express');
const { getDashboardOverview, getTrends, getCalendarData } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardOverview);
router.get('/trends', getTrends);
router.get('/calendar', getCalendarData);

module.exports = router;

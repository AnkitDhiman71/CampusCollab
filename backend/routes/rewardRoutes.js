const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  sendReward,
  getTeamRewards,
  getMyRewards,
} = require('../controllers/rewardController');

// All reward endpoints require student authentication
router.use(protect);

router.post('/send', sendReward);
router.get('/team/:teamId', getTeamRewards);
router.get('/my', getMyRewards);

module.exports = router;

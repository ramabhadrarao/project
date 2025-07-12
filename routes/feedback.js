const express = require('express');
const {
  createFeedback,
  getFeedback,
  getDoctorFeedbackStats
} = require('../controllers/feedbackController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, authorize('patient'), createFeedback);
router.get('/', auth, getFeedback);
router.get('/doctor/:doctorId/stats', auth, getDoctorFeedbackStats);

module.exports = router;
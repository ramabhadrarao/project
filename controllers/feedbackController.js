const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const mlService = require('../services/mlService');

const createFeedback = async (req, res) => {
  try {
    const { appointmentId, rating, comment, categories, isAnonymous } = req.body;
    const patientId = req.user.id;

    // Verify appointment exists and belongs to the patient
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId,
      status: 'completed'
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Completed appointment not found'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ appointmentId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this appointment'
      });
    }

    // Analyze sentiment
    const sentimentAnalysis = await mlService.analyzeSentiment(comment);

    // Create feedback
    const feedback = await Feedback.create({
      patientId,
      doctorId: appointment.doctorId,
      appointmentId,
      rating,
      comment,
      sentiment: sentimentAnalysis.sentiment,
      sentimentScore: sentimentAnalysis.score,
      categories: categories || {},
      isAnonymous: isAnonymous || false
    });

    await feedback.populate('patientId', 'fullName');
    await feedback.populate('doctorId', 'fullName specialization');
    await feedback.populate('appointmentId', 'date time');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    const { doctorId, sentiment, rating } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let filter = {};

    // Role-based filtering
    if (userRole === 'patient') {
      filter.patientId = userId;
    } else if (userRole === 'doctor') {
      filter.doctorId = userId;
    }

    // Additional filters
    if (doctorId && userRole === 'admin') filter.doctorId = doctorId;
    if (sentiment) filter.sentiment = sentiment;
    if (rating) filter.rating = parseInt(rating);

    const feedbacks = await Feedback.find(filter)
      .populate('patientId', 'fullName')
      .populate('doctorId', 'fullName specialization department')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

const getDoctorFeedbackStats = async (req, res) => {
  try {
    const doctorId = req.params.doctorId || req.user.id;

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get feedback statistics
    const stats = await Feedback.aggregate([
      { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          sentimentBreakdown: {
            $push: '$sentiment'
          },
          ratingBreakdown: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Get sentiment distribution
    const sentimentStats = await Feedback.aggregate([
      { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get rating distribution
    const ratingStats = await Feedback.aggregate([
      { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent feedback
    const recentFeedback = await Feedback.find({ doctorId })
      .populate('patientId', 'fullName')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      doctorId,
      stats: stats[0] || {
        totalFeedbacks: 0,
        averageRating: 0,
        sentimentBreakdown: [],
        ratingBreakdown: []
      },
      sentimentDistribution: sentimentStats,
      ratingDistribution: ratingStats,
      recentFeedback
    });
  } catch (error) {
    console.error('Get doctor feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
};

module.exports = {
  createFeedback,
  getFeedback,
  getDoctorFeedbackStats
};
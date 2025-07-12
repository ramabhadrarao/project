const express = require('express');
const mlService = require('../services/mlService');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Analyze sentiment
router.post('/sentiment', auth, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const result = await mlService.analyzeSentiment(comment);

    res.json({
      success: true,
      sentiment: result.sentiment,
      score: result.score
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
      error: error.message
    });
  }
});

// Predict no-show risk
router.post('/noshow-predict', auth, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const prediction = await mlService.predictNoShow(appointment);

    res.json({
      success: true,
      appointmentId,
      prediction
    });
  } catch (error) {
    console.error('No-show prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict no-show risk',
      error: error.message
    });
  }
});

// Recommend doctors
router.post('/recommend-doctor', auth, async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required'
      });
    }

    const recommendations = await mlService.recommendDoctor(symptoms);

    res.json({
      success: true,
      symptoms,
      recommendations: recommendations.map(rec => ({
        doctor: {
          id: rec.doctor._id,
          fullName: rec.doctor.fullName,
          specialization: rec.doctor.specialization,
          department: rec.doctor.department,
          experience: rec.doctor.experience
        },
        similarity: rec.similarity,
        matchPercentage: Math.round(rec.similarity * 100)
      }))
    });
  } catch (error) {
    console.error('Doctor recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recommend doctors',
      error: error.message
    });
  }
});

// Train no-show model (admin only)
router.post('/train-noshow', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    await mlService.trainNoShowModel();

    res.json({
      success: true,
      message: 'No-show model training completed'
    });
  } catch (error) {
    console.error('Model training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to train model',
      error: error.message
    });
  }
});

module.exports = router;
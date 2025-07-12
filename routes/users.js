const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    const { specialization, department } = req.query;
    
    let filter = { role: 'doctor', isActive: true };
    if (specialization) filter.specialization = specialization;
    if (department) filter.department = department;

    const doctors = await User.find(filter)
      .select('-password')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message
    });
  }
});

// Get doctor by ID
router.get('/doctors/:id', auth, async (req, res) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.id,
      role: 'doctor',
      isActive: true
    }).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: error.message
    });
  }
});

// Get specializations
router.get('/specializations', auth, async (req, res) => {
  try {
    const specializations = await User.distinct('specialization', {
      role: 'doctor',
      isActive: true
    });

    res.json({
      success: true,
      specializations: specializations.filter(spec => spec)
    });
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specializations',
      error: error.message
    });
  }
});

// Search patients (for doctors)
router.get('/patients/search', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const patients = await User.find({
      role: 'patient',
      isActive: true,
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { username: searchRegex }
      ]
    }).select('-password').limit(20);

    res.json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search patients',
      error: error.message
    });
  }
});

// Get patient details with appointment history (for doctors)
router.get('/patients/:id', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const patient = await User.findOne({
      _id: req.params.id,
      role: 'patient',
      isActive: true
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get appointment history for this patient
    const appointments = await Appointment.find({
      patientId: req.params.id
    })
    .populate('doctorId', 'fullName specialization')
    .sort({ date: -1 })
    .limit(10);

    res.json({
      success: true,
      patient: {
        ...patient.toObject(),
        appointmentHistory: appointments
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient details',
      error: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const AppointmentHistory = require('../models/AppointmentHistory');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalFeedbacks,
      averageRating
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'scheduled' }),
      Feedback.countDocuments(),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }])
    ]);

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .populate('patientId', 'fullName email')
      .populate('doctorId', 'fullName specialization')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get sentiment distribution
    const sentimentStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly appointment trends
    const monthlyStats = await Appointment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        totalFeedbacks,
        averageRating: averageRating[0]?.avg || 0
      },
      recentAppointments,
      sentimentDistribution: sentimentStats,
      monthlyTrends: monthlyStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// User management
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (role) filter.role = role;
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Update user status
router.patch('/users/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Get all appointments (admin view)
router.get('/appointments', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (date) filter.date = new Date(date);

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName specialization department')
      .sort({ date: -1, time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get admin appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Feedback analytics
router.get('/feedback/analytics', auth, authorize('admin'), async (req, res) => {
  try {
    // Overall feedback statistics
    const overallStats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          sentimentBreakdown: {
            $push: '$sentiment'
          }
        }
      }
    ]);

    // Doctor-wise feedback stats
    const doctorStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$doctorId',
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
          positiveCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] }
          },
          negativeCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorName: '$doctor.fullName',
          specialization: '$doctor.specialization',
          averageRating: 1,
          totalFeedbacks: 1,
          positiveCount: 1,
          negativeCount: 1,
          satisfactionRate: {
            $multiply: [
              { $divide: ['$positiveCount', '$totalFeedbacks'] },
              100
            ]
          }
        }
      },
      { $sort: { averageRating: -1 } }
    ]);

    // Monthly feedback trends
    const monthlyTrends = await Feedback.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      overallStats: overallStats[0] || {
        totalFeedbacks: 0,
        averageRating: 0,
        sentimentBreakdown: []
      },
      doctorStats,
      monthlyTrends
    });
  } catch (error) {
    console.error('Feedback analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback analytics',
      error: error.message
    });
  }
});

// Export appointments to CSV
router.get('/export/appointments', auth, authorize('admin'), async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName specialization department')
      .sort({ date: -1 });

    // Convert to CSV format
    const csvData = appointments.map(apt => ({
      'Patient Name': apt.patientId?.fullName || 'N/A',
      'Patient Email': apt.patientId?.email || 'N/A',
      'Patient Phone': apt.patientId?.phone || 'N/A',
      'Doctor Name': apt.doctorId?.fullName || 'N/A',
      'Specialization': apt.doctorId?.specialization || 'N/A',
      'Department': apt.doctorId?.department || 'N/A',
      'Date': apt.date.toISOString().split('T')[0],
      'Time': apt.time,
      'Status': apt.status,
      'Type': apt.appointmentType,
      'Symptoms': apt.symptoms,
      'Notes': apt.notes || '',
      'Created At': apt.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: csvData,
      filename: `appointments_${new Date().toISOString().split('T')[0]}.csv`
    });
  } catch (error) {
    console.error('Export appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export appointments',
      error: error.message
    });
  }
});

// Export feedback to CSV
router.get('/export/feedback', auth, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .populate('patientId', 'fullName email')
      .populate('doctorId', 'fullName specialization department')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvData = feedback.map(fb => ({
      'Patient Name': fb.isAnonymous ? 'Anonymous' : (fb.patientId?.fullName || 'N/A'),
      'Patient Email': fb.isAnonymous ? 'Anonymous' : (fb.patientId?.email || 'N/A'),
      'Doctor Name': fb.doctorId?.fullName || 'N/A',
      'Specialization': fb.doctorId?.specialization || 'N/A',
      'Department': fb.doctorId?.department || 'N/A',
      'Appointment Date': fb.appointmentId?.date?.toISOString().split('T')[0] || 'N/A',
      'Appointment Time': fb.appointmentId?.time || 'N/A',
      'Rating': fb.rating,
      'Comment': fb.comment,
      'Sentiment': fb.sentiment,
      'Sentiment Score': fb.sentimentScore || 0,
      'Communication Rating': fb.categories?.communication || 'N/A',
      'Expertise Rating': fb.categories?.expertise || 'N/A',
      'Timeliness Rating': fb.categories?.timeliness || 'N/A',
      'Facilities Rating': fb.categories?.facilities || 'N/A',
      'Is Anonymous': fb.isAnonymous ? 'Yes' : 'No',
      'Submitted At': fb.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: csvData,
      filename: `feedback_${new Date().toISOString().split('T')[0]}.csv`
    });
  } catch (error) {
    console.error('Export feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export feedback',
      error: error.message
    });
  }
});

module.exports = router;
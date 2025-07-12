const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AppointmentHistory = require('../models/AppointmentHistory');

const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, symptoms, appointmentType, priority } = req.body;
    const patientId = req.user.id;

    // Validate doctor exists and is active
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    // Check for existing appointment at same time
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['scheduled', 'completed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: new Date(date),
      time,
      symptoms,
      appointmentType: appointmentType || 'consultation',
      priority: priority || 'medium'
    });

    // Populate the appointment with user details
    await appointment.populate('patientId', 'fullName email phone');
    await appointment.populate('doctorId', 'fullName specialization department');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

const getAppointments = async (req, res) => {
  try {
    const { status, date, doctorId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    // Role-based filtering
    if (userRole === 'patient') {
      filter.patientId = userId;
    } else if (userRole === 'doctor') {
      filter.doctorId = userId;
    }

    // Additional filters
    if (status) filter.status = status;
    if (date) filter.date = new Date(date);
    if (doctorId && userRole === 'admin') filter.doctorId = doctorId;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'fullName email phone gender age')
      .populate('doctorId', 'fullName specialization department')
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'fullName email phone gender dateOfBirth')
      .populate('doctorId', 'fullName specialization department experience');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && 
        appointment.patientId._id.toString() !== userId && 
        appointment.doctorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message
    });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { status, notes, diagnosis, prescription, followUpRequired, followUpDate } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Authorization check
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && 
        userRole === 'patient' && appointment.patientId.toString() !== userId ||
        userRole === 'doctor' && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update appointment
    const updateData = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (prescription) updateData.prescription = prescription;
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (followUpDate) updateData.followUpDate = new Date(followUpDate);

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'fullName email phone')
     .populate('doctorId', 'fullName specialization department');

    // Create appointment history record if status changed to completed or no-show
    if (status && (status === 'completed' || status === 'no-show')) {
      const patient = await User.findById(appointment.patientId);
      const appointmentDate = new Date(appointment.date);
      const createdDate = new Date(appointment.createdAt);
      
      // Count previous no-shows
      const previousNoShows = await AppointmentHistory.countDocuments({
        patientId: appointment.patientId,
        showedUp: false
      });

      await AppointmentHistory.create({
        patientId: appointment.patientId,
        appointmentId: appointment._id,
        showedUp: status === 'completed',
        age: patient.age || 0,
        gender: patient.gender,
        dayOfWeek: appointmentDate.getDay(),
        hourOfDay: parseInt(appointment.time.split(':')[0]),
        daysInAdvance: Math.floor((appointmentDate - createdDate) / (1000 * 60 * 60 * 24)),
        previousNoShows,
        appointmentType: appointment.appointmentType
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Authorization check
    if (userRole === 'patient' && appointment.patientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (userRole === 'doctor' && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get booked appointments for the date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: new Date(date),
      status: { $in: ['scheduled', 'completed'] }
    }).select('time');

    const bookedTimes = bookedAppointments.map(apt => apt.time);

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const timeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!bookedTimes.includes(timeString)) {
          timeSlots.push(timeString);
        }
      }
    }

    res.json({
      success: true,
      doctorId,
      date,
      availableSlots: timeSlots,
      bookedSlots: bookedTimes
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability',
      error: error.message
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability
};
const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateMedicalRecord,
  cancelAppointment,
  getDoctorAvailability
} = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Basic appointment routes
router.post('/', auth, createAppointment);
router.get('/', auth, getAppointments);
router.get('/availability', auth, getDoctorAvailability);
router.get('/:id', auth, getAppointmentById);
router.put('/:id', auth, updateAppointment);
router.delete('/:id', auth, cancelAppointment);

// Medical record specific route for doctors
router.put('/:id/medical-record', auth, authorize('doctor', 'admin'), updateMedicalRecord);

module.exports = router;
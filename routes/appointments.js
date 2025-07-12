const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability
} = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, createAppointment);
router.get('/', auth, getAppointments);
router.get('/availability', auth, getDoctorAvailability);
router.get('/:id', auth, getAppointmentById);
router.put('/:id', auth, updateAppointment);
router.delete('/:id', auth, cancelAppointment);

module.exports = router;
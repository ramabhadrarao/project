const mongoose = require('mongoose');

const appointmentHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  showedUp: {
    type: Boolean,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'Other'],
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  hourOfDay: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  daysInAdvance: {
    type: Number,
    required: true,
    min: 0
  },
  previousNoShows: {
    type: Number,
    default: 0
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine'],
    required: true
  },
  seasonalFactor: {
    type: Number,
    default: 1
  },
  weatherCondition: {
    type: String,
    enum: ['sunny', 'rainy', 'cloudy', 'stormy'],
    default: 'sunny'
  },
  distanceFromHospital: {
    type: Number,
    default: 0
  },
  transportation: {
    type: String,
    enum: ['car', 'public', 'walking', 'taxi'],
    default: 'car'
  }
}, {
  timestamps: true
});

// Indexes for ML queries
appointmentHistorySchema.index({ patientId: 1 });
appointmentHistorySchema.index({ showedUp: 1 });
appointmentHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('AppointmentHistory', appointmentHistorySchema);
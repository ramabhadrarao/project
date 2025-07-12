const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  symptoms: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  prescription: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine'],
    default: 'consultation'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  cost: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  reminders: {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date }
  }
}, {
  timestamps: true
});

// Indexes for better performance
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, time: 1 });

// Compound index for preventing double booking
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });

// Virtual for formatted date and time
appointmentSchema.virtual('formattedDateTime').get(function() {
  return `${this.date.toDateString()} at ${this.time}`;
});

// Pre-save middleware for validation
appointmentSchema.pre('save', function(next) {
  // Ensure appointment is not in the past
  const appointmentDateTime = new Date(this.date);
  appointmentDateTime.setHours(parseInt(this.time.split(':')[0]));
  appointmentDateTime.setMinutes(parseInt(this.time.split(':')[1]));
  
  if (appointmentDateTime < new Date() && this.isNew) {
    return next(new Error('Cannot schedule appointment in the past'));
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
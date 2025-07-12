const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    required: true
  },
  sentimentScore: {
    type: Number,
    min: -1,
    max: 1
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    expertise: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    facilities: { type: Number, min: 1, max: 5 }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
feedbackSchema.index({ doctorId: 1, sentiment: 1 });
feedbackSchema.index({ appointmentId: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ createdAt: -1 });

// Virtual for overall satisfaction
feedbackSchema.virtual('overallSatisfaction').get(function() {
  const categories = this.categories;
  if (!categories) return this.rating;
  
  const scores = [
    categories.communication,
    categories.expertise,
    categories.timeliness,
    categories.facilities
  ].filter(score => score !== undefined);
  
  if (scores.length === 0) return this.rating;
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
});

module.exports = mongoose.model('Feedback', feedbackSchema);
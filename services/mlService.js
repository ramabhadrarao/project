const natural = require('natural');
const { Matrix } = require('ml-matrix');
const AppointmentHistory = require('../models/AppointmentHistory');
const User = require('../models/User');

class MLService {
  constructor() {
    // Initialize sentiment analyzer
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
    
    // Simple neural network weights for no-show prediction
    this.noShowWeights = {
      age: 0.1,
      gender: 0.2,
      dayOfWeek: 0.15,
      hourOfDay: 0.25,
      daysInAdvance: 0.3,
      previousNoShows: 0.4,
      appointmentType: 0.1
    };
    
    // TF-IDF for doctor recommendation
    this.tfidf = new natural.TfIdf();
    this.doctorSymptomMappings = new Map();
    
    this.initializeDoctorMappings();
  }

  // Sentiment Analysis
  async analyzeSentiment(text) {
    try {
      if (!text || typeof text !== 'string') {
        return { sentiment: 'neutral', score: 0 };
      }

      const tokens = this.tokenizer.tokenize(text.toLowerCase());
      const score = this.sentimentAnalyzer.getSentiment(tokens);
      
      let sentiment;
      if (score > 0.1) {
        sentiment = 'positive';
      } else if (score < -0.1) {
        sentiment = 'negative';
      } else {
        sentiment = 'neutral';
      }

      return {
        sentiment,
        score: Math.max(-1, Math.min(1, score)) // Clamp between -1 and 1
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { sentiment: 'neutral', score: 0 };
    }
  }

  // Simple Neural Network Implementation for No-Show Prediction
  simpleNeuralNetwork(inputs) {
    // Sigmoid activation function
    const sigmoid = (x) => 1 / (1 + Math.exp(-x));
    
    // Calculate weighted sum
    let weightedSum = 0;
    for (const [key, value] of Object.entries(inputs)) {
      if (this.noShowWeights[key]) {
        weightedSum += value * this.noShowWeights[key];
      }
    }
    
    // Apply sigmoid activation
    return sigmoid(weightedSum);
  }

  // No-Show Prediction
  async trainNoShowModel() {
    try {
      const trainingData = await AppointmentHistory.find({}).lean();
      
      if (trainingData.length < 10) {
        console.log('Insufficient data for training. Using default model.');
        return;
      }

      // Simple weight adjustment based on correlation
      const features = ['age', 'gender', 'dayOfWeek', 'hourOfDay', 'daysInAdvance', 'previousNoShows', 'appointmentType'];
      const correlations = {};

      features.forEach(feature => {
        let totalCorrelation = 0;
        let count = 0;

        trainingData.forEach(record => {
          const normalizedValue = this.normalizeFeature(feature, record[feature]);
          const target = record.showedUp ? 1 : 0;
          
          // Simple correlation calculation
          totalCorrelation += normalizedValue * target;
          count++;
        });

        correlations[feature] = count > 0 ? totalCorrelation / count : 0;
      });

      // Update weights based on correlations
      Object.keys(correlations).forEach(feature => {
        if (this.noShowWeights[feature]) {
          this.noShowWeights[feature] = Math.abs(correlations[feature]);
        }
      });

      console.log('No-show prediction model trained successfully');
    } catch (error) {
      console.error('Training error:', error);
    }
  }

  normalizeFeature(feature, value) {
    switch (feature) {
      case 'age':
        return this.normalizeAge(value);
      case 'gender':
        return value === 'M' ? 1 : 0;
      case 'dayOfWeek':
        return value / 6;
      case 'hourOfDay':
        return value / 23;
      case 'daysInAdvance':
        return Math.min(value / 30, 1);
      case 'previousNoShows':
        return Math.min(value / 10, 1);
      case 'appointmentType':
        return this.encodeAppointmentType(value);
      default:
        return value;
    }
  }

  async predictNoShow(appointmentData) {
    try {
      // Get patient's previous no-shows
      const previousNoShows = await AppointmentHistory.countDocuments({
        patientId: appointmentData.patientId,
        showedUp: false
      });

      const patient = await User.findById(appointmentData.patientId);
      const appointmentDate = new Date(appointmentData.date);
      const createdDate = new Date();

      const inputs = {
        age: this.normalizeAge(patient.age || 25),
        gender: patient.gender === 'M' ? 1 : 0,
        dayOfWeek: appointmentDate.getDay() / 6,
        hourOfDay: parseInt(appointmentData.time.split(':')[0]) / 23,
        daysInAdvance: Math.min(Math.floor((appointmentDate - createdDate) / (1000 * 60 * 60 * 24)) / 30, 1),
        previousNoShows: Math.min(previousNoShows / 10, 1),
        appointmentType: this.encodeAppointmentType(appointmentData.appointmentType || 'consultation')
      };

      const showUpProbability = this.simpleNeuralNetwork(inputs);
      const riskScore = 1 - showUpProbability; // Convert to no-show risk

      return {
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel: this.categorizeRisk(riskScore),
        factors: this.analyzeRiskFactors(inputs, previousNoShows)
      };
    } catch (error) {
      console.error('No-show prediction error:', error);
      return { riskScore: 0.5, riskLevel: 'medium', factors: [] };
    }
  }

  // Doctor Recommendation System
  async initializeDoctorMappings() {
    try {
      const doctors = await User.find({ role: 'doctor', isActive: true });
      
      this.doctorSymptomMappings.clear();
      this.tfidf = new natural.TfIdf();

      const specialtySymptoms = {
        'Cardiology': 'chest pain heart attack hypertension cardiac arrhythmia palpitations shortness breath cardiovascular',
        'Dermatology': 'skin rash acne eczema psoriasis moles melanoma dermatitis allergic reactions itching',
        'Endocrinology': 'diabetes thyroid hormone insulin blood sugar metabolic disorders endocrine glands',
        'Gastroenterology': 'stomach pain digestive issues nausea vomiting diarrhea constipation liver gastro',
        'Neurology': 'headache migraine seizure stroke memory loss neurological disorders brain nervous system',
        'Orthopedics': 'bone fracture joint pain muscle strain sports injury back pain arthritis orthopedic',
        'Pediatrics': 'children fever cough cold flu vaccination growth development pediatric kids infant',
        'Psychiatry': 'depression anxiety mental health stress panic disorder bipolar psychiatric psychological',
        'Pulmonology': 'breathing problems asthma lung infection respiratory cough pulmonary airways',
        'Urology': 'kidney stones urinary tract infection bladder prostate reproductive urological'
      };

      doctors.forEach(doctor => {
        const symptoms = specialtySymptoms[doctor.specialization] || 'general consultation medical care treatment';
        this.doctorSymptomMappings.set(doctor._id.toString(), {
          doctor: doctor,
          symptoms: symptoms
        });
        this.tfidf.addDocument(symptoms);
      });

      console.log('Doctor recommendation system initialized');
    } catch (error) {
      console.error('Doctor mapping initialization error:', error);
    }
  }

  async recommendDoctor(symptoms) {
    try {
      if (!symptoms || typeof symptoms !== 'string') {
        return [];
      }

      const queryTokens = this.tokenizer.tokenize(symptoms.toLowerCase());
      const queryText = queryTokens.join(' ');

      // Calculate TF-IDF similarity
      const scores = [];

      for (const [doctorId, mapping] of this.doctorSymptomMappings) {
        const similarity = this.calculateCosineSimilarity(queryText, mapping.symptoms);
        scores.push({
          doctor: mapping.doctor,
          similarity: similarity,
          specialization: mapping.doctor.specialization
        });
      }

      // Sort by similarity and return top 3
      return scores
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .filter(score => score.similarity > 0.1);
    } catch (error) {
      console.error('Doctor recommendation error:', error);
      return [];
    }
  }

  // Helper methods
  normalizeAge(age) {
    return Math.min(Math.max(age, 0), 100) / 100;
  }

  encodeAppointmentType(type) {
    const typeMap = {
      'consultation': 0.25,
      'follow-up': 0.5,
      'emergency': 0.75,
      'routine': 1.0
    };
    return typeMap[type] || 0.25;
  }

  categorizeRisk(riskScore) {
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.6) return 'medium';
    return 'high';
  }

  analyzeRiskFactors(inputs, previousNoShows) {
    const factors = [];
    
    if (previousNoShows > 2) {
      factors.push('High history of no-shows');
    }
    
    if (inputs.daysInAdvance < 0.1) {
      factors.push('Short notice appointment');
    }
    
    if (inputs.hourOfDay > 0.8 || inputs.hourOfDay < 0.3) {
      factors.push('Early morning or late appointment');
    }
    
    if (inputs.dayOfWeek > 0.8 || inputs.dayOfWeek < 0.1) {
      factors.push('Weekend appointment');
    }

    if (inputs.age < 0.3 || inputs.age > 0.8) {
      factors.push('Age factor (very young or elderly)');
    }

    return factors;
  }

  calculateCosineSimilarity(query, document) {
    const queryTokens = this.tokenizer.tokenize(query.toLowerCase());
    const docTokens = this.tokenizer.tokenize(document.toLowerCase());

    // Create term frequency vectors
    const queryTf = {};
    const docTf = {};

    queryTokens.forEach(token => {
      queryTf[token] = (queryTf[token] || 0) + 1;
    });

    docTokens.forEach(token => {
      docTf[token] = (docTf[token] || 0) + 1;
    });

    // Calculate cosine similarity
    const allTerms = new Set([...Object.keys(queryTf), ...Object.keys(docTf)]);
    let dotProduct = 0;
    let queryMagnitude = 0;
    let docMagnitude = 0;

    allTerms.forEach(term => {
      const queryFreq = queryTf[term] || 0;
      const docFreq = docTf[term] || 0;

      dotProduct += queryFreq * docFreq;
      queryMagnitude += queryFreq * queryFreq;
      docMagnitude += docFreq * docFreq;
    });

    if (queryMagnitude === 0 || docMagnitude === 0) return 0;
    
    return dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(docMagnitude));
  }

  // Additional utility methods for ML operations
  async getPatientRiskProfile(patientId) {
    try {
      const patient = await User.findById(patientId);
      const appointmentHistory = await AppointmentHistory.find({ patientId }).limit(10);
      
      const noShowCount = appointmentHistory.filter(apt => !apt.showedUp).length;
      const totalAppointments = appointmentHistory.length;
      const noShowRate = totalAppointments > 0 ? noShowCount / totalAppointments : 0;

      return {
        patientId,
        totalAppointments,
        noShowCount,
        noShowRate,
        riskCategory: noShowRate > 0.3 ? 'high' : noShowRate > 0.1 ? 'medium' : 'low',
        lastNoShow: appointmentHistory.find(apt => !apt.showedUp)?.createdAt || null,
        averageAdvanceBooking: this.calculateAverageAdvanceBooking(appointmentHistory)
      };
    } catch (error) {
      console.error('Error getting patient risk profile:', error);
      return null;
    }
  }

  calculateAverageAdvanceBooking(appointments) {
    if (appointments.length === 0) return 0;
    
    const totalDays = appointments.reduce((sum, apt) => {
      return sum + apt.daysInAdvance;
    }, 0);
    
    return Math.round(totalDays / appointments.length);
  }

  // Batch prediction for multiple appointments
  async batchPredictNoShow(appointments) {
    const predictions = [];
    
    for (const appointment of appointments) {
      try {
        const prediction = await this.predictNoShow(appointment);
        predictions.push({
          appointmentId: appointment._id || appointment.id,
          prediction
        });
      } catch (error) {
        console.error(`Error predicting for appointment ${appointment._id}:`, error);
        predictions.push({
          appointmentId: appointment._id || appointment.id,
          prediction: { riskScore: 0.5, riskLevel: 'medium', factors: [] }
        });
      }
    }
    
    return predictions;
  }

  // Generate insights from feedback sentiment
  generateFeedbackInsights(feedbacks) {
    if (!feedbacks || feedbacks.length === 0) {
      return {
        overallSentiment: 'neutral',
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        commonThemes: [],
        recommendations: []
      };
    }

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const allComments = [];

    feedbacks.forEach(feedback => {
      sentimentCounts[feedback.sentiment]++;
      if (feedback.comment) {
        allComments.push(feedback.comment.toLowerCase());
      }
    });

    // Determine overall sentiment
    const total = feedbacks.length;
    let overallSentiment = 'neutral';
    if (sentimentCounts.positive / total > 0.6) {
      overallSentiment = 'positive';
    } else if (sentimentCounts.negative / total > 0.4) {
      overallSentiment = 'negative';
    }

    // Extract common themes using simple keyword analysis
    const commonThemes = this.extractCommonThemes(allComments);
    
    // Generate recommendations based on sentiment
    const recommendations = this.generateRecommendations(sentimentCounts, commonThemes, total);

    return {
      overallSentiment,
      sentimentDistribution: {
        positive: Math.round((sentimentCounts.positive / total) * 100),
        neutral: Math.round((sentimentCounts.neutral / total) * 100),
        negative: Math.round((sentimentCounts.negative / total) * 100)
      },
      commonThemes,
      recommendations
    };
  }

  extractCommonThemes(comments) {
    const keywords = [
      'waiting', 'time', 'staff', 'doctor', 'nurse', 'appointment', 
      'facility', 'clean', 'professional', 'helpful', 'rude', 
      'excellent', 'poor', 'communication', 'treatment', 'care'
    ];
    
    const keywordCounts = {};
    keywords.forEach(keyword => keywordCounts[keyword] = 0);

    comments.forEach(comment => {
      keywords.forEach(keyword => {
        if (comment.includes(keyword)) {
          keywordCounts[keyword]++;
        }
      });
    });

    return Object.entries(keywordCounts)
      .filter(([keyword, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  generateRecommendations(sentimentCounts, themes, total) {
    const recommendations = [];
    
    if (sentimentCounts.negative / total > 0.3) {
      recommendations.push('Consider staff training to improve patient experience');
    }
    
    if (themes.some(theme => theme.keyword === 'waiting')) {
      recommendations.push('Review appointment scheduling to reduce waiting times');
    }
    
    if (themes.some(theme => theme.keyword === 'communication')) {
      recommendations.push('Enhance communication protocols between staff and patients');
    }
    
    if (sentimentCounts.positive / total > 0.7) {
      recommendations.push('Maintain current high standards of patient care');
    }
    
    return recommendations;
  }
}

module.exports = new MLService();
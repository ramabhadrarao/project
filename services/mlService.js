const natural = require('natural');
const brain = require('brain.js');
const AppointmentHistory = require('../models/AppointmentHistory');
const User = require('../models/User');

class MLService {
  constructor() {
    // Initialize sentiment analyzer
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
    
    // Initialize neural network for no-show prediction
    this.noShowNetwork = new brain.NeuralNetwork({
      hiddenLayers: [10, 5],
      activation: 'sigmoid'
    });
    
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

  // No-Show Prediction
  async trainNoShowModel() {
    try {
      const trainingData = await AppointmentHistory.find({}).lean();
      
      if (trainingData.length < 10) {
        console.log('Insufficient data for training. Using default model.');
        return;
      }

      const processedData = trainingData.map(record => ({
        input: {
          age: this.normalizeAge(record.age),
          gender: record.gender === 'M' ? 1 : 0,
          dayOfWeek: record.dayOfWeek / 6,
          hourOfDay: record.hourOfDay / 23,
          daysInAdvance: Math.min(record.daysInAdvance / 30, 1),
          previousNoShows: Math.min(record.previousNoShows / 10, 1),
          appointmentType: this.encodeAppointmentType(record.appointmentType)
        },
        output: { showUp: record.showedUp ? 1 : 0 }
      }));

      await this.noShowNetwork.train(processedData, {
        iterations: 2000,
        errorThresh: 0.005,
        log: false
      });

      console.log('No-show prediction model trained successfully');
    } catch (error) {
      console.error('Training error:', error);
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

      const input = {
        age: this.normalizeAge(patient.age || 25),
        gender: patient.gender === 'M' ? 1 : 0,
        dayOfWeek: appointmentDate.getDay() / 6,
        hourOfDay: parseInt(appointmentData.time.split(':')[0]) / 23,
        daysInAdvance: Math.min(Math.floor((appointmentDate - createdDate) / (1000 * 60 * 60 * 24)) / 30, 1),
        previousNoShows: Math.min(previousNoShows / 10, 1),
        appointmentType: this.encodeAppointmentType(appointmentData.appointmentType || 'consultation')
      };

      const result = this.noShowNetwork.run(input);
      const riskScore = 1 - result.showUp; // Convert to no-show risk

      return {
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel: this.categorizeRisk(riskScore),
        factors: this.analyzeRiskFactors(input, previousNoShows)
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
        'Cardiology': 'chest pain heart attack hypertension cardiac arrhythmia palpitations shortness breath',
        'Dermatology': 'skin rash acne eczema psoriasis moles melanoma dermatitis allergic reactions',
        'Endocrinology': 'diabetes thyroid hormone insulin blood sugar metabolic disorders',
        'Gastroenterology': 'stomach pain digestive issues nausea vomiting diarrhea constipation liver',
        'Neurology': 'headache migraine seizure stroke memory loss neurological disorders brain',
        'Orthopedics': 'bone fracture joint pain muscle strain sports injury back pain arthritis',
        'Pediatrics': 'children fever cough cold flu vaccination growth development',
        'Psychiatry': 'depression anxiety mental health stress panic disorder bipolar',
        'Pulmonology': 'breathing problems asthma lung infection respiratory cough',
        'Urology': 'kidney stones urinary tract infection bladder prostate reproductive'
      };

      doctors.forEach(doctor => {
        const symptoms = specialtySymptoms[doctor.specialization] || 'general consultation medical care';
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
      let docIndex = 0;

      for (const [doctorId, mapping] of this.doctorSymptomMappings) {
        const similarity = this.calculateCosineSimilarity(queryText, mapping.symptoms);
        scores.push({
          doctor: mapping.doctor,
          similarity: similarity,
          specialization: mapping.doctor.specialization
        });
        docIndex++;
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

  analyzeRiskFactors(input, previousNoShows) {
    const factors = [];
    
    if (previousNoShows > 2) {
      factors.push('High history of no-shows');
    }
    
    if (input.daysInAdvance < 0.1) {
      factors.push('Short notice appointment');
    }
    
    if (input.hourOfDay > 0.8 || input.hourOfDay < 0.3) {
      factors.push('Early morning or late appointment');
    }
    
    if (input.dayOfWeek === 0 || input.dayOfWeek === 6) {
      factors.push('Weekend appointment');
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
}

module.exports = new MLService();
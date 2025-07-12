const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const AppointmentHistory = require('../models/AppointmentHistory');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Feedback.deleteMany({});
    await AppointmentHistory.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@hospital.com',
      fullName: 'System Administrator',
      phone: '+1234567890',
      gender: 'M',
      role: 'admin'
    });

    // Create doctors
    const doctors = await User.create([
      {
        username: 'dr_smith',
        password: 'doctor123',
        email: 'dr.smith@hospital.com',
        fullName: 'Dr. John Smith',
        phone: '+1234567891',
        gender: 'M',
        role: 'doctor',
        specialization: 'Cardiology',
        department: 'Cardiology',
        experience: 15,
        qualifications: ['MD', 'FACC'],
        dateOfBirth: new Date('1978-05-15')
      },
      {
        username: 'dr_johnson',
        password: 'doctor123',
        email: 'dr.johnson@hospital.com',
        fullName: 'Dr. Sarah Johnson',
        phone: '+1234567892',
        gender: 'F',
        role: 'doctor',
        specialization: 'Dermatology',
        department: 'Dermatology',
        experience: 12,
        qualifications: ['MD', 'FAAD'],
        dateOfBirth: new Date('1982-08-22')
      },
      {
        username: 'dr_brown',
        password: 'doctor123',
        email: 'dr.brown@hospital.com',
        fullName: 'Dr. Michael Brown',
        phone: '+1234567893',
        gender: 'M',
        role: 'doctor',
        specialization: 'Neurology',
        department: 'Neurology',
        experience: 20,
        qualifications: ['MD', 'PhD'],
        dateOfBirth: new Date('1975-12-10')
      },
      {
        username: 'dr_davis',
        password: 'doctor123',
        email: 'dr.davis@hospital.com',
        fullName: 'Dr. Emily Davis',
        phone: '+1234567894',
        gender: 'F',
        role: 'doctor',
        specialization: 'Pediatrics',
        department: 'Pediatrics',
        experience: 8,
        qualifications: ['MD', 'FAAP'],
        dateOfBirth: new Date('1985-03-18')
      }
    ]);

    // Create patients
    const patients = await User.create([
      {
        username: 'patient1',
        password: 'patient123',
        email: 'john.doe@email.com',
        fullName: 'John Doe',
        phone: '+1234567895',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1990-06-15')
      },
      {
        username: 'patient2',
        password: 'patient123',
        email: 'jane.smith@email.com',
        fullName: 'Jane Smith',
        phone: '+1234567896',
        gender: 'F',
        role: 'patient',
        dateOfBirth: new Date('1985-09-22')
      },
      {
        username: 'patient3',
        password: 'patient123',
        email: 'bob.wilson@email.com',
        fullName: 'Bob Wilson',
        phone: '+1234567897',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1992-12-08')
      }
    ]);

    console.log('Created users successfully');

    // Create appointments
    const appointments = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 15; i++) {
      const appointmentDate = new Date(currentDate);
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30));
      
      const appointment = {
        patientId: patients[Math.floor(Math.random() * patients.length)]._id,
        doctorId: doctors[Math.floor(Math.random() * doctors.length)]._id,
        date: appointmentDate,
        time: `${Math.floor(Math.random() * 8) + 9}:${Math.random() > 0.5 ? '00' : '30'}`,
        symptoms: [
          'Chest pain and shortness of breath',
          'Skin rash and itching',
          'Persistent headaches',
          'Fever and cough',
          'Joint pain and stiffness'
        ][Math.floor(Math.random() * 5)],
        status: ['scheduled', 'completed', 'cancelled'][Math.floor(Math.random() * 3)],
        appointmentType: ['consultation', 'follow-up', 'routine'][Math.floor(Math.random() * 3)]
      };
      appointments.push(appointment);
    }

    const createdAppointments = await Appointment.create(appointments);
    console.log('Created appointments successfully');

    // Create feedback for completed appointments
    const completedAppointments = createdAppointments.filter(apt => apt.status === 'completed');
    
    for (const appointment of completedAppointments) {
      const comments = [
        'Excellent doctor, very professional and caring. Highly recommended!',
        'Good consultation, doctor explained everything clearly.',
        'Average experience, could be better in terms of waiting time.',
        'Outstanding service, felt very comfortable during the visit.',
        'Poor communication, doctor seemed rushed and uninterested.'
      ];
      
      const rating = Math.floor(Math.random() * 5) + 1;
      const comment = comments[Math.floor(Math.random() * comments.length)];
      
      let sentiment;
      if (rating >= 4) sentiment = 'positive';
      else if (rating >= 3) sentiment = 'neutral';
      else sentiment = 'negative';

      await Feedback.create({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        rating,
        comment,
        sentiment,
        sentimentScore: rating >= 4 ? 0.7 : rating >= 3 ? 0.1 : -0.6,
        categories: {
          communication: rating,
          expertise: rating + Math.floor(Math.random() * 2) - 1,
          timeliness: rating + Math.floor(Math.random() * 2) - 1,
          facilities: rating
        }
      });
    }

    console.log('Created feedback successfully');

    // Create appointment history for ML training
    for (const appointment of createdAppointments) {
      const patient = patients.find(p => p._id.equals(appointment.patientId));
      const appointmentDate = new Date(appointment.date);
      const createdDate = new Date(appointment.createdAt);
      
      await AppointmentHistory.create({
        patientId: appointment.patientId,
        appointmentId: appointment._id,
        showedUp: appointment.status === 'completed',
        age: patient.age || Math.floor(Math.random() * 60) + 20,
        gender: patient.gender,
        dayOfWeek: appointmentDate.getDay(),
        hourOfDay: parseInt(appointment.time.split(':')[0]),
        daysInAdvance: Math.floor((appointmentDate - createdDate) / (1000 * 60 * 60 * 24)),
        previousNoShows: Math.floor(Math.random() * 3),
        appointmentType: appointment.appointmentType
      });
    }

    console.log('Created appointment history successfully');
    console.log('Database seeded successfully!');
    
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@hospital.com / admin123');
    console.log('Doctor: dr.smith@hospital.com / doctor123');
    console.log('Patient: john.doe@email.com / patient123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
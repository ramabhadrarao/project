const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Set seeding mode
process.env.SEEDING = 'true';

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const AppointmentHistory = require('../models/AppointmentHistory');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Feedback.deleteMany({});
    await AppointmentHistory.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create Admin Users
    const adminUsers = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@hospital.com',
        fullName: 'System Administrator',
        phone: '+1234567890',
        gender: 'M',
        role: 'admin',
        address: {
          street: '123 Admin Street',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12345',
          country: 'USA'
        }
      },
      {
        username: 'superadmin',
        password: 'super123',
        email: 'superadmin@hospital.com',
        fullName: 'Super Administrator',
        phone: '+1234567891',
        gender: 'F',
        role: 'admin',
        address: {
          street: '124 Admin Street',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12345',
          country: 'USA'
        }
      }
    ];

    // Create Doctor Users
    const doctorUsers = [
      {
        username: 'dr_smith',
        password: 'doctor123',
        email: 'dr.smith@hospital.com',
        fullName: 'Dr. John Smith',
        phone: '+1234567892',
        gender: 'M',
        role: 'doctor',
        specialization: 'Cardiology',
        department: 'Cardiology',
        experience: 15,
        qualifications: ['MD', 'FACC', 'Board Certified Cardiologist'],
        dateOfBirth: new Date('1978-05-15'),
        address: {
          street: '456 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_johnson',
        password: 'doctor123',
        email: 'dr.johnson@hospital.com',
        fullName: 'Dr. Sarah Johnson',
        phone: '+1234567893',
        gender: 'F',
        role: 'doctor',
        specialization: 'Dermatology',
        department: 'Dermatology',
        experience: 12,
        qualifications: ['MD', 'FAAD', 'Dermatology Specialist'],
        dateOfBirth: new Date('1982-08-22'),
        address: {
          street: '457 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_brown',
        password: 'doctor123',
        email: 'dr.brown@hospital.com',
        fullName: 'Dr. Michael Brown',
        phone: '+1234567894',
        gender: 'M',
        role: 'doctor',
        specialization: 'Neurology',
        department: 'Neurology',
        experience: 20,
        qualifications: ['MD', 'PhD', 'Neurology Specialist'],
        dateOfBirth: new Date('1975-12-10'),
        address: {
          street: '458 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_davis',
        password: 'doctor123',
        email: 'dr.davis@hospital.com',
        fullName: 'Dr. Emily Davis',
        phone: '+1234567895',
        gender: 'F',
        role: 'doctor',
        specialization: 'Pediatrics',
        department: 'Pediatrics',
        experience: 8,
        qualifications: ['MD', 'FAAP', 'Pediatric Specialist'],
        dateOfBirth: new Date('1985-03-18'),
        address: {
          street: '459 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_wilson',
        password: 'doctor123',
        email: 'dr.wilson@hospital.com',
        fullName: 'Dr. Robert Wilson',
        phone: '+1234567896',
        gender: 'M',
        role: 'doctor',
        specialization: 'Orthopedics',
        department: 'Orthopedics',
        experience: 18,
        qualifications: ['MD', 'Orthopedic Surgery Specialist'],
        dateOfBirth: new Date('1976-11-25'),
        address: {
          street: '460 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_garcia',
        password: 'doctor123',
        email: 'dr.garcia@hospital.com',
        fullName: 'Dr. Maria Garcia',
        phone: '+1234567897',
        gender: 'F',
        role: 'doctor',
        specialization: 'Gynecology',
        department: 'Gynecology',
        experience: 14,
        qualifications: ['MD', 'FACOG', 'Gynecology Specialist'],
        dateOfBirth: new Date('1980-07-14'),
        address: {
          street: '461 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_lee',
        password: 'doctor123',
        email: 'dr.lee@hospital.com',
        fullName: 'Dr. James Lee',
        phone: '+1234567898',
        gender: 'M',
        role: 'doctor',
        specialization: 'Psychiatry',
        department: 'Psychiatry',
        experience: 16,
        qualifications: ['MD', 'Psychiatry Board Certified'],
        dateOfBirth: new Date('1977-09-08'),
        address: {
          street: '462 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      },
      {
        username: 'dr_taylor',
        password: 'doctor123',
        email: 'dr.taylor@hospital.com',
        fullName: 'Dr. Lisa Taylor',
        phone: '+1234567899',
        gender: 'F',
        role: 'doctor',
        specialization: 'Endocrinology',
        department: 'Endocrinology',
        experience: 11,
        qualifications: ['MD', 'Endocrinology Specialist'],
        dateOfBirth: new Date('1983-04-12'),
        address: {
          street: '463 Doctor Ave',
          city: 'Medical City',
          state: 'Health State',
          zipCode: '12346',
          country: 'USA'
        }
      }
    ];

    // Create Patient Users
    const patientUsers = [
      {
        username: 'patient1',
        password: 'patient123',
        email: 'john.doe@email.com',
        fullName: 'John Doe',
        phone: '+1234567900',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1990-06-15'),
        address: {
          street: '789 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient2',
        password: 'patient123',
        email: 'jane.smith@email.com',
        fullName: 'Jane Smith',
        phone: '+1234567901',
        gender: 'F',
        role: 'patient',
        dateOfBirth: new Date('1985-09-22'),
        address: {
          street: '790 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient3',
        password: 'patient123',
        email: 'bob.wilson@email.com',
        fullName: 'Bob Wilson',
        phone: '+1234567902',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1992-12-08'),
        address: {
          street: '791 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient4',
        password: 'patient123',
        email: 'alice.brown@email.com',
        fullName: 'Alice Brown',
        phone: '+1234567903',
        gender: 'F',
        role: 'patient',
        dateOfBirth: new Date('1988-03-25'),
        address: {
          street: '792 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient5',
        password: 'patient123',
        email: 'charlie.davis@email.com',
        fullName: 'Charlie Davis',
        phone: '+1234567904',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1995-11-14'),
        address: {
          street: '793 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient6',
        password: 'patient123',
        email: 'diana.garcia@email.com',
        fullName: 'Diana Garcia',
        phone: '+1234567905',
        gender: 'F',
        role: 'patient',
        dateOfBirth: new Date('1987-07-30'),
        address: {
          street: '794 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient7',
        password: 'patient123',
        email: 'edward.miller@email.com',
        fullName: 'Edward Miller',
        phone: '+1234567906',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1975-01-18'),
        address: {
          street: '795 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient8',
        password: 'patient123',
        email: 'fiona.taylor@email.com',
        fullName: 'Fiona Taylor',
        phone: '+1234567907',
        gender: 'F',
        role: 'patient',
        dateOfBirth: new Date('1993-10-05'),
        address: {
          street: '796 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient9',
        password: 'patient123',
        email: 'george.anderson@email.com',
        fullName: 'George Anderson',
        phone: '+1234567908',
        gender: 'M',
        role: 'patient',
        dateOfBirth: new Date('1982-04-20'),
        address: {
          street: '797 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      },
      {
        username: 'patient10',
        password: 'patient123',
        email: 'hannah.white@email.com',
        fullName: 'Hannah White',
        phone: '+1234567909',
        gender: 'F',
        role: 'patient',
        dateOfBirth: new Date('1991-08-12'),
        address: {
          street: '798 Patient Street',
          city: 'Patient City',
          state: 'Health State',
          zipCode: '12347',
          country: 'USA'
        }
      }
    ];

    // Combine all users
    const allUsers = [...adminUsers, ...doctorUsers, ...patientUsers];

    // Create users with password hashing
    const createdUsers = [];
    for (const userData of allUsers) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created ${user.role}: ${user.fullName} (${user.email})`);
    }

    // Separate users by role for appointments
    const doctors = createdUsers.filter(user => user.role === 'doctor');
    const patients = createdUsers.filter(user => user.role === 'patient');

    console.log(`\n📊 Summary:`);
    console.log(`👑 Admins: ${adminUsers.length}`);
    console.log(`👨‍⚕️ Doctors: ${doctorUsers.length}`);
    console.log(`🧑‍🤝‍🧑 Patients: ${patientUsers.length}`);
    console.log(`📍 Total Users: ${createdUsers.length}`);

    // Create sample appointments with better date handling
    const appointments = [];
    const currentDate = new Date();
    const appointmentTypes = ['consultation', 'follow-up', 'routine', 'emergency'];
    const symptoms = [
      'Chest pain and shortness of breath',
      'Skin rash and itching',
      'Persistent headaches and dizziness',
      'Fever and cough',
      'Joint pain and stiffness',
      'Abdominal pain and nausea',
      'Back pain and muscle strain',
      'Anxiety and stress symptoms',
      'Sleep disorders and fatigue',
      'Digestive issues and bloating',
      'High blood pressure symptoms',
      'Allergic reactions',
      'Respiratory problems',
      'Neurological symptoms',
      'Reproductive health concerns'
    ];

    console.log('\n📅 Creating sample appointments...');

    // Create mix of past, current, and future appointments
    for (let i = 0; i < 30; i++) {
      const daysOffset = Math.floor(Math.random() * 120) - 60; // -60 to +60 days
      const appointmentDate = new Date(currentDate);
      appointmentDate.setDate(appointmentDate.getDate() + daysOffset);

      const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
      const minute = Math.random() > 0.5 ? '00' : '30';
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;

      // Determine status based on date
      let status;
      if (daysOffset < -7) {
        // Past appointments are mostly completed
        status = Math.random() > 0.2 ? 'completed' : (Math.random() > 0.5 ? 'cancelled' : 'no-show');
      } else if (daysOffset < 0) {
        // Recent past appointments
        status = Math.random() > 0.1 ? 'completed' : 'no-show';
      } else {
        // Future appointments are scheduled
        status = 'scheduled';
      }

      const appointment = {
        patientId: patients[Math.floor(Math.random() * patients.length)]._id,
        doctorId: doctors[Math.floor(Math.random() * doctors.length)]._id,
        date: appointmentDate,
        time: time,
        symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
        status: status,
        appointmentType: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      };

      // Add notes for completed appointments
      if (appointment.status === 'completed') {
        appointment.notes = 'Patient examination completed. Follow-up recommended.';
        appointment.diagnosis = 'Preliminary diagnosis based on symptoms and examination.';
      }

      appointments.push(appointment);
    }

    // Save appointments one by one to handle any issues
    const createdAppointments = [];
    for (let i = 0; i < appointments.length; i++) {
      try {
        const appointment = await Appointment.create(appointments[i]);
        createdAppointments.push(appointment);
        if ((i + 1) % 10 === 0) {
          console.log(`📅 Created ${i + 1}/${appointments.length} appointments...`);
        }
      } catch (error) {
        console.log(`⚠️ Skipping appointment ${i + 1}: ${error.message}`);
      }
    }

    console.log(`📅 Successfully created ${createdAppointments.length} appointments`);

    // Create sample feedback for completed appointments
    const completedAppointments = createdAppointments.filter(apt => apt.status === 'completed');
    const feedbackComments = [
      'Excellent doctor, very professional and caring. Highly recommended!',
      'Good consultation, doctor explained everything clearly.',
      'Average experience, could be better in terms of waiting time.',
      'Outstanding service, felt very comfortable during the visit.',
      'Doctor was thorough and answered all my questions.',
      'Great bedside manner, very empathetic and understanding.',
      'Quick and efficient appointment, no unnecessary delays.',
      'Very knowledgeable doctor, provided excellent treatment.',
      'Friendly staff and clean facilities, overall positive experience.',
      'Professional service, would definitely recommend to others.'
    ];

    const feedbacks = [];
    const numFeedbacks = Math.min(15, completedAppointments.length);
    
    console.log(`\n⭐ Creating ${numFeedbacks} feedback entries...`);
    
    for (let i = 0; i < numFeedbacks; i++) {
      const appointment = completedAppointments[i];
      const rating = Math.floor(Math.random() * 5) + 1;
      const comment = feedbackComments[Math.floor(Math.random() * feedbackComments.length)];
      
      let sentiment;
      if (rating >= 4) sentiment = 'positive';
      else if (rating >= 3) sentiment = 'neutral';
      else sentiment = 'negative';

      const feedback = {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        rating,
        comment,
        sentiment,
        sentimentScore: rating >= 4 ? 0.7 : rating >= 3 ? 0.1 : -0.6,
        categories: {
          communication: Math.min(5, Math.max(1, rating + Math.floor(Math.random() * 2) - 1)),
          expertise: Math.min(5, Math.max(1, rating + Math.floor(Math.random() * 2) - 1)),
          timeliness: Math.min(5, Math.max(1, rating + Math.floor(Math.random() * 2) - 1)),
          facilities: Math.min(5, Math.max(1, rating + Math.floor(Math.random() * 2) - 1))
        },
        isAnonymous: Math.random() > 0.7 // 30% anonymous feedback
      };

      feedbacks.push(feedback);
    }

    const createdFeedback = await Feedback.create(feedbacks);
    console.log(`⭐ Created ${createdFeedback.length} feedback entries`);

    // Create appointment history for ML training
    console.log('\n📈 Creating ML training data...');
    
    const appointmentHistories = [];
    for (const appointment of createdAppointments) {
      const patient = patients.find(p => p._id.equals(appointment.patientId));
      const appointmentDate = new Date(appointment.date);
      const createdDate = new Date(appointment.createdAt);
      
      const history = {
        patientId: appointment.patientId,
        appointmentId: appointment._id,
        showedUp: appointment.status === 'completed',
        age: patient.age || Math.floor((Date.now() - patient.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000)),
        gender: patient.gender,
        dayOfWeek: appointmentDate.getDay(),
        hourOfDay: parseInt(appointment.time.split(':')[0]),
        daysInAdvance: Math.max(0, Math.floor((appointmentDate - createdDate) / (1000 * 60 * 60 * 24))),
        previousNoShows: Math.floor(Math.random() * 3),
        appointmentType: appointment.appointmentType,
        seasonalFactor: Math.random() * 0.5 + 0.75, // 0.75 to 1.25
        weatherCondition: ['sunny', 'rainy', 'cloudy', 'stormy'][Math.floor(Math.random() * 4)],
        distanceFromHospital: Math.floor(Math.random() * 50) + 1, // 1-50 km
        transportation: ['car', 'public', 'walking', 'taxi'][Math.floor(Math.random() * 4)]
      };

      appointmentHistories.push(history);
    }

    const createdHistory = await AppointmentHistory.create(appointmentHistories);
    console.log(`📈 Created ${createdHistory.length} ML training records`);

    console.log('\n🎉 Database seeded successfully!\n');
    
    console.log('=== LOGIN CREDENTIALS ===');
    console.log('👑 ADMIN ACCOUNTS:');
    console.log('Email: admin@hospital.com | Password: admin123');
    console.log('Email: superadmin@hospital.com | Password: super123\n');
    
    console.log('👨‍⚕️ DOCTOR ACCOUNTS:');
    doctorUsers.forEach(doctor => {
      console.log(`Email: ${doctor.email} | Password: doctor123 | Specialty: ${doctor.specialization}`);
    });
    
    console.log('\n🧑‍🤝‍🧑 PATIENT ACCOUNTS:');
    patientUsers.slice(0, 5).forEach(patient => { // Show first 5 patients
      console.log(`Email: ${patient.email} | Password: patient123`);
    });
    console.log('... and 5 more patient accounts\n');

    console.log('📊 DATA SUMMARY:');
    console.log(`• ${createdUsers.length} users created`);
    console.log(`• ${createdAppointments.length} appointments created`);
    console.log(`• ${createdFeedback.length} feedback entries created`);
    console.log(`• ${createdHistory.length} ML training records created`);
    
    // Reset seeding mode
    process.env.SEEDING = 'false';
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Check if this script is being run directly
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
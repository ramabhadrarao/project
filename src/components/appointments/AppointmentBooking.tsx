import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Search, Brain, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const AppointmentBooking: React.FC = () => {
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    symptoms: '',
    appointmentType: 'consultation'
  });
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [searchSymptoms, setSearchSymptoms] = useState('');
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [noShowRisk, setNoShowRisk] = useState<any>(null);

  const { addNotification } = useNotification();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      fetchAvailableSlots();
    }
  }, [formData.doctorId, formData.date]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/users/doctors');
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch doctors'
      });
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await axios.get('/appointments/availability', {
        params: {
          doctorId: formData.doctorId,
          date: formData.date
        }
      });
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching availability:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch availability'
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const searchDoctorsBySymptoms = async () => {
    if (!searchSymptoms.trim()) return;

    try {
      const response = await axios.post('/ml/recommend-doctor', {
        symptoms: searchSymptoms
      });
      setRecommendedDoctors(response.data.recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to get doctor recommendations'
      });
    }
  };

  const predictNoShowRisk = async () => {
    if (!formData.doctorId || !formData.date || !formData.time) return;

    try {
      const appointmentData = {
        patientId: 'current-user', // This would be the actual user ID
        doctorId: formData.doctorId,
        date: formData.date,
        time: formData.time,
        appointmentType: formData.appointmentType
      };

      const response = await axios.post('/ml/noshow-predict', {
        appointmentId: 'temp-id' // This would be handled differently in a real scenario
      });
      setNoShowRisk(response.data.prediction);
    } catch (error) {
      console.error('Error predicting no-show risk:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/appointments', formData);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Appointment booked successfully!'
      });

      // Reset form
      setFormData({
        doctorId: '',
        date: '',
        time: '',
        symptoms: '',
        appointmentType: 'consultation'
      });
      setAvailableSlots([]);
      setNoShowRisk(null);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: error.response?.data?.message || 'Failed to book appointment'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const selectRecommendedDoctor = (doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      doctorId,
      symptoms: searchSymptoms
    }));
    setRecommendedDoctors([]);
    setSearchSymptoms('');
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600 mt-2">Schedule your visit with our healthcare professionals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Smart Doctor Search */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Doctor Recommendation
                </h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={searchSymptoms}
                    onChange={(e) => setSearchSymptoms(e.target.value)}
                    placeholder="Describe your symptoms (e.g., chest pain, headache, skin rash)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={searchDoctorsBySymptoms}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Doctor
                  </button>
                </div>

                {recommendedDoctors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-blue-900">Recommended Doctors:</h4>
                    {recommendedDoctors.map((rec: any) => (
                      <div
                        key={rec.doctor.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50"
                        onClick={() => selectRecommendedDoctor(rec.doctor.id)}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{rec.doctor.fullName}</p>
                          <p className="text-sm text-gray-600">{rec.doctor.specialization}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">{rec.matchPercentage}% match</p>
                          <p className="text-xs text-gray-500">{rec.doctor.experience} years exp.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Doctor Selection */}
                <div>
                  <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                  </label>
                  <select
                    id="doctorId"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor: any) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.fullName} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Appointment Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={today}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Available Time Slots */}
                {formData.doctorId && formData.date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {availableSlots.map((slot: string) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                            className={`p-3 rounded-lg border text-center transition-colors ${
                              formData.time === slot
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 py-4">No available slots for selected date</p>
                    )}
                  </div>
                )}

                {/* Symptoms */}
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms / Reason for Visit
                  </label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please describe your symptoms or reason for the appointment"
                  />
                </div>

                {/* Appointment Type */}
                <div>
                  <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type
                  </label>
                  <select
                    id="appointmentType"
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="routine">Routine Check-up</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.time}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Doctor Info */}
            {formData.doctorId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Doctor</h3>
                {(() => {
                  const selectedDoctor = doctors.find((d: any) => d._id === formData.doctorId);
                  return selectedDoctor ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Dr. {selectedDoctor.fullName}</p>
                          <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Department:</span> {selectedDoctor.department}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Experience:</span> {selectedDoctor.experience} years
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* No-Show Risk Prediction */}
            {noShowRisk && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Attendance Prediction
                </h3>
                <div className={`p-4 rounded-lg ${
                  noShowRisk.riskLevel === 'high' ? 'bg-red-50 border border-red-200' :
                  noShowRisk.riskLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {noShowRisk.riskLevel === 'high' && <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />}
                    <p className={`font-medium ${
                      noShowRisk.riskLevel === 'high' ? 'text-red-800' :
                      noShowRisk.riskLevel === 'medium' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {noShowRisk.riskLevel.charAt(0).toUpperCase() + noShowRisk.riskLevel.slice(1)} Risk
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Risk Score: {Math.round(noShowRisk.riskScore * 100)}%
                  </p>
                  {noShowRisk.factors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Risk Factors:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {noShowRisk.factors.map((factor: string, index: number) => (
                          <li key={index}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Arrive 15 minutes early for your appointment</p>
                </div>
                <div className="flex items-start space-x-2">
                  <User className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Bring a valid ID and insurance card</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Calendar className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p>Cancel at least 24 hours in advance if needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
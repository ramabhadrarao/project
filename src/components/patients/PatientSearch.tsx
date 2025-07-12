import React, { useState } from 'react';
import { Search, User, Phone, Mail, Calendar, FileText } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const PatientSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  const { addNotification } = useNotification();

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please enter a search query'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/users/patients/search', {
        params: { query: searchQuery }
      });
      setPatients(response.data.patients || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to search patients'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPatientDetails = async (patientId: string) => {
    try {
      const response = await axios.get(`/users/patients/${patientId}`);
      setPatientDetails(response.data.patient);
      setSelectedPatient(patientId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to fetch patient details'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPatients();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search patients by name, email, phone, or username..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={searchPatients}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({patients.length})
            </h2>
          </div>
          <div className="p-6">
            {patients.length > 0 ? (
              <div className="space-y-4">
                {patients.map((patient: any) => (
                  <div
                    key={patient._id}
                    onClick={() => getPatientDetails(patient._id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPatient === patient._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {patient.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {patient.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery && !loading ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No patients found matching your search</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Search for patients to view their details</p>
              </div>
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Patient Details</h2>
          </div>
          <div className="p-6">
            {patientDetails ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{patientDetails.fullName}</p>
                        <p className="text-sm text-gray-600">@{patientDetails.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <p className="text-gray-900">{patientDetails.email}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <p className="text-gray-900">{patientDetails.phone}</p>
                    </div>

                    {patientDetails.dateOfBirth && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <p className="text-gray-900">
                          {new Date(patientDetails.dateOfBirth).toLocaleDateString()}
                          {patientDetails.age && ` (${patientDetails.age} years old)`}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <span className="h-5 w-5 text-gray-400">👤</span>
                      <p className="text-gray-900 capitalize">{patientDetails.gender === 'M' ? 'Male' : patientDetails.gender === 'F' ? 'Female' : 'Other'}</p>
                    </div>

                    {patientDetails.address && (
                      <div className="flex items-start space-x-3">
                        <span className="h-5 w-5 text-gray-400 mt-0.5">📍</span>
                        <div>
                          <p className="text-gray-900">
                            {[
                              patientDetails.address.street,
                              patientDetails.address.city,
                              patientDetails.address.state,
                              patientDetails.address.zipCode,
                              patientDetails.address.country
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment History */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Appointments</h3>
                  {patientDetails.appointmentHistory?.length > 0 ? (
                    <div className="space-y-3">
                      {patientDetails.appointmentHistory.slice(0, 5).map((appointment: any) => (
                        <div key={appointment._id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                Dr. {appointment.doctorId?.fullName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {appointment.doctorId?.specialization}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(appointment.date).toLocaleDateString()}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                          {appointment.symptoms && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No appointment history available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a patient to view their details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSearch;
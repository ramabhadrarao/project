import React, { useState } from 'react';
import { Search, User, Phone, Mail, Calendar, FileText, Clock, Stethoscope, Activity, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const PatientSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);

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
      
      if (response.data.patients?.length === 0) {
        addNotification({
          type: 'info',
          title: 'No Results',
          message: 'No patients found matching your search'
        });
      }
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
      setLoading(true);
      
      // Get patient details
      const patientResponse = await axios.get(`/users/patients/${patientId}`);
      setPatientDetails(patientResponse.data.patient);
      setSelectedPatient(patientId);
      
      // Get patient's appointment history (medical records)
      const appointmentsResponse = await axios.get('/appointments', {
        params: { patientId: patientId }
      });
      
      const appointments = appointmentsResponse.data.appointments || [];
      
      // Filter and format medical records
      const records = appointments
        .filter((apt: any) => apt.status === 'completed' && (apt.diagnosis || apt.notes || apt.prescription?.length > 0))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((apt: any) => ({
          id: apt._id,
          date: apt.date,
          doctor: apt.doctorId?.fullName || 'Unknown Doctor',
          specialization: apt.doctorId?.specialization || 'General',
          symptoms: apt.symptoms,
          diagnosis: apt.diagnosis || 'No diagnosis recorded',
          notes: apt.notes || 'No additional notes',
          prescription: apt.prescription || [],
          appointmentType: apt.appointmentType
        }));
      
      setMedicalRecords(records);
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to fetch patient details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPatients();
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({patients.length})
            </h2>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
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
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {patient.phone}
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

        {/* Patient Details & Medical Records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
            </div>
            <div className="p-6">
              {patientDetails ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                    </div>

                    <div className="space-y-4">
                      {patientDetails.dateOfBirth && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-gray-900">
                              {new Date(patientDetails.dateOfBirth).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Age: {calculateAge(patientDetails.dateOfBirth)} years
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <span className="h-5 w-5 text-gray-400">👤</span>
                        <p className="text-gray-900 capitalize">
                          {patientDetails.gender === 'M' ? 'Male' : patientDetails.gender === 'F' ? 'Female' : 'Other'}
                        </p>
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

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{patientDetails.appointmentHistory?.length || 0}</div>
                      <div className="text-sm text-gray-600">Total Visits</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{medicalRecords.length}</div>
                      <div className="text-sm text-gray-600">Medical Records</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {patientDetails.appointmentHistory?.filter((apt: any) => apt.status === 'completed').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
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

          {/* Medical Records */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Medical Records
                </h2>
                {medicalRecords.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {medicalRecords.length} records
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {medicalRecords.length > 0 ? (
                <div className="space-y-6">
                  {medicalRecords.map((record: any) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      {/* Record Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Dr. {record.doctor} • {record.specialization}
                            </p>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                          {record.appointmentType}
                        </span>
                      </div>

                      {/* Record Content */}
                      <div className="space-y-4">
                        {/* Symptoms */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                            Chief Complaint
                          </h4>
                          <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">{record.symptoms}</p>
                        </div>

                        {/* Diagnosis */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <Activity className="h-4 w-4 mr-1 text-blue-500" />
                            Diagnosis
                          </h4>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{record.diagnosis}</p>
                        </div>

                        {/* Notes */}
                        {record.notes && record.notes !== 'No additional notes' && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-green-500" />
                              Clinical Notes
                            </h4>
                            <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">{record.notes}</p>
                          </div>
                        )}

                        {/* Prescription */}
                        {record.prescription && record.prescription.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <span className="h-4 w-4 mr-1 text-purple-500">💊</span>
                              Prescription
                            </h4>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              {record.prescription.map((med: any, index: number) => (
                                <div key={index} className="text-sm text-gray-700 mb-2 last:mb-0">
                                  <span className="font-medium">{med.medicine}</span>
                                  {med.dosage && <span className="text-gray-600"> - {med.dosage}</span>}
                                  {med.frequency && <span className="text-gray-600"> • {med.frequency}</span>}
                                  {med.duration && <span className="text-gray-600"> • {med.duration}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : patientDetails ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Records</h3>
                  <p className="text-gray-600">
                    This patient doesn't have any completed appointments with medical records yet.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                  <p className="text-gray-600">
                    Choose a patient from the search results to view their medical records.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSearch;
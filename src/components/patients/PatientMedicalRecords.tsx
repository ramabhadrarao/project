import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Stethoscope, Pill, Activity, Download, Eye, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const PatientMedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    doctor: '',
    status: 'completed'
  });

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      // Get patient's appointments
      const response = await axios.get('/appointments', {
        params: { 
          status: 'completed' // Only get completed appointments
        }
      });

      const appointments = response.data.appointments || [];
      
      // Transform appointments into medical records format
      const records = appointments.map((apt: any) => ({
        id: apt._id,
        date: apt.date,
        time: apt.time,
        doctor: {
          id: apt.doctorId?._id,
          name: apt.doctorId?.fullName || 'Unknown Doctor',
          specialization: apt.doctorId?.specialization || 'General Medicine',
          department: apt.doctorId?.department || 'General'
        },
        symptoms: apt.symptoms,
        diagnosis: apt.diagnosis || 'No diagnosis recorded',
        notes: apt.notes || '',
        prescription: apt.prescription || [],
        appointmentType: apt.appointmentType,
        status: apt.status,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt
      }));

      // Sort by date (newest first)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setMedicalRecords(records);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch medical records'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadRecord = (record: any) => {
    const recordData = {
      patient: user?.fullName,
      date: new Date(record.date).toLocaleDateString(),
      doctor: record.doctor.name,
      specialization: record.doctor.specialization,
      symptoms: record.symptoms,
      diagnosis: record.diagnosis,
      notes: record.notes,
      prescription: record.prescription
    };

    const dataStr = JSON.stringify(recordData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-record-${new Date(record.date).toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Downloaded',
      message: 'Medical record downloaded successfully'
    });
  };

  const filteredRecords = medicalRecords.filter((record: any) => {
    const recordDate = new Date(record.date);
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

    if (fromDate && recordDate < fromDate) return false;
    if (toDate && recordDate > toDate) return false;
    if (filters.doctor && !record.doctor.name.toLowerCase().includes(filters.doctor.toLowerCase())) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-600 mt-2">View your complete medical history and treatment records</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Records</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
            <input
              type="text"
              placeholder="Search by doctor name"
              value={filters.doctor}
              onChange={(e) => setFilters(prev => ({ ...prev, doctor: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ dateFrom: '', dateTo: '', doctor: '', status: 'completed' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{medicalRecords.length}</p>
            </div>
            <FileText className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Year</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {medicalRecords.filter((r: any) => new Date(r.date).getFullYear() === new Date().getFullYear()).length}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Doctors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {new Set(medicalRecords.map((r: any) => r.doctor.id)).size}
              </p>
            </div>
            <User className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Visit</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {medicalRecords.length > 0 
                  ? new Date(medicalRecords[0].date).toLocaleDateString()
                  : 'No visits'
                }
              </p>
            </div>
            <Clock className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Medical Records List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Medical Records ({filteredRecords.length})
          </h2>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRecords.map((record: any) => (
              <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Record Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Dr. {record.doctor.name}</span>
                          <span>•</span>
                          <span>{record.doctor.specialization}</span>
                          <span>•</span>
                          <span>{record.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => downloadRecord(record)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download Record"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
                        <p className="text-sm text-gray-900 mt-1 line-clamp-2">{record.symptoms}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                        <p className="text-sm text-gray-900 mt-1 line-clamp-2">{record.diagnosis}</p>
                      </div>
                    </div>

                    {/* Detailed View */}
                    {selectedRecord === record.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                        {/* Symptoms */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-red-500" />
                            Symptoms & Chief Complaint
                          </h4>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700">{record.symptoms}</p>
                          </div>
                        </div>

                        {/* Diagnosis */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <Stethoscope className="h-4 w-4 mr-2 text-blue-500" />
                            Diagnosis & Assessment
                          </h4>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700">{record.diagnosis}</p>
                          </div>
                        </div>

                        {/* Clinical Notes */}
                        {record.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-green-500" />
                              Clinical Notes
                            </h4>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-700">{record.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Prescription */}
                        {record.prescription && record.prescription.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <Pill className="h-4 w-4 mr-2 text-purple-500" />
                              Prescription
                            </h4>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <div className="space-y-3">
                                {record.prescription.map((med: any, index: number) => (
                                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded border">
                                    <Pill className="h-4 w-4 text-purple-500 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{med.medicine}</p>
                                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                                        {med.dosage && <p><span className="font-medium">Dosage:</span> {med.dosage}</p>}
                                        {med.frequency && <p><span className="font-medium">Frequency:</span> {med.frequency}</p>}
                                        {med.duration && <p><span className="font-medium">Duration:</span> {med.duration}</p>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Record Metadata */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Record created: {new Date(record.createdAt).toLocaleString()}</span>
                            <span>Last updated: {new Date(record.updatedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Records Found</h3>
            <p className="text-gray-600">
              {medicalRecords.length === 0 
                ? "You don't have any completed appointments with medical records yet."
                : "No records match your current filters. Try adjusting the filter criteria."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
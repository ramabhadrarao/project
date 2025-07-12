import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, Search, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

interface AppointmentListProps {
  userRole: 'patient' | 'doctor' | 'admin';
}

const AppointmentList: React.FC<AppointmentListProps> = ({ userRole }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: ''
  });

  const { addNotification } = useNotification();

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;

      const response = await axios.get('/appointments', { params });
      let appointmentData = response.data.appointments || [];

      // Filter by search term
      if (filters.search) {
        appointmentData = appointmentData.filter((apt: any) => {
          const searchTerm = filters.search.toLowerCase();
          return (
            apt.patientId?.fullName?.toLowerCase().includes(searchTerm) ||
            apt.doctorId?.fullName?.toLowerCase().includes(searchTerm) ||
            apt.symptoms?.toLowerCase().includes(searchTerm)
          );
        });
      }

      setAppointments(appointmentData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch appointments'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      await axios.put(`/appointments/${appointmentId}`, { status });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Appointment ${status} successfully`
      });

      fetchAppointments();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update appointment'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <h1 className="text-3xl font-bold text-gray-900">
          {userRole === 'patient' ? 'My Appointments' : 
           userRole === 'doctor' ? 'Patient Appointments' : 
           'All Appointments'}
        </h1>
        <p className="text-gray-600 mt-2">Manage and track appointment schedules</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', date: '', search: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {appointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment: any) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {userRole === 'patient' ? (
                          <User className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Calendar className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {userRole === 'patient' 
                            ? `Dr. ${appointment.doctorId?.fullName}`
                            : appointment.patientId?.fullName
                          }
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {appointment.time}
                        </div>
                        {userRole !== 'patient' && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {appointment.patientId?.email}
                          </div>
                        )}
                      </div>

                      {userRole === 'patient' && appointment.doctorId?.specialization && (
                        <p className="text-sm text-blue-600 mt-1">
                          {appointment.doctorId.specialization}
                        </p>
                      )}

                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                      </p>

                      {appointment.notes && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Notes:</span> {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(userRole === 'doctor' || userRole === 'admin') && appointment.status === 'scheduled' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as Completed"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'no-show')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Mark as No Show"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {userRole === 'patient' && appointment.status === 'scheduled' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                      className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">
              {filters.status || filters.date || filters.search
                ? 'Try adjusting your filters to see more results.'
                : 'No appointments have been scheduled yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageCircle, 
  Search,
  Plus,
  Activity,
  FileText,
  Star
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import AppointmentBooking from '../appointments/AppointmentBooking';
import AppointmentList from '../appointments/AppointmentList';
import FeedbackForm from '../feedback/FeedbackForm';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const location = useLocation();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingFeedback: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes] = await Promise.all([
        axios.get('/appointments')
      ]);

      const appointments = appointmentsRes.data.appointments || [];
      
      setStats({
        upcomingAppointments: appointments.filter((apt: any) => apt.status === 'scheduled').length,
        completedAppointments: appointments.filter((apt: any) => apt.status === 'completed').length,
        pendingFeedback: appointments.filter((apt: any) => apt.status === 'completed' && !apt.feedback).length
      });

      setRecentAppointments(appointments.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    { name: 'Overview', href: '/patient', icon: Activity, current: location.pathname === '/patient' },
    { name: 'Book Appointment', href: '/patient/book', icon: Plus, current: location.pathname === '/patient/book' },
    { name: 'My Appointments', href: '/patient/appointments', icon: Calendar, current: location.pathname === '/patient/appointments' },
    { name: 'Feedback', href: '/patient/feedback', icon: MessageCircle, current: location.pathname === '/patient/feedback' },
    { name: 'Medical Records', href: '/patient/records', icon: FileText, current: location.pathname === '/patient/records' }
  ];

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">Patient Portal</h2>
            <p className="text-sm text-gray-600 mt-1">Welcome, {user?.fullName}</p>
          </div>
          
          <nav className="mt-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium transition-colors
                  ${item.current
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={
              <div className="p-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                  <p className="text-gray-600 mt-2">Manage your healthcare appointments and records</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard
                    title="Upcoming Appointments"
                    value={stats.upcomingAppointments}
                    icon={Clock}
                    color="bg-blue-500"
                  />
                  <StatCard
                    title="Completed Appointments"
                    value={stats.completedAppointments}
                    icon={Calendar}
                    color="bg-green-500"
                  />
                  <StatCard
                    title="Pending Feedback"
                    value={stats.pendingFeedback}
                    icon={Star}
                    color="bg-yellow-500"
                  />
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
                  </div>
                  <div className="p-6">
                    {recentAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {recentAppointments.map((appointment: any) => (
                          <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <User className="h-8 w-8 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Dr. {appointment.doctorId?.fullName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {appointment.doctorId?.specialization}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No appointments found</p>
                        <Link
                          to="/patient/book"
                          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Book Your First Appointment
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            } />
            <Route path="/book" element={<AppointmentBooking />} />
            <Route path="/appointments" element={<AppointmentList userRole="patient" />} />
            <Route path="/feedback" element={<FeedbackForm />} />
            <Route path="/records" element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Medical Records</h1>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Medical records feature coming soon</p>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
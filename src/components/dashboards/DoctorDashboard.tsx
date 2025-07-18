import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Clock, 
  Star,
  Activity,
  TrendingUp,
  MessageCircle,
  FileText,
  Stethoscope
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import AppointmentList from '../appointments/AppointmentList';
import PatientSearch from '../patients/PatientSearch';
import FeedbackStats from '../feedback/FeedbackStats';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const location = useLocation();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    averageRating: 0,
    completedAppointments: 0,
    scheduledAppointments: 0,
    totalFeedbacks: 0
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch appointments for this doctor
      const appointmentsRes = await axios.get('/appointments');

      // Fetch feedback for this doctor
      let feedbackRes;
      try {
        feedbackRes = await axios.get('/feedback');
      } catch (error) {
        console.log('Feedback endpoint error, using fallback');
        feedbackRes = { data: { feedbacks: [] } };
      }

      const appointments = appointmentsRes.data.appointments || [];
      const feedbacks = feedbackRes.data.feedbacks || [];
      
      // Filter today's appointments
      const todayAppts = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return aptDate === today && apt.status === 'scheduled';
      });

      // Get unique patients
      const uniquePatients = new Set(appointments.map((apt: any) => apt.patientId?._id || apt.patientId));
      
      // Calculate stats
      const completedCount = appointments.filter((apt: any) => apt.status === 'completed').length;
      const scheduledCount = appointments.filter((apt: any) => apt.status === 'scheduled').length;
      
      // Calculate average rating from feedbacks
      const averageRating = feedbacks.length > 0 
        ? feedbacks.reduce((sum: number, fb: any) => sum + fb.rating, 0) / feedbacks.length 
        : 0;
      
      setStats({
        todayAppointments: todayAppts.length,
        totalPatients: uniquePatients.size,
        averageRating: averageRating,
        completedAppointments: completedCount,
        scheduledAppointments: scheduledCount,
        totalFeedbacks: feedbacks.length
      });

      setTodaySchedule(todayAppts);

      // Get recent patients (unique patients from recent appointments)
      const recentAppointments = appointments
        .filter((apt: any) => apt.status === 'completed')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      setRecentPatients(recentAppointments);

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
    { name: 'Overview', href: '/doctor', icon: Activity, current: location.pathname === '/doctor' },
    { name: 'Appointments', href: '/doctor/appointments', icon: Calendar, current: location.pathname === '/doctor/appointments' },
    { name: 'Patients', href: '/doctor/patients', icon: Users, current: location.pathname === '/doctor/patients' },
    { name: 'Feedback Analytics', href: '/doctor/feedback', icon: Star, current: location.pathname === '/doctor/feedback' },
    { name: 'Reports', href: '/doctor/reports', icon: TrendingUp, current: location.pathname === '/doctor/reports' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }: any) => (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
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
            <div className="flex items-center mb-4">
              <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Doctor Portal</h2>
                <p className="text-sm text-gray-600">Dr. {user?.fullName}</p>
                <p className="text-xs text-blue-600">{user?.specialization}</p>
              </div>
            </div>
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
                  <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                  <p className="text-gray-600 mt-2">Welcome back, Dr. {user?.fullName}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Today's Appointments"
                    value={stats.todayAppointments}
                    icon={Clock}
                    color="bg-blue-500"
                    subtitle={`${stats.scheduledAppointments} total scheduled`}
                  />
                  <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={Users}
                    color="bg-green-500"
                    subtitle="Unique patients treated"
                  />
                  <StatCard
                    title="Average Rating"
                    value={stats.averageRating.toFixed(1)}
                    icon={Star}
                    color="bg-yellow-500"
                    subtitle={`${stats.totalFeedbacks} reviews`}
                  />
                  <StatCard
                    title="Completed"
                    value={stats.completedAppointments}
                    icon={Calendar}
                    color="bg-purple-500"
                    subtitle="Total appointments"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Today's Schedule */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
                        <Link 
                          to="/doctor/appointments"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View All
                        </Link>
                      </div>
                    </div>
                    <div className="p-6">
                      {todaySchedule.length > 0 ? (
                        <div className="space-y-4">
                          {todaySchedule.map((appointment: any) => (
                            <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {appointment.patientId?.fullName || 'Patient Name'}
                                  </p>
                                  <p className="text-sm text-gray-600 truncate max-w-xs">
                                    {appointment.symptoms}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                                <p className="text-xs text-gray-500 capitalize">{appointment.appointmentType}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
                          <p className="text-gray-600">Enjoy your free time!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Patients */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Patients</h2>
                        <Link 
                          to="/doctor/patients"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View All
                        </Link>
                      </div>
                    </div>
                    <div className="p-6">
                      {recentPatients.length > 0 ? (
                        <div className="space-y-4">
                          {recentPatients.map((appointment: any) => (
                            <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-600" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {appointment.patientId?.fullName || 'Patient Name'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Last visit: {new Date(appointment.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  {appointment.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No recent patients</h3>
                          <p className="text-gray-600">Patient history will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Link
                        to="/doctor/appointments"
                        className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Calendar className="h-8 w-8 text-blue-600 mr-4" />
                        <div>
                          <p className="font-medium text-gray-900">Manage Appointments</p>
                          <p className="text-sm text-gray-600">View and update appointments</p>
                        </div>
                      </Link>

                      <Link
                        to="/doctor/patients"
                        className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <Users className="h-8 w-8 text-green-600 mr-4" />
                        <div>
                          <p className="font-medium text-gray-900">Search Patients</p>
                          <p className="text-sm text-gray-600">Find patient records</p>
                        </div>
                      </Link>

                      <Link
                        to="/doctor/feedback"
                        className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        <Star className="h-8 w-8 text-yellow-600 mr-4" />
                        <div>
                          <p className="font-medium text-gray-900">View Feedback</p>
                          <p className="text-sm text-gray-600">Patient reviews & ratings</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="/appointments" element={<AppointmentList userRole="doctor" />} />
            <Route path="/patients" element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Patients</h1>
                <PatientSearch />
              </div>
            } />
            <Route path="/feedback" element={<FeedbackStats />} />
            <Route path="/reports" element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Performance Reports</h1>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
                    <p className="text-gray-600">Analytics and reports feature will be available soon</p>
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

export default DoctorDashboard;
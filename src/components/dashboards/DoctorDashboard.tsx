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
  FileText
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
    completedAppointments: 0
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [appointmentsRes, feedbackRes] = await Promise.all([
        axios.get('/appointments'),
        axios.get(`/feedback/doctor/${user?.id}/stats`)
      ]);

      const appointments = appointmentsRes.data.appointments || [];
      const todayAppts = appointments.filter((apt: any) => 
        new Date(apt.date).toISOString().split('T')[0] === today && apt.status === 'scheduled'
      );

      const uniquePatients = new Set(appointments.map((apt: any) => apt.patientId._id));
      
      setStats({
        todayAppointments: todayAppts.length,
        totalPatients: uniquePatients.size,
        averageRating: feedbackRes.data.stats?.averageRating || 0,
        completedAppointments: appointments.filter((apt: any) => apt.status === 'completed').length
      });

      setTodaySchedule(todayAppts);
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
    { name: 'Feedback', href: '/doctor/feedback', icon: Star, current: location.pathname === '/doctor/feedback' },
    { name: 'Reports', href: '/doctor/reports', icon: TrendingUp, current: location.pathname === '/doctor/reports' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
            <h2 className="text-xl font-bold text-gray-900">Doctor Portal</h2>
            <p className="text-sm text-gray-600 mt-1">Dr. {user?.fullName}</p>
            <p className="text-xs text-blue-600 mt-1">{user?.specialization}</p>
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
                  <p className="text-gray-600 mt-2">Manage your appointments and patient care</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Today's Appointments"
                    value={stats.todayAppointments}
                    icon={Clock}
                    color="bg-blue-500"
                    subtitle="Scheduled"
                  />
                  <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={Users}
                    color="bg-green-500"
                    subtitle="All time"
                  />
                  <StatCard
                    title="Average Rating"
                    value={stats.averageRating.toFixed(1)}
                    icon={Star}
                    color="bg-yellow-500"
                    subtitle="Patient feedback"
                  />
                  <StatCard
                    title="Completed"
                    value={stats.completedAppointments}
                    icon={Calendar}
                    color="bg-purple-500"
                    subtitle="Appointments"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Today's Schedule */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
                    </div>
                    <div className="p-6">
                      {todaySchedule.length > 0 ? (
                        <div className="space-y-4">
                          {todaySchedule.map((appointment: any) => (
                            <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {appointment.patientId?.fullName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {appointment.symptoms}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                                <p className="text-xs text-gray-500">{appointment.appointmentType}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No appointments scheduled for today</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <Link
                          to="/doctor/appointments"
                          className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Calendar className="h-8 w-8 text-blue-600 mr-4" />
                          <div>
                            <p className="font-medium text-gray-900">View All Appointments</p>
                            <p className="text-sm text-gray-600">Manage your schedule</p>
                          </div>
                        </Link>

                        <Link
                          to="/doctor/feedback"
                          className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle className="h-8 w-8 text-green-600 mr-4" />
                          <div>
                            <p className="font-medium text-gray-900">Patient Feedback</p>
                            <p className="text-sm text-gray-600">View ratings and reviews</p>
                          </div>
                        </Link>

                        <Link
                          to="/doctor/reports"
                          className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <TrendingUp className="h-8 w-8 text-purple-600 mr-4" />
                          <div>
                            <p className="font-medium text-gray-900">Analytics</p>
                            <p className="text-sm text-gray-600">Performance insights</p>
                          </div>
                        </Link>
                      </div>
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
                    <p className="text-gray-600">Analytics and reports feature coming soon</p>
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
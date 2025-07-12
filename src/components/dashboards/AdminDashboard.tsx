import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  Activity,
  Star,
  Clock,
  TrendingUp,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import UserManagement from '../admin/UserManagement';
import AppointmentManagement from '../admin/AppointmentManagement';
import FeedbackAnalytics from '../admin/FeedbackAnalytics';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const location = useLocation();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setStats(response.data);
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
    { name: 'Overview', href: '/admin', icon: Activity, current: location.pathname === '/admin' },
    { name: 'User Management', href: '/admin/users', icon: Users, current: location.pathname === '/admin/users' },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar, current: location.pathname === '/admin/appointments' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, current: location.pathname === '/admin/analytics' },
    { name: 'Feedback', href: '/admin/feedback', icon: MessageCircle, current: location.pathname === '/admin/feedback' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: location.pathname === '/admin/settings' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              {change.type === 'increase' ? '↗' : '↘'} {change.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Sample data for charts
  const monthlyData = stats.monthlyTrends?.map((item: any) => ({
    name: `${item._id.month}/${item._id.year}`,
    appointments: item.count
  })) || [];

  const sentimentData = stats.sentimentDistribution?.map((item: any, index: number) => ({
    name: item._id,
    value: item.count,
    color: ['#10B981', '#F59E0B', '#EF4444'][index] || '#6B7280'
  })) || [];

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
            <h2 className="text-xl font-bold text-gray-900">Admin Portal</h2>
            <p className="text-sm text-gray-600 mt-1">System Administrator</p>
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
                  <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
                  <p className="text-gray-600 mt-2">Monitor and manage the hospital system</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Total Users"
                    value={stats.stats?.totalUsers || 0}
                    icon={Users}
                    color="bg-blue-500"
                    change={{ type: 'increase', value: 12 }}
                  />
                  <StatCard
                    title="Active Doctors"
                    value={stats.stats?.totalDoctors || 0}
                    icon={UserCheck}
                    color="bg-green-500"
                  />
                  <StatCard
                    title="Total Appointments"
                    value={stats.stats?.totalAppointments || 0}
                    icon={Calendar}
                    color="bg-purple-500"
                  />
                  <StatCard
                    title="Average Rating"
                    value={(stats.stats?.averageRating || 0).toFixed(1)}
                    icon={Star}
                    color="bg-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Monthly Trends Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Appointment Trends</h2>
                    </div>
                    <div className="p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="appointments" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sentiment Distribution */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Feedback Sentiment</h2>
                    </div>
                    <div className="p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {sentimentData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center mt-4 space-x-4">
                        {sentimentData.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: entry.color }}
                            ></div>
                            <span className="text-sm text-gray-600 capitalize">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
                  </div>
                  <div className="p-6">
                    {stats.recentAppointments?.length > 0 ? (
                      <div className="space-y-4">
                        {stats.recentAppointments.slice(0, 5).map((appointment: any) => (
                          <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {appointment.patientId?.fullName} → Dr. {appointment.doctorId?.fullName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {appointment.doctorId?.specialization}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(appointment.date).toLocaleDateString()}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent appointments</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            } />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/appointments" element={<AppointmentManagement />} />
            <Route path="/analytics" element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Advanced Analytics</h1>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Advanced analytics feature coming soon</p>
                  </div>
                </div>
              </div>
            } />
            <Route path="/feedback" element={<FeedbackAnalytics />} />
            <Route path="/settings" element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">System Settings</h1>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <div className="text-center">
                    <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">System settings feature coming soon</p>
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

export default AdminDashboard;
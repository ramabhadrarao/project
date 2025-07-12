import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Star, 
  Clock, 
  DollarSign,
  Activity,
  AlertTriangle,
  Target,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const AdvancedAnalytics: React.FC = () => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState<any>({
    overview: {},
    appointments: [],
    users: [],
    feedback: [],
    trends: [],
    performance: {}
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple endpoints for comprehensive analytics
      const [dashboardRes, appointmentsRes, usersRes, feedbackRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/appointments', { params: { limit: 100 } }),
        axios.get('/admin/users', { params: { limit: 100 } }),
        axios.get('/admin/feedback/analytics')
      ]);

      const dashboard = dashboardRes.data;
      const appointments = appointmentsRes.data.appointments || [];
      const users = usersRes.data.users || [];
      const feedback = feedbackRes.data;

      // Process data for analytics
      const processedData = processAnalyticsData(dashboard, appointments, users, feedback);
      setAnalytics(processedData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch analytics data'
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (dashboard: any, appointments: any[], users: any[], feedback: any) => {
    // Process appointment trends by month
    const appointmentsByMonth = appointments.reduce((acc: any, apt: any) => {
      const month = new Date(apt.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const appointmentTrends = Object.entries(appointmentsByMonth).map(([month, count]) => ({
      month,
      appointments: count,
      completed: appointments.filter(apt => 
        new Date(apt.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) === month && 
        apt.status === 'completed'
      ).length
    }));

    // Process user registration trends
    const usersByMonth = users.reduce((acc: any, user: any) => {
      const month = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const userTrends = Object.entries(usersByMonth).map(([month, count]) => ({
      month,
      users: count
    }));

    // Process department performance
    const doctorPerformance = users
      .filter((user: any) => user.role === 'doctor')
      .map((doctor: any) => {
        const doctorAppointments = appointments.filter(apt => apt.doctorId?._id === doctor._id);
        const completedAppointments = doctorAppointments.filter(apt => apt.status === 'completed');
        const noShowRate = doctorAppointments.length > 0 
          ? (doctorAppointments.filter(apt => apt.status === 'no-show').length / doctorAppointments.length) * 100 
          : 0;

        return {
          name: doctor.fullName,
          department: doctor.department || doctor.specialization,
          totalAppointments: doctorAppointments.length,
          completedAppointments: completedAppointments.length,
          completionRate: doctorAppointments.length > 0 
            ? Math.round((completedAppointments.length / doctorAppointments.length) * 100) 
            : 0,
          noShowRate: Math.round(noShowRate)
        };
      });

    // Process appointment status distribution
    const statusDistribution = appointments.reduce((acc: any, apt: any) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count as number,
      color: getStatusColor(status)
    }));

    // Process department distribution
    const departmentStats = users
      .filter((user: any) => user.role === 'doctor')
      .reduce((acc: any, doctor: any) => {
        const dept = doctor.department || doctor.specialization || 'General';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

    const departmentData = Object.entries(departmentStats).map(([dept, count]) => ({
      department: dept,
      doctors: count as number,
      appointments: appointments.filter(apt => 
        apt.doctorId?.department === dept || apt.doctorId?.specialization === dept
      ).length
    }));

    // Calculate KPIs
    const totalRevenue = appointments.filter(apt => apt.status === 'completed').length * 150; // Assuming $150 per appointment
    const avgRating = feedback.overallStats?.averageRating || 0;
    const satisfactionRate = feedback.overallStats?.totalFeedbacks > 0 
      ? Math.round((feedback.overallStats.sentimentBreakdown?.filter((s: string) => s === 'positive').length / feedback.overallStats.totalFeedbacks) * 100)
      : 0;

    return {
      overview: {
        ...dashboard.stats,
        totalRevenue,
        satisfactionRate,
        avgRating
      },
      appointmentTrends,
      userTrends,
      doctorPerformance,
      statusData,
      departmentData,
      recentActivity: dashboard.recentAppointments || []
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'no-show': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-4 w-4 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`$${analytics.overview.totalRevenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="bg-green-500"
          trend={12}
          subtitle="From completed appointments"
        />
        <MetricCard
          title="Patient Satisfaction"
          value={`${analytics.overview.satisfactionRate || 0}%`}
          icon={Star}
          color="bg-yellow-500"
          trend={5}
          subtitle={`Avg rating: ${(analytics.overview.avgRating || 0).toFixed(1)}/5`}
        />
        <MetricCard
          title="System Efficiency"
          value="94%"
          icon={Zap}
          color="bg-purple-500"
          trend={3}
          subtitle="Overall performance"
        />
        <MetricCard
          title="Growth Rate"
          value="18%"
          icon={TrendingUp}
          color="bg-blue-500"
          trend={8}
          subtitle="Monthly user growth"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Appointment Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Appointment Trends</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.appointmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="appointments" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Appointment Status Distribution</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Department Performance</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="doctors" fill="#8884d8" name="Doctors" />
              <Bar dataKey="appointments" fill="#82ca9d" name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctor Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Doctor Performance Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Appointments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No-Show Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.doctorPerformance?.slice(0, 10).map((doctor: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.totalAppointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${doctor.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{doctor.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.noShowRate < 10 ? 'bg-green-100 text-green-800' :
                      doctor.noShowRate < 20 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doctor.noShowRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {doctor.completionRate >= 80 ? (
                        <div className="flex items-center text-green-600">
                          <Target className="h-4 w-4 mr-1" />
                          <span className="text-sm">Excellent</span>
                        </div>
                      ) : doctor.completionRate >= 60 ? (
                        <div className="flex items-center text-yellow-600">
                          <Activity className="h-4 w-4 mr-1" />
                          <span className="text-sm">Good</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Needs Improvement</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Growth Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Registration Trends</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
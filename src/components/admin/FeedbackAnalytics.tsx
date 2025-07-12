import React, { useState, useEffect } from 'react';
import { MessageCircle, Star, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const FeedbackAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const { addNotification } = useNotification();

  useEffect(() => {
    fetchFeedbackAnalytics();
  }, []);

  const fetchFeedbackAnalytics = async () => {
    try {
      const response = await axios.get('/admin/feedback/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch feedback analytics'
      });
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = [
    { name: 'Positive', value: analytics.overallStats?.sentimentBreakdown?.filter((s: string) => s === 'positive').length || 0, color: '#10B981' },
    { name: 'Neutral', value: analytics.overallStats?.sentimentBreakdown?.filter((s: string) => s === 'neutral').length || 0, color: '#F59E0B' },
    { name: 'Negative', value: analytics.overallStats?.sentimentBreakdown?.filter((s: string) => s === 'negative').length || 0, color: '#EF4444' }
  ];

  const monthlyData = analytics.monthlyTrends?.map((item: any) => ({
    month: `${item._id.month}/${item._id.year}`,
    feedback: item.count,
    rating: item.averageRating
  })) || [];

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
        <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive analysis of patient feedback and satisfaction</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Feedback"
          value={analytics.overallStats?.totalFeedbacks || 0}
          icon={MessageCircle}
          color="bg-blue-500"
          subtitle="All time"
        />
        <StatCard
          title="Average Rating"
          value={(analytics.overallStats?.averageRating || 0).toFixed(1)}
          icon={Star}
          color="bg-yellow-500"
          subtitle="Out of 5.0"
        />
        <StatCard
          title="Satisfaction Rate"
          value={`${sentimentData[0]?.value && analytics.overallStats?.totalFeedbacks ? Math.round((sentimentData[0].value / analytics.overallStats.totalFeedbacks) * 100) : 0}%`}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle="Positive feedback"
        />
        <StatCard
          title="Active Doctors"
          value={analytics.doctorStats?.length || 0}
          icon={Users}
          color="bg-purple-500"
          subtitle="With feedback"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Sentiment Distribution</h2>
          </div>
          <div className="p-6">
            {sentimentData.some(item => item.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                      <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No sentiment data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Monthly Trends</h2>
          </div>
          <div className="p-6">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="feedback" fill="#3B82F6" name="Feedback Count" />
                  <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#EF4444" name="Avg Rating" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Doctor Performance</h2>
        </div>
        <div className="p-6">
          {analytics.doctorStats?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Feedback
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satisfaction Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Positive/Negative
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.doctorStats.map((doctor: any) => (
                    <tr key={doctor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {doctor.doctorName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{doctor.specialization}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{doctor.totalFeedbacks}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">{doctor.averageRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.satisfactionRate >= 80 ? 'bg-green-100 text-green-800' :
                          doctor.satisfactionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doctor.satisfactionRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="text-green-600">{doctor.positiveCount}</span>
                          {' / '}
                          <span className="text-red-600">{doctor.negativeCount}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Doctor Performance Data</h3>
              <p className="text-gray-600">
                Doctor performance data will appear here once feedback is submitted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalytics;
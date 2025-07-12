import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const FeedbackStats: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState<any>({});
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    try {
      const response = await axios.get(`/feedback/doctor/${user?.id}/stats`);
      setStats(response.data);
      setRecentFeedback(response.data.recentFeedback || []);
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch feedback statistics'
      });
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = stats.sentimentDistribution?.map((item: any) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
    color: item._id === 'positive' ? '#10B981' : item._id === 'negative' ? '#EF4444' : '#F59E0B'
  })) || [];

  const ratingData = stats.ratingDistribution?.map((item: any) => ({
    rating: `${item._id} Star${item._id !== 1 ? 's' : ''}`,
    count: item.count
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-700 bg-green-100';
      case 'negative':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-yellow-700 bg-yellow-100';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
        <p className="text-gray-600 mt-2">Review patient feedback and performance insights</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Feedback"
          value={stats.stats?.totalFeedbacks || 0}
          icon={MessageCircle}
          color="bg-blue-500"
          subtitle="All time"
        />
        <StatCard
          title="Average Rating"
          value={(stats.stats?.averageRating || 0).toFixed(1)}
          icon={Star}
          color="bg-yellow-500"
          subtitle="Out of 5.0"
        />
        <StatCard
          title="Positive Reviews"
          value={sentimentData.find(item => item.name === 'Positive')?.value || 0}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle="Sentiment analysis"
        />
        <StatCard
          title="Response Rate"
          value={stats.stats?.totalFeedbacks ? Math.round((stats.stats.totalFeedbacks / (stats.stats.totalFeedbacks + 10)) * 100) : 0}
          icon={Users}
          color="bg-purple-500"
          subtitle="Feedback completion"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Sentiment Distribution</h2>
          </div>
          <div className="p-6">
            {sentimentData.length > 0 ? (
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
                <p className="text-gray-600">No feedback data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Rating Distribution</h2>
          </div>
          <div className="p-6">
            {ratingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No rating data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Feedback</h2>
        </div>
        <div className="p-6">
          {recentFeedback.length > 0 ? (
            <div className="space-y-6">
              {recentFeedback.map((feedback: any) => (
                <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {feedback.isAnonymous ? 'Anonymous Patient' : feedback.patientId?.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {renderStars(feedback.rating)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}>
                        {feedback.sentiment}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {feedback.comment}
                  </p>

                  {feedback.categories && Object.keys(feedback.categories).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
                      {Object.entries(feedback.categories).map(([category, rating]: [string, any]) => (
                        <div key={category} className="text-center">
                          <p className="text-xs text-gray-600 capitalize mb-1">{category}</p>
                          <div className="flex justify-center">
                            {renderStars(rating)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Feedback</h3>
              <p className="text-gray-600">
                Patient feedback will appear here once you start receiving reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackStats;
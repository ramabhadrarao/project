import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Send, Calendar } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const FeedbackForm: React.FC = () => {
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    categories: {
      communication: 0,
      expertise: 0,
      timeliness: 0,
      facilities: 0
    },
    isAnonymous: false
  });
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<any>(null);

  const { addNotification } = useNotification();

  useEffect(() => {
    fetchCompletedAppointments();
  }, []);

  useEffect(() => {
    if (formData.comment.length > 10) {
      analyzeSentiment();
    }
  }, [formData.comment]);

  const fetchCompletedAppointments = async () => {
    try {
      const response = await axios.get('/appointments?status=completed');
      const appointments = response.data.appointments || [];
      
      // Filter appointments that don't have feedback yet
      const appointmentsWithoutFeedback = appointments.filter((apt: any) => !apt.feedback);
      setCompletedAppointments(appointmentsWithoutFeedback);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch completed appointments'
      });
    }
  };

  const analyzeSentiment = async () => {
    try {
      const response = await axios.post('/ml/sentiment', {
        comment: formData.comment
      });
      setSentiment(response.data);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAppointment) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select an appointment to provide feedback for'
      });
      return;
    }

    if (formData.rating === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please provide a rating'
      });
      return;
    }

    setLoading(true);

    try {
      const feedbackData = {
        appointmentId: selectedAppointment,
        ...formData
      };

      await axios.post('/feedback', feedbackData);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Feedback submitted successfully!'
      });

      // Reset form
      setFormData({
        rating: 0,
        comment: '',
        categories: {
          communication: 0,
          expertise: 0,
          timeliness: 0,
          facilities: 0
        },
        isAnonymous: false
      });
      setSelectedAppointment('');
      setSentiment(null);

      // Refresh appointments list
      fetchCompletedAppointments();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to submit feedback'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCategoryRating = (category: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: rating
      }
    }));
  };

  const StarRating = ({ rating, onRatingClick, size = 'medium' }: any) => {
    const sizeClass = size === 'small' ? 'h-4 w-4' : 'h-6 w-6';
    
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingClick(star)}
            className={`${sizeClass} transition-colors ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    );
  };

  const getSentimentColor = (sentimentType: string) => {
    switch (sentimentType) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Feedback</h1>
          <p className="text-gray-600 mt-2">Share your experience to help us improve our services</p>
        </div>

        {completedAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Appointments</h3>
              <p className="text-gray-600">
                You need to have completed appointments before you can submit feedback.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Appointment Selection */}
              <div>
                <label htmlFor="appointment" className="block text-sm font-medium text-gray-700 mb-3">
                  Select Appointment
                </label>
                <select
                  id="appointment"
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose an appointment to provide feedback for</option>
                  {completedAppointments.map((appointment: any) => (
                    <option key={appointment._id} value={appointment._id}>
                      Dr. {appointment.doctorId?.fullName} - {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Overall Rating
                </label>
                <div className="flex items-center space-x-4">
                  <StarRating 
                    rating={formData.rating} 
                    onRatingClick={handleRatingClick}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.rating > 0 && `${formData.rating} out of 5 stars`}
                  </span>
                </div>
              </div>

              {/* Category Ratings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Detailed Ratings
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries({
                    communication: 'Communication',
                    expertise: 'Medical Expertise',
                    timeliness: 'Timeliness',
                    facilities: 'Facilities'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{label}</span>
                      <StarRating
                        rating={formData.categories[key as keyof typeof formData.categories]}
                        onRatingClick={(rating: number) => handleCategoryRating(key, rating)}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-3">
                  Your Feedback
                </label>
                <textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please share your experience with the doctor and our services..."
                />
                
                {/* Sentiment Analysis */}
                {sentiment && (
                  <div className="mt-3">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getSentimentColor(sentiment.sentiment)}`}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Sentiment: {sentiment.sentiment.charAt(0).toUpperCase() + sentiment.sentiment.slice(1)}
                      {sentiment.score && (
                        <span className="ml-2 text-xs">
                          ({Math.round(Math.abs(sentiment.score) * 100)}% confidence)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                  Submit feedback anonymously
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || formData.rating === 0}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
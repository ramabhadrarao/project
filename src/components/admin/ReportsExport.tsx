import React, { useState } from 'react';
import { Download, FileText, Calendar, MessageCircle, Users } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../contexts/NotificationContext';

const ReportsExport: React.FC = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { addNotification } = useNotification();

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Data',
        message: 'No data available to export'
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAppointments = async () => {
    setLoading(prev => ({ ...prev, appointments: true }));
    try {
      const response = await axios.get('/admin/export/appointments');
      downloadCSV(response.data.data, response.data.filename);
      
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Appointments data exported successfully'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.message || 'Failed to export appointments'
      });
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  };

  const exportFeedback = async () => {
    setLoading(prev => ({ ...prev, feedback: true }));
    try {
      const response = await axios.get('/admin/export/feedback');
      downloadCSV(response.data.data, response.data.filename);
      
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Feedback data exported successfully'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.message || 'Failed to export feedback'
      });
    } finally {
      setLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  const exportUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      // Get all users data
      const response = await axios.get('/admin/users', { 
        params: { limit: 1000 } // Get all users
      });
      
      const users = response.data.users || [];
      const csvData = users.map((user: any) => ({
        'Full Name': user.fullName,
        'Username': user.username,
        'Email': user.email,
        'Phone': user.phone,
        'Role': user.role,
        'Gender': user.gender,
        'Specialization': user.specialization || 'N/A',
        'Department': user.department || 'N/A',
        'Experience': user.experience || 'N/A',
        'Address': user.address ? [
          user.address.street,
          user.address.city,
          user.address.state,
          user.address.zipCode,
          user.address.country
        ].filter(Boolean).join(', ') : 'N/A',
        'Status': user.isActive ? 'Active' : 'Inactive',
        'Date of Birth': user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : 'N/A',
        'Created At': new Date(user.createdAt).toISOString(),
        'Last Login': user.lastLogin ? new Date(user.lastLogin).toISOString() : 'Never'
      }));

      downloadCSV(csvData, `users_${new Date().toISOString().split('T')[0]}.csv`);
      
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Users data exported successfully'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.message || 'Failed to export users'
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const ExportCard = ({ title, description, icon: Icon, onExport, isLoading, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <button
          onClick={onExport}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>
        <p className="text-gray-600 mt-2">Export system data for analysis and reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ExportCard
          title="Appointments Report"
          description="Export all appointment data including patient details, doctor information, dates, times, and status."
          icon={Calendar}
          onExport={exportAppointments}
          isLoading={loading.appointments}
          color="bg-blue-500"
        />

        <ExportCard
          title="Feedback Report"
          description="Export patient feedback data with ratings, comments, sentiment analysis, and doctor performance metrics."
          icon={MessageCircle}
          onExport={exportFeedback}
          isLoading={loading.feedback}
          color="bg-green-500"
        />

        <ExportCard
          title="Users Report"
          description="Export user data including patients, doctors, and admin information with contact details and status."
          icon={Users}
          onExport={exportUsers}
          isLoading={loading.users}
          color="bg-purple-500"
        />
      </div>

      {/* Export Instructions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Export Instructions</h2>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <p>Click the "Export CSV" button for the data you want to download.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <p>The file will be automatically downloaded to your default downloads folder.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <p>Open the CSV file in Excel, Google Sheets, or any spreadsheet application for analysis.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
            <p>Files are named with the current date for easy organization and tracking.</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <p className="text-sm text-yellow-800">
              <strong>Privacy Notice:</strong> Exported data contains sensitive information. 
              Please handle according to your organization's data protection policies and applicable regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsExport;
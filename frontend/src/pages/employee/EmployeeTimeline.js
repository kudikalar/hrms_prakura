import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Badge } from '../../components/ui/badge';
import {
  History,
  TrendingUp,
  Building2,
  Briefcase,
  DollarSign,
  UserCheck,
  UserMinus,
  Calendar,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeTimeline = () => {
  const { user } = useSelector((state) => state.auth);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const eventTypeConfig = {
    JOINED: {
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      label: 'Joined Company'
    },
    PROMOTION: {
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      label: 'Promotion'
    },
    DEPARTMENT_CHANGE: {
      icon: Building2,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      label: 'Department Transfer'
    },
    ROLE_CHANGE: {
      icon: Star,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      label: 'Role Change'
    },
    DESIGNATION_CHANGE: {
      icon: Briefcase,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-700',
      label: 'Designation Change'
    },
    SALARY_REVISION: {
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      label: 'Salary Revision'
    },
    EXIT: {
      icon: UserMinus,
      color: 'bg-red-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      label: 'Exit'
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/employee/timeline`, getAuthHeaders());
      setTimeline(response.data);
    } catch (error) {
      toast.error('Failed to fetch timeline');
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTenure = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    
    let totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    
    if (y > 0 && m > 0) return `${y} year${y > 1 ? 's' : ''} ${m} month${m > 1 ? 's' : ''}`;
    if (y > 0) return `${y} year${y > 1 ? 's' : ''}`;
    if (m > 0) return `${m} month${m > 1 ? 's' : ''}`;
    return 'Just started';
  };

  return (
    <div className="space-y-6" data-testid="employee-timeline-page">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <History className="h-7 w-7 mr-3" />
              My Employment Journey
            </h1>
            <p className="text-indigo-100 mt-1">
              Track your career milestones and growth
            </p>
          </div>
          {user?.dateOfJoining && (
            <div className="text-right">
              <p className="text-indigo-200 text-sm">Total Tenure</p>
              <p className="text-2xl font-bold">{calculateTenure(user.dateOfJoining)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Joined On</p>
              <p className="font-semibold text-gray-900">
                {user?.dateOfJoining ? formatDate(user.dateOfJoining) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Department</p>
              <p className="font-semibold text-gray-900">
                {user?.department?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Designation</p>
              <p className="font-semibold text-gray-900">
                {user?.designation?.title || user?.role || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Career Events</p>
              <p className="font-semibold text-gray-900">{timeline.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Career Timeline</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Events Yet</h3>
            <p className="text-gray-500 mt-1">Your career milestones will appear here</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-8">
              {timeline.map((event, index) => {
                const config = eventTypeConfig[event.eventType] || eventTypeConfig.JOINED;
                const Icon = config.icon;

                return (
                  <div key={event.id} className="relative flex gap-6" data-testid={`timeline-event-${event.id}`}>
                    {/* Icon */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${config.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${config.bgColor} rounded-xl p-5 shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className={`${config.bgColor} ${config.textColor} mb-2`}>
                            {config.label}
                          </Badge>
                          <h3 className="font-semibold text-gray-900">
                            {event.eventType.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(event.effectiveDate)}
                          </p>
                        </div>
                      </div>

                      {/* Change Details */}
                      {(event.oldValue || event.newValue) && (
                        <div className="mt-4 p-3 bg-white/50 rounded-lg">
                          {event.oldValue && (
                            <p className="text-sm">
                              <span className="text-gray-500">From:</span>{' '}
                              <span className="font-medium text-red-600">{event.oldValue}</span>
                            </p>
                          )}
                          {event.newValue && (
                            <p className="text-sm mt-1">
                              <span className="text-gray-500">To:</span>{' '}
                              <span className="font-medium text-green-600">{event.newValue}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {event.notes && (
                        <p className="text-sm text-gray-600 mt-3 italic">
                          "{event.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTimeline;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  Calendar,
  Clock,
  UserPlus,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/hr/dashboard`, getAuthHeaders());
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const { pendingLeaves, pendingOnboarding, newJoiners, totalEmployees, attendanceStats, recentLeaveRequests } = dashboardData || {};

  return (
    <div className="space-y-6" data-testid="hr-dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/20">
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
        <p className="text-emerald-100 mt-1">Manage your workforce efficiently</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Leave Requests */}
        <Link to="/hr/leaves?status=PENDING">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-yellow-200 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              {pendingLeaves > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700 animate-pulse">{pendingLeaves} pending</Badge>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-500">Pending Leave Requests</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingLeaves || 0}</p>
            <p className="text-sm text-yellow-600 mt-2 flex items-center">
              Review & Approve <ArrowRight className="h-4 w-4 ml-1" />
            </p>
          </div>
        </Link>

        {/* Pending Onboarding */}
        <Link to="/hr/onboarding">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Pending Onboarding</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingOnboarding || 0}</p>
            <p className="text-sm text-blue-600 mt-2 flex items-center">
              Manage Onboarding <ArrowRight className="h-4 w-4 ml-1" />
            </p>
          </div>
        </Link>

        {/* New Joiners This Month */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">New Joiners (This Month)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{newJoiners || 0}</p>
        </div>

        {/* Total Employees */}
        <Link to="/hr/directory">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalEmployees || 0}</p>
            <p className="text-sm text-purple-600 mt-2 flex items-center">
              View Directory <ArrowRight className="h-4 w-4 ml-1" />
            </p>
          </div>
        </Link>
      </div>

      {/* Today's Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-emerald-600" />
              Today's Attendance
            </h3>
            <Link to="/hr/attendance">
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{attendanceStats?.present || 0}</p>
              <p className="text-sm text-green-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{attendanceStats?.absent || 0}</p>
              <p className="text-sm text-red-600">Absent</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-700">{attendanceStats?.onLeave || 0}</p>
              <p className="text-sm text-orange-600">On Leave</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{attendanceStats?.total || 0}</p>
              <p className="text-sm text-blue-600">Total</p>
            </div>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-600" />
              Recent Leave Requests
            </h3>
            <Link to="/hr/leaves">
              <Button variant="ghost" size="sm" className="text-yellow-600">
                View All
              </Button>
            </Link>
          </div>

          {recentLeaveRequests && recentLeaveRequests.length > 0 ? (
            <div className="space-y-3">
              {recentLeaveRequests.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-semibold text-sm">
                        {leave.user.firstName[0]}{leave.user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {leave.user.firstName} {leave.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {leave.policy?.leaveType} • {leave.days} day(s)
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent leave requests</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/hr/leaves?status=PENDING">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <Calendar className="h-6 w-6 text-yellow-600" />
              <span>Approve Leaves</span>
            </Button>
          </Link>
          <Link to="/hr/attendance">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              <span>Mark Attendance</span>
            </Button>
          </Link>
          <Link to="/hr/onboarding">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <UserPlus className="h-6 w-6 text-green-600" />
              <span>New Onboarding</span>
            </Button>
          </Link>
          <Link to="/hr/directory">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <Briefcase className="h-6 w-6 text-purple-600" />
              <span>Employee Directory</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

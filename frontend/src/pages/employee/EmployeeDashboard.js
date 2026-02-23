import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Clock,
  Calendar,
  FileText,
  CalendarCheck,
  TrendingUp,
  LogIn,
  LogOut,
  ArrowRight,
  Gift,
  User,
  Building2,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/employee/dashboard`, getAuthHeaders());
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      await axios.post(`${API_URL}/api/v1/employee/attendance/clock-in`, {}, getAuthHeaders());
      toast.success('Clocked in successfully!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to clock in');
    }
    setClockingIn(false);
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    try {
      await axios.post(`${API_URL}/api/v1/employee/attendance/clock-out`, {}, getAuthHeaders());
      toast.success('Clocked out successfully!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to clock out');
    }
    setClockingOut(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { todayAttendance, totalLeaveBalance, pendingLeaves, upcomingHolidays, attendanceSummary } = dashboardData || {};

  return (
    <div className="space-y-6" data-testid="employee-dashboard">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}! 👋</h1>
            <p className="text-blue-100 mt-1">
              {user?.department?.name || 'No Department'} • {user?.designation?.title || user?.role}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-blue-200">Today's Date</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clock In/Out Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <Badge className={todayAttendance?.checkIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
              {todayAttendance?.status === 'PRESENT' ? 'Present' : 'Not Marked'}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Today's Attendance</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-gray-500">In:</span> 
              <span className="font-semibold ml-2">{formatTime(todayAttendance?.checkIn)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Out:</span> 
              <span className="font-semibold ml-2">{formatTime(todayAttendance?.checkOut)}</span>
            </p>
          </div>
          <div className="mt-4 flex space-x-2">
            {!todayAttendance?.checkIn ? (
              <Button 
                onClick={handleClockIn} 
                disabled={clockingIn}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="clock-in-button"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {clockingIn ? 'Clocking...' : 'Clock In'}
              </Button>
            ) : !todayAttendance?.checkOut ? (
              <Button 
                onClick={handleClockOut}
                disabled={clockingOut}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                data-testid="clock-out-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {clockingOut ? 'Clocking...' : 'Clock Out'}
              </Button>
            ) : (
              <p className="text-sm text-green-600 font-medium">✓ Completed for today</p>
            )}
          </div>
        </div>

        {/* Leave Balance Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            {pendingLeaves > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700">{pendingLeaves} Pending</Badge>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500">Leave Balance</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalLeaveBalance || 0}</p>
          <p className="text-sm text-gray-500">days remaining</p>
          <Link to="/employee/leave">
            <Button variant="ghost" className="mt-3 w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              View Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Monthly Attendance Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">This Month</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {attendanceSummary?.present || 0}
            <span className="text-lg text-gray-400 font-normal">/{attendanceSummary?.totalWorkingDays || 0}</span>
          </p>
          <p className="text-sm text-gray-500">days present</p>
          <div className="mt-3 flex items-center text-sm">
            <span className="text-gray-500">Avg Hours:</span>
            <span className="font-semibold ml-2">{attendanceSummary?.avgHours || 0}h</span>
          </div>
        </div>

        {/* Payslips Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Payslips</h3>
          <p className="text-lg font-semibold text-gray-900 mt-2">View & Download</p>
          <p className="text-sm text-gray-500">Your salary statements</p>
          <Link to="/employee/payslips">
            <Button variant="ghost" className="mt-3 w-full justify-between text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
              View Payslips
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Holidays */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarCheck className="h-5 w-5 mr-2 text-orange-500" />
              Upcoming Holidays
            </h3>
            <Link to="/employee/holidays">
              <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
            </Link>
          </div>
          {upcomingHolidays && upcomingHolidays.length > 0 ? (
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">
                      {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-orange-700">
                      {new Date(holiday.date).getDate()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{holiday.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                  </div>
                  <Gift className="ml-auto h-5 w-5 text-orange-400" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming holidays</p>
          )}
        </div>

        {/* Quick Profile Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-500" />
              My Profile
            </h3>
            <Link to="/employee/profile">
              <Button variant="ghost" size="sm" className="text-blue-600">Edit Profile</Button>
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{user?.department?.name || 'Not Assigned'}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-medium text-gray-900">{user?.designation?.title || user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeAttendance = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [selectedMonth, selectedYear]);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/employee/attendance/today`, getAuthHeaders());
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Failed to fetch today attendance');
    }
  };

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/employee/attendance/history?month=${selectedMonth}&year=${selectedYear}`,
        getAuthHeaders()
      );
      setAttendanceHistory(response.data.attendance);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    }
    setLoading(false);
  };

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      await axios.post(`${API_URL}/api/v1/employee/attendance/clock-in`, {}, getAuthHeaders());
      toast.success('Clocked in successfully!');
      fetchTodayAttendance();
      fetchAttendanceHistory();
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
      fetchTodayAttendance();
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to clock out');
    }
    setClockingOut(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      PRESENT: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      ABSENT: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      LATE: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
      HALF_DAY: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle },
      NOT_MARKED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock }
    };
    const style = styles[status] || styles.NOT_MARKED;
    const Icon = style.icon;
    return (
      <Badge className={`${style.bg} ${style.text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status?.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="employee-attendance-page">
      {/* Today's Attendance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Clock className="h-6 w-6 mr-2" />
              Today's Attendance
            </h2>
            <p className="text-blue-100 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-blue-200 text-sm">Clock In</p>
              <p className="text-2xl font-bold">{formatTime(todayAttendance?.checkIn)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-sm">Clock Out</p>
              <p className="text-2xl font-bold">{formatTime(todayAttendance?.checkOut)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-sm">Hours</p>
              <p className="text-2xl font-bold">
                {todayAttendance?.hoursWorked ? `${todayAttendance.hoursWorked}h` : '--'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {!todayAttendance?.checkIn ? (
              <Button
                onClick={handleClockIn}
                disabled={clockingIn}
                className="bg-white text-blue-600 hover:bg-blue-50"
                data-testid="clock-in-button"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {clockingIn ? 'Clocking...' : 'Clock In'}
              </Button>
            ) : !todayAttendance?.checkOut ? (
              <Button
                onClick={handleClockOut}
                disabled={clockingOut}
                className="bg-white text-red-600 hover:bg-red-50"
                data-testid="clock-out-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {clockingOut ? 'Clocking...' : 'Clock Out'}
              </Button>
            ) : (
              <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                Day Complete
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Present Days</p>
              <p className="text-3xl font-bold text-green-600">{summary?.present || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Absent Days</p>
              <p className="text-3xl font-bold text-red-600">{summary?.absent || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Late Days</p>
              <p className="text-3xl font-bold text-yellow-600">{summary?.late || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-3xl font-bold text-blue-600">{Math.round(summary?.totalHours || 0)}h</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Attendance History
            </h3>
            <div className="flex gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]" data-testid="month-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]" data-testid="year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Hours Worked</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : attendanceHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No attendance records found for this period
                </TableCell>
              </TableRow>
            ) : (
              attendanceHistory.map((record) => (
                <TableRow key={record.id} data-testid={`attendance-row-${record.id}`}>
                  <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                  <TableCell>{formatTime(record.checkIn)}</TableCell>
                  <TableCell>{formatTime(record.checkOut)}</TableCell>
                  <TableCell>
                    {record.hoursWorked ? `${record.hoursWorked}h` : '--'}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeAttendance;

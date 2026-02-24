import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  FileSpreadsheet,
  User,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HRAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [markData, setMarkData] = useState({
    status: 'PRESENT',
    checkIn: '',
    checkOut: ''
  });
  const [reportMonth, setReportMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/departments`, getAuthHeaders());
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/v1/hr/attendance?date=${selectedDate}`;
      if (selectedDepartment) url += `&departmentId=${selectedDepartment}`;
      const response = await axios.get(url, getAuthHeaders());
      setAttendance(response.data.attendance);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    }
    setLoading(false);
  };

  const fetchReport = async () => {
    try {
      let url = `${API_URL}/api/v1/hr/attendance/report?month=${reportMonth}&year=${reportYear}`;
      if (selectedDepartment) url += `&departmentId=${selectedDepartment}`;
      const response = await axios.get(url, getAuthHeaders());
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const handleMarkAttendance = (employee) => {
    setSelectedEmployee(employee);
    setMarkData({
      status: employee.attendance?.status || 'PRESENT',
      checkIn: employee.attendance?.checkIn ? new Date(employee.attendance.checkIn).toTimeString().slice(0, 5) : '',
      checkOut: employee.attendance?.checkOut ? new Date(employee.attendance.checkOut).toTimeString().slice(0, 5) : ''
    });
    setMarkDialogOpen(true);
  };

  const confirmMarkAttendance = async () => {
    try {
      const checkInDate = markData.checkIn ? `${selectedDate}T${markData.checkIn}:00` : null;
      const checkOutDate = markData.checkOut ? `${selectedDate}T${markData.checkOut}:00` : null;

      await axios.post(
        `${API_URL}/api/v1/hr/attendance/mark`,
        {
          userId: selectedEmployee.id,
          date: selectedDate,
          status: markData.status,
          checkIn: checkInDate,
          checkOut: checkOutDate
        },
        getAuthHeaders()
      );
      toast.success('Attendance marked successfully');
      setMarkDialogOpen(false);
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PRESENT: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      ABSENT: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      LATE: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
      HALF_DAY: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock }
    };
    const { bg, text, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock };
    return (
      <Badge className={`${bg} ${text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status || 'NOT MARKED'}
      </Badge>
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6" data-testid="hr-attendance">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily" data-testid="daily-tab">Daily View</TabsTrigger>
          <TabsTrigger value="report" data-testid="report-tab">Monthly Report</TabsTrigger>
        </TabsList>

        {/* Daily Attendance Tab */}
        <TabsContent value="daily">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-emerald-600" />
                  Daily Attendance
                </h3>
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[180px]"
                    data-testid="date-picker"
                  />
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[180px]" data-testid="department-filter">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((emp) => (
                    <TableRow key={emp.id} data-testid={`attendance-row-${emp.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-700 font-semibold text-sm">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-sm text-gray-500">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{formatTime(emp.attendance?.checkIn)}</TableCell>
                      <TableCell>{formatTime(emp.attendance?.checkOut)}</TableCell>
                      <TableCell>
                        {emp.attendance?.hoursWorked ? `${emp.attendance.hoursWorked.toFixed(1)}h` : '--'}
                      </TableCell>
                      <TableCell>{getStatusBadge(emp.attendance?.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAttendance(emp)}
                          data-testid={`mark-${emp.id}`}
                        >
                          Mark
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Monthly Report Tab */}
        <TabsContent value="report">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-emerald-600" />
                  Monthly Attendance Report
                </h3>
                <div className="flex gap-3">
                  <Select value={reportMonth} onValueChange={setReportMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={reportYear} onValueChange={setReportYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchReport} className="bg-emerald-600 hover:bg-emerald-700">
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>

            {report ? (
              <>
                <div className="p-6 bg-gray-50 border-b">
                  <p className="text-sm text-gray-500">
                    Report for {months.find(m => m.value === reportMonth)?.label} {reportYear} • 
                    Working Days: <span className="font-medium">{report.workingDays}</span>
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Half Day</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.report.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{emp.present}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{emp.absent}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-yellow-600 font-medium">{emp.late}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600 font-medium">{emp.halfDay}</span>
                        </TableCell>
                        <TableCell>{emp.totalHours}h</TableCell>
                        <TableCell>
                          <Badge className={emp.attendancePercentage >= 90 ? 'bg-green-100 text-green-700' : emp.attendancePercentage >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                            {emp.attendancePercentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select month and year, then click "Generate Report"</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Mark Attendance Dialog */}
      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent data-testid="mark-attendance-dialog">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.name} • {selectedDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={markData.status} onValueChange={(v) => setMarkData({ ...markData, status: v })}>
                <SelectTrigger data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Check In Time</label>
                <Input
                  type="time"
                  value={markData.checkIn}
                  onChange={(e) => setMarkData({ ...markData, checkIn: e.target.value })}
                  data-testid="check-in-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Check Out Time</label>
                <Input
                  type="time"
                  value={markData.checkOut}
                  onChange={(e) => setMarkData({ ...markData, checkOut: e.target.value })}
                  data-testid="check-out-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMarkAttendance} className="bg-emerald-600 hover:bg-emerald-700" data-testid="confirm-mark">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRAttendance;

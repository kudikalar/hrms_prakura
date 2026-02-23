import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Umbrella,
  Heart,
  Baby,
  Plane,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeLeave = () => {
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    policyId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const leaveTypeIcons = {
    SICK: Umbrella,
    CASUAL: Plane,
    EARNED: Gift,
    MATERNITY: Baby,
    PATERNITY: Baby,
    UNPAID: Clock
  };

  const leaveTypeColors = {
    SICK: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    CASUAL: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    EARNED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    MATERNITY: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    PATERNITY: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    UNPAID: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
  };

  useEffect(() => {
    fetchLeaveBalance();
    fetchLeaveRequests();
  }, [selectedYear, statusFilter]);

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/employee/leave/balance`, getAuthHeaders());
      setLeaveBalance(response.data);
    } catch (error) {
      toast.error('Failed to fetch leave balance');
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/v1/employee/leave/requests?year=${selectedYear}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const response = await axios.get(url, getAuthHeaders());
      setLeaveRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    }
    setLoading(false);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/v1/employee/leave/apply`, formData, getAuthHeaders());
      toast.success('Leave application submitted successfully');
      setApplyDialogOpen(false);
      setFormData({ policyId: '', startDate: '', endDate: '', reason: '' });
      fetchLeaveBalance();
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply for leave');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await axios.delete(`${API_URL}/api/v1/employee/leave/${leaveId}`, getAuthHeaders());
      toast.success('Leave request cancelled');
      fetchLeaveBalance();
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel leave');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge className={`${styles[status] || ''} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <div className="space-y-6" data-testid="employee-leave-page">
      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaveBalance.map((leave) => {
          const Icon = leaveTypeIcons[leave.leaveType] || Calendar;
          const colors = leaveTypeColors[leave.leaveType] || leaveTypeColors.CASUAL;
          const percentUsed = (leave.usedDays / leave.totalDays) * 100;
          
          return (
            <div
              key={leave.id}
              className={`bg-white rounded-xl p-5 shadow-sm border ${colors.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <Badge className={`${colors.bg} ${colors.text}`}>
                  {leave.carryForward ? 'Carry Forward' : 'Annual'}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900">{leave.leaveType.replace('_', ' ')} Leave</h3>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Balance</span>
                  <span className="font-medium">{leave.remainingDays} / {leave.totalDays} days</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors.bg.replace('100', '500')}`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Used: {leave.usedDays} days
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Leave Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setApplyDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="apply-leave-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">My Leave Requests</h3>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
              <TableHead>Leave Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : leaveRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No leave requests found
                </TableCell>
              </TableRow>
            ) : (
              leaveRequests.map((leave) => (
                <TableRow key={leave.id} data-testid={`leave-row-${leave.id}`}>
                  <TableCell>
                    <Badge className={leaveTypeColors[leave.policy?.leaveType]?.bg + ' ' + leaveTypeColors[leave.policy?.leaveType]?.text}>
                      {leave.policy?.leaveType?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(leave.startDate)}</TableCell>
                  <TableCell>{formatDate(leave.endDate)}</TableCell>
                  <TableCell className="font-medium">{leave.days}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell className="text-right">
                    {leave.status === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelLeave(leave.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`cancel-leave-${leave.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Apply Leave Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="apply-leave-dialog">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request for approval
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplyLeave}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select
                  value={formData.policyId}
                  onValueChange={(value) => setFormData({ ...formData, policyId: value })}
                >
                  <SelectTrigger data-testid="leave-type-select">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveBalance.map((leave) => (
                      <SelectItem key={leave.id} value={leave.id}>
                        {leave.leaveType.replace('_', ' ')} ({leave.remainingDays} days available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    data-testid="start-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    min={formData.startDate}
                    data-testid="end-date-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  placeholder="Please provide a reason for your leave request"
                  rows={3}
                  data-testid="reason-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-leave-button">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeave;

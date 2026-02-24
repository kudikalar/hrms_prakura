import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
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
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  CalendarDays,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HRLeaveApprovals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [comments, setComments] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [calendarView, setCalendarView] = useState([]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchLeaves();
    fetchLeaveCalendar();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API_URL}/api/v1/hr/leaves${params}`, getAuthHeaders());
      setLeaves(response.data.leaves);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    }
    setLoading(false);
  };

  const fetchLeaveCalendar = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/hr/leaves/calendar`, getAuthHeaders());
      setCalendarView(response.data);
    } catch (error) {
      console.error('Failed to fetch leave calendar');
    }
  };

  const handleAction = (leave, action) => {
    setSelectedLeave(leave);
    setActionType(action);
    setComments('');
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    try {
      await axios.put(
        `${API_URL}/api/v1/hr/leaves/${selectedLeave.id}/status`,
        { status: actionType, comments },
        getAuthHeaders()
      );
      toast.success(`Leave request ${actionType.toLowerCase()}`);
      setActionDialogOpen(false);
      fetchLeaves();
      fetchLeaveCalendar();
    } catch (error) {
      toast.error('Failed to update leave status');
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
    const config = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    };
    const { bg, text, icon: Icon } = config[status] || config.PENDING;
    return (
      <Badge className={`${bg} ${text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const colors = {
      SICK: 'bg-red-100 text-red-700',
      CASUAL: 'bg-blue-100 text-blue-700',
      EARNED: 'bg-green-100 text-green-700',
      MATERNITY: 'bg-pink-100 text-pink-700',
      PATERNITY: 'bg-purple-100 text-purple-700',
      UNPAID: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={colors[type] || 'bg-gray-100'}>{type}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="hr-leave-approvals">
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests" data-testid="requests-tab">Leave Requests</TabsTrigger>
          <TabsTrigger value="calendar" data-testid="calendar-tab">Leave Calendar</TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="requests">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave.id} data-testid={`leave-row-${leave.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-700 font-semibold text-sm">
                              {leave.user.firstName[0]}{leave.user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{leave.user.firstName} {leave.user.lastName}</p>
                            <p className="text-sm text-gray-500">{leave.user.department?.name || 'N/A'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLeaveTypeBadge(leave.policy?.leaveType)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(leave.startDate)}</p>
                          <p className="text-gray-500">to {formatDate(leave.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{leave.days}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      <TableCell className="text-right">
                        {leave.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAction(leave, 'APPROVED')}
                              data-testid={`approve-${leave.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleAction(leave, 'REJECTED')}
                              data-testid={`reject-${leave.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Leave Calendar Tab */}
        <TabsContent value="calendar">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-emerald-600" />
              Who's On Leave
            </h3>

            {calendarView.length > 0 ? (
              <div className="space-y-3">
                {calendarView.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {leave.user.firstName} {leave.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {leave.user.department?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getLeaveTypeBadge(leave.policy?.leaveType)}
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </p>
                      <p className="text-sm font-medium text-orange-600">{leave.days} day(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No approved leaves this month</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent data-testid="action-dialog">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {selectedLeave && (
                <span>
                  {selectedLeave.user.firstName} {selectedLeave.user.lastName} • {selectedLeave.days} day(s)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              {selectedLeave && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Leave Type:</span>
                    <span className="font-medium">{selectedLeave.policy?.leaveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">
                      {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reason:</span>
                    <span className="font-medium">{selectedLeave.reason}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments (Optional)
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments..."
                  rows={3}
                  data-testid="comments-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={actionType === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              data-testid="confirm-action"
            >
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRLeaveApprovals;

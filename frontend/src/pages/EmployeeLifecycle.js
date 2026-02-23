import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Timeline, Search, Plus, TrendingUp, UserMinus, UserCheck, History } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeLifecycle = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState('');
  const [eventFormData, setEventFormData] = useState({
    eventType: 'PROMOTION',
    oldValue: '',
    newValue: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [exitFormData, setExitFormData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    exitType: 'RESIGNED',
    exitReason: '',
    noticeServed: true,
    rehireEligible: true
  });

  const eventTypes = [
    { value: 'PROMOTION', label: 'Promotion' },
    { value: 'DEPARTMENT_CHANGE', label: 'Department Transfer' },
    { value: 'ROLE_CHANGE', label: 'Role Change' },
    { value: 'DESIGNATION_CHANGE', label: 'Designation Change' },
    { value: 'SALARY_REVISION', label: 'Salary Revision' }
  ];

  const exitTypes = [
    { value: 'RESIGNED', label: 'Resigned' },
    { value: 'TERMINATED', label: 'Terminated' },
    { value: 'CONTRACT_END', label: 'Contract End' }
  ];

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, employmentStatusFilter]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (employmentStatusFilter) params.append('employmentStatus', employmentStatusFilter);
      
      const response = await axios.get(
        `${API_URL}/api/v1/admin/lifecycle?${params.toString()}`,
        getAuthHeaders()
      );
      setEmployees(response.data.employees);
    } catch (error) {
      toast.error('Failed to load employees');
    }
    setLoading(false);
  };

  const loadTimeline = async (employeeId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/admin/lifecycle/${employeeId}`,
        getAuthHeaders()
      );
      setSelectedEmployee(response.data.employee);
      setTimeline(response.data.history);
      setTimelineOpen(true);
    } catch (error) {
      toast.error('Failed to load employee timeline');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/v1/admin/lifecycle/${selectedEmployee.id}/event`,
        eventFormData,
        getAuthHeaders()
      );
      toast.success('Employment event added successfully');
      setEventDialogOpen(false);
      loadTimeline(selectedEmployee.id);
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add event');
    }
  };

  const handleRecordExit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/v1/admin/lifecycle/${selectedEmployee.id}/exit`,
        exitFormData,
        getAuthHeaders()
      );
      toast.success('Employee exit recorded successfully');
      setExitDialogOpen(false);
      setTimelineOpen(false);
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record exit');
    }
  };

  const getEventIcon = (eventType) => {
    const icons = {
      JOINED: '🎉',
      PROMOTION: '🚀',
      DEPARTMENT_CHANGE: '🏢',
      ROLE_CHANGE: '👔',
      DESIGNATION_CHANGE: '📊',
      SALARY_REVISION: '💰',
      EXIT: '👋'
    };
    return icons[eventType] || '📌';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6" data-testid="employee-lifecycle-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Lifecycle</h1>
          <p className="text-gray-500 mt-1">Track complete employment journey from joining to exit</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
            data-testid="search-employees-input"
          />
        </div>
        <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11" data-testid="status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXITED">Exited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employees Table */}
      <div className="data-table">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>DOJ</TableHead>
              <TableHead>Tenure</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} data-testid={`employee-row-${emp.id}`}>
                  <TableCell className="font-medium">
                    {emp.firstName} {emp.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.role}</Badge>
                  </TableCell>
                  <TableCell>{emp.department?.name || 'N/A'}</TableCell>
                  <TableCell>{emp.designation?.title || 'N/A'}</TableCell>
                  <TableCell>
                    {emp.dateOfJoining ? formatDate(emp.dateOfJoining) : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{emp.tenure}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={emp.employmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {emp.employmentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadTimeline(emp.id)}
                      data-testid={`view-timeline-${emp.id}`}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Timeline
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Timeline Sheet */}
      <Sheet open={timelineOpen} onOpenChange={setTimelineOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedEmployee && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </SheetTitle>
                <SheetDescription>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Role:</span>
                      <span>{selectedEmployee.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tenure:</span>
                      <span>{selectedEmployee.tenure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className={selectedEmployee.employmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {selectedEmployee.employmentStatus}
                      </Badge>
                    </div>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {selectedEmployee.employmentStatus === 'ACTIVE' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setEventDialogOpen(true)} 
                      className="flex-1"
                      data-testid="add-event-button"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                    <Button 
                      onClick={() => setExitDialogOpen(true)} 
                      variant="destructive"
                      className="flex-1"
                      data-testid="record-exit-button"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Record Exit
                    </Button>
                  </div>
                )}

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Employment Timeline</h3>
                  {timeline.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No events recorded yet</p>
                  ) : (
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                              {getEventIcon(event.eventType)}
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {event.eventType.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {formatDate(event.effectiveDate)}
                                </p>
                              </div>
                            </div>
                            {(event.oldValue || event.newValue) && (
                              <div className="mt-2 text-sm">
                                {event.oldValue && (
                                  <span className="text-red-600">From: {event.oldValue}</span>
                                )}
                                {event.oldValue && event.newValue && <span className="mx-2">→</span>}
                                {event.newValue && (
                                  <span className="text-green-600">To: {event.newValue}</span>
                                )}
                              </div>
                            )}
                            {event.notes && (
                              <p className="text-sm text-gray-600 mt-2">{event.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="add-event-dialog">
          <DialogHeader>
            <DialogTitle>Add Employment Event</DialogTitle>
            <DialogDescription>Record a new event in employee's journey</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select 
                  value={eventFormData.eventType} 
                  onValueChange={(value) => setEventFormData({ ...eventFormData, eventType: value })}
                >
                  <SelectTrigger data-testid="event-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldValue">Previous Value</Label>
                <Input
                  id="oldValue"
                  value={eventFormData.oldValue}
                  onChange={(e) => setEventFormData({ ...eventFormData, oldValue: e.target.value })}
                  placeholder="e.g., Software Engineer"
                  data-testid="old-value-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newValue">New Value *</Label>
                <Input
                  id="newValue"
                  value={eventFormData.newValue}
                  onChange={(e) => setEventFormData({ ...eventFormData, newValue: e.target.value })}
                  required
                  placeholder="e.g., Senior Software Engineer"
                  data-testid="new-value-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={eventFormData.effectiveDate}
                  onChange={(e) => setEventFormData({ ...eventFormData, effectiveDate: e.target.value })}
                  required
                  data-testid="effective-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={eventFormData.notes}
                  onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                  placeholder="Additional details about this event"
                  rows={3}
                  data-testid="notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEventDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-event-button">
                Add Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="sm:max-w-[550px]" data-testid="exit-dialog">
          <DialogHeader>
            <DialogTitle>Record Employee Exit</DialogTitle>
            <DialogDescription>
              This will mark the employee as exited and disable their access
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordExit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="exitDate">Exit Date *</Label>
                <Input
                  id="exitDate"
                  type="date"
                  value={exitFormData.exitDate}
                  onChange={(e) => setExitFormData({ ...exitFormData, exitDate: e.target.value })}
                  required
                  data-testid="exit-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitType">Exit Type *</Label>
                <Select 
                  value={exitFormData.exitType} 
                  onValueChange={(value) => setExitFormData({ ...exitFormData, exitType: value })}
                >
                  <SelectTrigger data-testid="exit-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exitTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitReason">Exit Reason *</Label>
                <Textarea
                  id="exitReason"
                  value={exitFormData.exitReason}
                  onChange={(e) => setExitFormData({ ...exitFormData, exitReason: e.target.value })}
                  required
                  placeholder="Reason for leaving"
                  rows={3}
                  data-testid="exit-reason-input"
                />
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="noticeServed">Notice Period Served</Label>
                </div>
                <Switch
                  id="noticeServed"
                  checked={exitFormData.noticeServed}
                  onCheckedChange={(checked) => setExitFormData({ ...exitFormData, noticeServed: checked })}
                  data-testid="notice-served-switch"
                />
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="rehireEligible">Rehire Eligible</Label>
                </div>
                <Switch
                  id="rehireEligible"
                  checked={exitFormData.rehireEligible}
                  onCheckedChange={(checked) => setExitFormData({ ...exitFormData, rehireEligible: checked })}
                  data-testid="rehire-eligible-switch"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExitDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" data-testid="submit-exit-button">
                Record Exit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLifecycle;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Progress } from '../../components/ui/progress';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import {
  UserPlus,
  CheckCircle,
  Clock,
  FileText,
  Laptop,
  GraduationCap,
  Shield,
  User,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HROnboarding = () => {
  const [onboardings, setOnboardings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const categoryIcons = {
    DOCUMENTS: FileText,
    IT_SETUP: Laptop,
    TRAINING: GraduationCap,
    COMPLIANCE: Shield
  };

  const categoryColors = {
    DOCUMENTS: 'bg-blue-100 text-blue-700',
    IT_SETUP: 'bg-purple-100 text-purple-700',
    TRAINING: 'bg-green-100 text-green-700',
    COMPLIANCE: 'bg-orange-100 text-orange-700'
  };

  useEffect(() => {
    fetchOnboardings();
    fetchEmployees();
  }, [statusFilter]);

  const fetchOnboardings = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API_URL}/api/v1/hr/onboarding${params}`, getAuthHeaders());
      setOnboardings(response.data);
    } catch (error) {
      toast.error('Failed to fetch onboardings');
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/users`, getAuthHeaders());
      // Filter employees without onboarding
      const employeesWithoutOnboarding = response.data.users.filter(
        emp => !onboardings.find(o => o.userId === emp.id)
      );
      setEmployees(employeesWithoutOnboarding);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const handleCreateOnboarding = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/v1/hr/onboarding`,
        { userId: selectedEmployeeId },
        getAuthHeaders()
      );
      toast.success('Onboarding created successfully');
      setCreateDialogOpen(false);
      setSelectedEmployeeId('');
      fetchOnboardings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create onboarding');
    }
  };

  const handleTaskToggle = async (taskId, isCompleted) => {
    try {
      await axios.put(
        `${API_URL}/api/v1/hr/onboarding/tasks/${taskId}`,
        { isCompleted },
        getAuthHeaders()
      );
      toast.success(isCompleted ? 'Task completed' : 'Task marked incomplete');
      fetchOnboardings();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      NOT_STARTED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle }
    };
    const { bg, text, icon: Icon } = config[status] || config.NOT_STARTED;
    return (
      <Badge className={`${bg} ${text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const groupTasksByCategory = (tasks) => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {});
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6" data-testid="hr-onboarding">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
          data-testid="create-onboarding-button"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          New Onboarding
        </Button>
      </div>

      {/* Onboarding List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : onboardings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <UserPlus className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Onboardings Found</h3>
          <p className="text-gray-500 mt-1">Create a new onboarding for a recently joined employee</p>
        </div>
      ) : (
        <div className="space-y-4">
          {onboardings.map((onboarding) => {
            const progress = calculateProgress(onboarding.tasks);
            const groupedTasks = groupTasksByCategory(onboarding.tasks);

            return (
              <div
                key={onboarding.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                data-testid={`onboarding-${onboarding.id}`}
              >
                {/* Onboarding Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-bold text-lg">
                          {onboarding.user.firstName[0]}{onboarding.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {onboarding.user.firstName} {onboarding.user.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {onboarding.user.department?.name || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Joined: {formatDate(onboarding.user.dateOfJoining)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(onboarding.status)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {onboarding.tasks.filter(t => t.isCompleted).length} of {onboarding.tasks.length} tasks completed
                    </p>
                  </div>
                </div>

                {/* Tasks Accordion */}
                <Accordion type="single" collapsible className="px-6 pb-4">
                  {Object.entries(groupedTasks).map(([category, tasks]) => {
                    const Icon = categoryIcons[category] || FileText;
                    const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-700';
                    const completedInCategory = tasks.filter(t => t.isCompleted).length;

                    return (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{category.replace('_', ' ')}</span>
                            <Badge variant="outline" className="ml-2">
                              {completedInCategory}/{tasks.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  task.isCompleted ? 'bg-green-50' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={task.isCompleted}
                                    onCheckedChange={(checked) => handleTaskToggle(task.id, checked)}
                                    data-testid={`task-${task.id}`}
                                  />
                                  <div>
                                    <p className={`font-medium ${task.isCompleted ? 'text-gray-500 line-through' : ''}`}>
                                      {task.taskName}
                                    </p>
                                    {task.description && (
                                      <p className="text-sm text-gray-500">{task.description}</p>
                                    )}
                                  </div>
                                </div>
                                {task.isCompleted && task.completedAt && (
                                  <span className="text-xs text-green-600">
                                    Completed {formatDate(task.completedAt)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Onboarding Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="create-onboarding-dialog">
          <DialogHeader>
            <DialogTitle>Start New Onboarding</DialogTitle>
            <DialogDescription>
              Select an employee to begin their onboarding process
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger data-testid="employee-select">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.length === 0 ? (
                  <SelectItem value="" disabled>No employees available</SelectItem>
                ) : (
                  employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <p className="text-sm text-gray-500 mt-3">
              A default onboarding checklist will be created with standard tasks for documents, IT setup, training, and compliance.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOnboarding} className="bg-emerald-600 hover:bg-emerald-700" data-testid="confirm-create">
              Create Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HROnboarding;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Users,
  Search,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  User,
  Grid3X3,
  List,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HRDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [orgChart, setOrgChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchDepartments();
    fetchOrgChart();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/departments`, getAuthHeaders());
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/v1/hr/directory?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (selectedDepartment) url += `departmentId=${selectedDepartment}&`;
      const response = await axios.get(url, getAuthHeaders());
      setEmployees(response.data.employees);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
    setLoading(false);
  };

  const fetchOrgChart = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/hr/org-chart`, getAuthHeaders());
      setOrgChart(response.data);
    } catch (error) {
      console.error('Failed to fetch org chart');
    }
  };

  const viewEmployeeProfile = async (employeeId) => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/hr/directory/${employeeId}`, getAuthHeaders());
      setSelectedEmployee(response.data);
      setProfileDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load employee profile');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const colors = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-700',
      ADMIN: 'bg-blue-100 text-blue-700',
      HR: 'bg-emerald-100 text-emerald-700',
      EMPLOYEE: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={colors[role] || 'bg-gray-100'}>{role}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="hr-directory">
      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="directory" data-testid="directory-tab">
            <Users className="h-4 w-4 mr-2" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="org-chart" data-testid="org-chart-tab">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Org Chart
          </TabsTrigger>
        </TabsList>

        {/* Directory Tab */}
        <TabsContent value="directory">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Filters */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
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
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Employee List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No employees found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
                    onClick={() => viewEmployeeProfile(emp.id)}
                    data-testid={`employee-card-${emp.id}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3">
                        <span className="text-white font-bold text-xl">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-sm text-gray-500">{emp.designation?.title || emp.role}</p>
                      <p className="text-xs text-gray-400 mt-1">{emp.department?.name || 'No Department'}</p>
                      <div className="mt-3">{getRoleBadge(emp.role)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                    onClick={() => viewEmployeeProfile(emp.id)}
                    data-testid={`employee-row-${emp.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</h3>
                        <p className="text-sm text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">{emp.department?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{emp.designation?.title || 'N/A'}</p>
                      </div>
                      {getRoleBadge(emp.role)}
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Org Chart Tab */}
        <TabsContent value="org-chart">
          <div className="space-y-4">
            {orgChart.map((dept) => (
              <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6" />
                      <h3 className="text-lg font-semibold">{dept.name}</h3>
                    </div>
                    <Badge className="bg-white/20 text-white">
                      {dept.employeeCount} employees
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  {dept.employees.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {dept.employees.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex flex-col items-center p-3 bg-gray-50 rounded-lg text-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                            <span className="text-emerald-700 font-semibold text-sm">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate w-full">{emp.name}</p>
                          <p className="text-xs text-gray-500 truncate w-full">{emp.designation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No employees in this department</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Employee Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="profile-dialog">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <p className="text-gray-500">{selectedEmployee.designation?.title || selectedEmployee.role}</p>
                  {getRoleBadge(selectedEmployee.role)}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedEmployee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{selectedEmployee.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="font-medium">{selectedEmployee.department?.name || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date of Joining</p>
                    <p className="font-medium">{formatDate(selectedEmployee.dateOfJoining)}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {selectedEmployee.attendance && selectedEmployee.attendance.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Attendance</h4>
                  <div className="space-y-2">
                    {selectedEmployee.attendance.slice(0, 3).map((att, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{formatDate(att.date)}</span>
                        <Badge className={att.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                          {att.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRDirectory;

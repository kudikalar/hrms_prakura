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
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    headId: '',
    description: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadDepartments();
    loadUsers();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/departments`, getAuthHeaders());
      setDepartments(response.data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/users?limit=100`, getAuthHeaders());
      setUsers(response.data.users.filter(u => u.status === 'ACTIVE'));
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleOpenDialog = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        headId: dept.headId || '',
        description: dept.description || ''
      });
    } else {
      setEditingDept(null);
      setFormData({ name: '', headId: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(
          `${API_URL}/api/v1/admin/departments/${editingDept.id}`,
          { ...formData, isActive: true },
          getAuthHeaders()
        );
        toast.success('Department updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/v1/admin/departments`,
          formData,
          getAuthHeaders()
        );
        toast.success('Department created successfully');
      }
      setDialogOpen(false);
      loadDepartments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id, employeeCount) => {
    if (employeeCount > 0) {
      toast.error('Cannot delete department with employees');
      return;
    }
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`${API_URL}/api/v1/admin/departments/${id}`, getAuthHeaders());
        toast.success('Department deleted successfully');
        loadDepartments();
      } catch (error) {
        toast.error('Failed to delete department');
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="departments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Organize your company's workforce structure</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" data-testid="add-department-button">
          <Plus className="mr-2 h-5 w-5" />
          Add Department
        </Button>
      </div>

      <div className="data-table">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Department Head</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id} data-testid={`department-row-${dept.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span>{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.headId ? (
                      users.find(u => u.id === dept.headId)?.firstName + ' ' + 
                      users.find(u => u.id === dept.headId)?.lastName || 'N/A'
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{dept._count?.users || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(dept)}
                        data-testid={`edit-department-${dept.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dept.id, dept._count?.users || 0)}
                        data-testid={`delete-department-${dept.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="department-dialog">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create New Department'}</DialogTitle>
            <DialogDescription>
              {editingDept ? 'Update department information' : 'Add a new department to the organization'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Engineering, Sales, HR"
                  data-testid="department-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headId">Department Head</Label>
                <Select value={formData.headId} onValueChange={(value) => setFormData({ ...formData, headId: value })}>
                  <SelectTrigger data-testid="department-head-select">
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department"
                  rows={3}
                  data-testid="department-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="department-submit-button">
                {editingDept ? 'Update Department' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;

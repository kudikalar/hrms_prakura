import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Briefcase, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Designations = () => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    salaryBand: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadDesignations();
    loadDepartments();
  }, []);

  const loadDesignations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/designations`, getAuthHeaders());
      setDesignations(response.data);
    } catch (error) {
      toast.error('Failed to load designations');
    }
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/departments`, getAuthHeaders());
      setDepartments(response.data.filter(d => d.isActive));
    } catch (error) {
      console.error('Failed to load departments');
    }
  };

  const handleOpenDialog = (desig = null) => {
    if (desig) {
      setEditingDesig(desig);
      setFormData({
        title: desig.title,
        departmentId: desig.departmentId || '',
        salaryBand: desig.salaryBand || ''
      });
    } else {
      setEditingDesig(null);
      setFormData({ title: '', departmentId: '', salaryBand: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDesig) {
        await axios.put(
          `${API_URL}/api/v1/admin/designations/${editingDesig.id}`,
          { ...formData, isActive: true },
          getAuthHeaders()
        );
        toast.success('Designation updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/v1/admin/designations`,
          formData,
          getAuthHeaders()
        );
        toast.success('Designation created successfully');
      }
      setDialogOpen(false);
      loadDesignations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id, employeeCount) => {
    if (employeeCount > 0) {
      toast.error('Cannot delete designation with employees');
      return;
    }
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await axios.delete(`${API_URL}/api/v1/admin/designations/${id}`, getAuthHeaders());
        toast.success('Designation deleted successfully');
        loadDesignations();
      } catch (error) {
        toast.error('Failed to delete designation');
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="designations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Designations</h1>
          <p className="text-gray-500 mt-1">Define job titles and salary bands</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" data-testid="add-designation-button">
          <Plus className="mr-2 h-5 w-5" />
          Add Designation
        </Button>
      </div>

      <div className="data-table">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Salary Band</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : designations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No designations found
                </TableCell>
              </TableRow>
            ) : (
              designations.map((desig) => (
                <TableRow key={desig.id} data-testid={`designation-row-${desig.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <span>{desig.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {desig.department?.name || <span className="text-gray-400">No department</span>}
                  </TableCell>
                  <TableCell>
                    {desig.salaryBand ? (
                      <Badge variant="outline">{desig.salaryBand}</Badge>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{desig._count?.users || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={desig.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {desig.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(desig)}
                        data-testid={`edit-designation-${desig.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(desig.id, desig._count?.users || 0)}
                        data-testid={`delete-designation-${desig.id}`}
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
        <DialogContent className="sm:max-w-[500px]" data-testid="designation-dialog">
          <DialogHeader>
            <DialogTitle>{editingDesig ? 'Edit Designation' : 'Create New Designation'}</DialogTitle>
            <DialogDescription>
              {editingDesig ? 'Update designation information' : 'Add a new job title to the organization'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Designation Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Senior Software Engineer, HR Manager"
                  data-testid="designation-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                  <SelectTrigger data-testid="designation-department-select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">No department</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryBand">Salary Band</Label>
                <Input
                  id="salaryBand"
                  value={formData.salaryBand}
                  onChange={(e) => setFormData({ ...formData, salaryBand: e.target.value })}
                  placeholder="e.g., $50,000 - $80,000 or Level 3"
                  data-testid="designation-salary-band-input"
                />
                <p className="text-xs text-gray-500">Define salary range or level for this role</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="designation-submit-button">
                {editingDesig ? 'Update Designation' : 'Create Designation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Designations;

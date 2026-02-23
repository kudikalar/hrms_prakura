import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CalendarDays, Plus, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LeavePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    totalDays: 12,
    carryForward: false,
    carryForwardLimit: 0,
    requiresApproval: true
  });

  const leaveTypes = [
    { value: 'SICK', label: 'Sick Leave', color: 'bg-red-100 text-red-700' },
    { value: 'CASUAL', label: 'Casual Leave', color: 'bg-blue-100 text-blue-700' },
    { value: 'EARNED', label: 'Earned Leave', color: 'bg-green-100 text-green-700' },
    { value: 'MATERNITY', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-700' },
    { value: 'PATERNITY', label: 'Paternity Leave', color: 'bg-purple-100 text-purple-700' },
    { value: 'UNPAID', label: 'Unpaid Leave', color: 'bg-gray-100 text-gray-700' }
  ];

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/leave-policy`, getAuthHeaders());
      setPolicies(response.data);
    } catch (error) {
      toast.error('Failed to load leave policies');
    }
    setLoading(false);
  };

  const handleOpenDialog = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        leaveType: policy.leaveType,
        totalDays: policy.totalDays,
        carryForward: policy.carryForward,
        carryForwardLimit: policy.carryForwardLimit,
        requiresApproval: policy.requiresApproval
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        leaveType: 'CASUAL',
        totalDays: 12,
        carryForward: false,
        carryForwardLimit: 0,
        requiresApproval: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await axios.put(
          `${API_URL}/api/v1/admin/leave-policy/${editingPolicy.id}`,
          { ...formData, isActive: true },
          getAuthHeaders()
        );
        toast.success('Leave policy updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/v1/admin/leave-policy`,
          formData,
          getAuthHeaders()
        );
        toast.success('Leave policy created successfully');
      }
      setDialogOpen(false);
      loadPolicies();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const getLeaveTypeInfo = (type) => {
    return leaveTypes.find(lt => lt.value === type) || leaveTypes[0];
  };

  return (
    <div className="space-y-6" data-testid="leave-policy-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Policy Management</h1>
          <p className="text-gray-500 mt-1">Define leave types and approval workflows</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" data-testid="add-policy-button">
          <Plus className="mr-2 h-5 w-5" />
          Add Leave Policy
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{policies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{policies.filter(p => p.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Carry Forward Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{policies.filter(p => p.carryForward).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="data-table">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Total Days</TableHead>
              <TableHead>Carry Forward</TableHead>
              <TableHead>Approval Required</TableHead>
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
            ) : policies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No leave policies found. Create your first policy to get started.
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => {
                const typeInfo = getLeaveTypeInfo(policy.leaveType);
                return (
                  <TableRow key={policy.id} data-testid={`policy-row-${policy.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-5 w-5 text-gray-400" />
                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{policy.totalDays} days</TableCell>
                    <TableCell>
                      {policy.carryForward ? (
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Up to {policy.carryForwardLimit} days</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <X className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-gray-500">No</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {policy.requiresApproval ? (
                        <Badge variant="outline" className="border-blue-200 text-blue-700">Required</Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200">Not Required</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={policy.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(policy)}
                        data-testid={`edit-policy-${policy.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]" data-testid="policy-dialog">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Leave Policy' : 'Create New Leave Policy'}</DialogTitle>
            <DialogDescription>
              {editingPolicy ? 'Update leave policy configuration' : 'Define a new leave type and its rules'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select 
                  value={formData.leaveType} 
                  onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                  disabled={!!editingPolicy}
                >
                  <SelectTrigger data-testid="policy-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalDays">Total Days per Year *</Label>
                <Input
                  id="totalDays"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) })}
                  required
                  data-testid="policy-total-days-input"
                />
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="carryForward">Enable Carry Forward</Label>
                  <p className="text-xs text-gray-500">Allow unused leaves to be carried to next year</p>
                </div>
                <Switch
                  id="carryForward"
                  checked={formData.carryForward}
                  onCheckedChange={(checked) => setFormData({ ...formData, carryForward: checked })}
                  data-testid="policy-carry-forward-switch"
                />
              </div>
              {formData.carryForward && (
                <div className="space-y-2">
                  <Label htmlFor="carryForwardLimit">Carry Forward Limit (days)</Label>
                  <Input
                    id="carryForwardLimit"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.carryForwardLimit}
                    onChange={(e) => setFormData({ ...formData, carryForwardLimit: parseInt(e.target.value) })}
                    data-testid="policy-carry-limit-input"
                  />
                </div>
              )}
              <div className="flex items-center justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="requiresApproval">Requires Approval</Label>
                  <p className="text-xs text-gray-500">Manager approval needed for this leave type</p>
                </div>
                <Switch
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
                  data-testid="policy-approval-switch"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="policy-submit-button">
                {editingPolicy ? 'Update Policy' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeavePolicy;
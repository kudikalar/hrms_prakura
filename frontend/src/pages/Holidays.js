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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CalendarCheck, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadHolidays();
  }, [filterYear]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/admin/holidays?year=${filterYear}`, getAuthHeaders());
      setHolidays(response.data);
    } catch (error) {
      toast.error('Failed to load holidays');
    }
    setLoading(false);
  };

  const handleOpenDialog = (holiday = null) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: new Date(holiday.date).toISOString().split('T')[0],
        description: holiday.description || ''
      });
    } else {
      setEditingHoliday(null);
      setFormData({ name: '', date: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        await axios.put(
          `${API_URL}/api/v1/admin/holidays/${editingHoliday.id}`,
          formData,
          getAuthHeaders()
        );
        toast.success('Holiday updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/v1/admin/holidays`,
          formData,
          getAuthHeaders()
        );
        toast.success('Holiday created successfully');
      }
      setDialogOpen(false);
      loadHolidays();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await axios.delete(`${API_URL}/api/v1/admin/holidays/${id}`, getAuthHeaders());
        toast.success('Holiday deleted successfully');
        loadHolidays();
      } catch (error) {
        toast.error('Failed to delete holiday');
      }
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUpcomingHolidays = () => {
    const now = new Date();
    return holidays.filter(h => new Date(h.date) > now).length;
  };

  return (
    <div className="space-y-6" data-testid="holidays-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-500 mt-1">Manage company-wide holidays and observances</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" data-testid="add-holiday-button">
          <Plus className="mr-2 h-5 w-5" />
          Add Holiday
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{holidays.length}</div>
            <p className="text-xs text-gray-500 mt-1">{filterYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getUpcomingHolidays()}</div>
            <p className="text-xs text-gray-500 mt-1">This year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Year</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterYear.toString()} onValueChange={(val) => setFilterYear(parseInt(val))}>
              <SelectTrigger data-testid="year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Holidays Table */}
      <div className="data-table">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead>Holiday Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Description</TableHead>
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
            ) : holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No holidays found for {filterYear}
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday) => (
                <TableRow key={holiday.id} data-testid={`holiday-row-${holiday.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <CalendarCheck className="h-5 w-5 text-gray-400" />
                      <span>{holiday.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(holiday.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{holiday.description || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(holiday)}
                        data-testid={`edit-holiday-${holiday.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(holiday.id)}
                        data-testid={`delete-holiday-${holiday.id}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="holiday-dialog">
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
            <DialogDescription>
              {editingHoliday ? 'Update holiday information' : 'Add a new holiday to the calendar'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Holiday Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., New Year's Day, Independence Day"
                  data-testid="holiday-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  data-testid="holiday-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the holiday"
                  rows={3}
                  data-testid="holiday-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="holiday-submit-button">
                {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Holidays;
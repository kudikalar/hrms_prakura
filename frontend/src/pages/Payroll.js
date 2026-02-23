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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DollarSign, Calendar, Play, Download, Users } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalPaid: 0, employeeCount: 0 });
  const [loading, setLoading] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [processData, setProcessData] = useState({
    month: currentMonth,
    year: currentYear
  });

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadPayrollHistory();
  }, [filterMonth, filterYear]);

  const loadPayrollHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/admin/payroll/history?month=${filterMonth}&year=${filterYear}`,
        getAuthHeaders()
      );
      setPayrolls(response.data.payrolls);
      
      const totalPaid = response.data.payrolls.reduce((sum, p) => sum + p.netSalary, 0);
      setStats({
        total: response.data.total,
        totalPaid,
        employeeCount: response.data.payrolls.length
      });
    } catch (error) {
      toast.error('Failed to load payroll history');
    }
    setLoading(false);
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/admin/payroll/process`,
        processData,
        getAuthHeaders()
      );
      toast.success(response.data.message || 'Payroll processed successfully');
      setProcessDialogOpen(false);
      loadPayrollHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process payroll');
    }
  };

  const getMonthName = (monthNum) => {
    return months.find(m => m.value === monthNum)?.label || monthNum;
  };

  return (
    <div className="space-y-6" data-testid="payroll-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-500 mt-1">Process and manage employee salaries</p>
        </div>
        <Button onClick={() => setProcessDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="process-payroll-button">
          <Play className="mr-2 h-5 w-5" />
          Process Payroll
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{getMonthName(filterMonth)} {filterYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Employees Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.employeeCount}</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.employeeCount > 0 ? Math.round(stats.totalPaid / stats.employeeCount).toLocaleString() : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterMonth.toString()} onValueChange={(val) => setFilterMonth(parseInt(val))}>
          <SelectTrigger className="w-[180px]" data-testid="month-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(month => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear.toString()} onValueChange={(val) => setFilterYear(parseInt(val))}>
          <SelectTrigger className="w-[120px]" data-testid="year-filter">
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
      </div>

      {/* Payroll Table */}
      <div className="data-table">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>HRA</TableHead>
              <TableHead>Allowances</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Status</TableHead>
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
            ) : payrolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No payroll records found for this period
                </TableCell>
              </TableRow>
            ) : (
              payrolls.map((payroll) => (
                <TableRow key={payroll.id} data-testid={`payroll-row-${payroll.id}`}>
                  <TableCell className="font-medium">
                    {payroll.user?.firstName} {payroll.user?.lastName}
                  </TableCell>
                  <TableCell>${payroll.basicSalary.toLocaleString()}</TableCell>
                  <TableCell>${payroll.hra.toLocaleString()}</TableCell>
                  <TableCell>${payroll.allowances.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">-${payroll.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-green-600">${payroll.netSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payroll.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      payroll.status === 'PROCESSED' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {payroll.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Process Payroll Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" data-testid="process-payroll-dialog">
          <DialogHeader>
            <DialogTitle>Process Monthly Payroll</DialogTitle>
            <DialogDescription>
              Generate payroll for all active employees with salary
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcessPayroll}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month *</Label>
                <Select 
                  value={processData.month.toString()} 
                  onValueChange={(val) => setProcessData({ ...processData, month: parseInt(val) })}
                >
                  <SelectTrigger data-testid="process-month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Select 
                  value={processData.year.toString()} 
                  onValueChange={(val) => setProcessData({ ...processData, year: parseInt(val) })}
                >
                  <SelectTrigger data-testid="process-year-select">
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
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> This will calculate and generate payroll for all active employees.
                  Existing payroll for the same period will not be duplicated.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="process-submit-button">
                Process Payroll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
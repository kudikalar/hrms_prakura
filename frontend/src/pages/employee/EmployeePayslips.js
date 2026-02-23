import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeePayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    fetchPayslips();
  }, [selectedYear]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/employee/payslips?year=${selectedYear}`,
        getAuthHeaders()
      );
      setPayslips(response.data);
    } catch (error) {
      toast.error('Failed to fetch payslips');
    }
    setLoading(false);
  };

  const handleViewPayslip = async (payslipId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/employee/payslips/${payslipId}`,
        getAuthHeaders()
      );
      setSelectedPayslip(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load payslip details');
    }
  };

  const handleDownloadPayslip = (payslip) => {
    // Generate a simple text-based payslip for download
    const content = `
PAYSLIP - ${months[payslip.month - 1]} ${payslip.year}
========================================
Employee: ${payslip.user?.firstName} ${payslip.user?.lastName}
Department: ${payslip.user?.department?.name || 'N/A'}
Designation: ${payslip.user?.designation?.title || 'N/A'}

EARNINGS
--------
Basic Salary: $${payslip.basicSalary.toLocaleString()}
HRA: $${payslip.hra.toLocaleString()}
Allowances: $${payslip.allowances.toLocaleString()}

DEDUCTIONS
----------
PF: $${payslip.pf.toLocaleString()}
Tax: $${payslip.tax.toLocaleString()}
Other Deductions: $${payslip.deductions.toLocaleString()}

========================================
NET SALARY: $${payslip.netSalary.toLocaleString()}
========================================
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${months[payslip.month - 1]}-${payslip.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Payslip downloaded');
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      PROCESSING: 'bg-blue-100 text-blue-700'
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
  };

  const totalEarnings = payslips.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="space-y-6" data-testid="employee-payslips-page">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Earnings ({selectedYear})</p>
              <p className="text-3xl font-bold mt-1">${totalEarnings.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Payslips Generated</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{payslips.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Monthly</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${payslips.length > 0 ? Math.round(totalEarnings / payslips.length).toLocaleString() : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Payslip History
            </h3>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]" data-testid="year-select">
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Allowances</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
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
            ) : payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No payslips found for {selectedYear}
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((payslip) => (
                <TableRow key={payslip.id} data-testid={`payslip-row-${payslip.id}`}>
                  <TableCell className="font-medium">
                    {months[payslip.month - 1]} {payslip.year}
                  </TableCell>
                  <TableCell>${payslip.basicSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">
                    +${(payslip.hra + payslip.allowances).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-red-600">
                    -${(payslip.deductions + payslip.pf + payslip.tax).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-bold">${payslip.netSalary.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPayslip(payslip.id)}
                        data-testid={`view-payslip-${payslip.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPayslip(payslip)}
                        data-testid={`download-payslip-${payslip.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Payslip Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" data-testid="payslip-dialog">
          <DialogHeader>
            <DialogTitle>
              Payslip - {selectedPayslip && `${months[selectedPayslip.month - 1]} ${selectedPayslip.year}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayslip && (
            <div className="space-y-6 py-4">
              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Employee</p>
                <p className="font-semibold">{selectedPayslip.user?.firstName} {selectedPayslip.user?.lastName}</p>
                <p className="text-sm text-gray-600">
                  {selectedPayslip.user?.department?.name} • {selectedPayslip.user?.designation?.title}
                </p>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-green-700 flex items-center mb-3">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Earnings
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">${selectedPayslip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">HRA</span>
                    <span className="font-medium">${selectedPayslip.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-medium">${selectedPayslip.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-green-600">
                    <span>Total Earnings</span>
                    <span>${(selectedPayslip.basicSalary + selectedPayslip.hra + selectedPayslip.allowances).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-red-700 flex items-center mb-3">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Deductions
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Provident Fund (PF)</span>
                    <span className="font-medium">${selectedPayslip.pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${selectedPayslip.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Other Deductions</span>
                    <span className="font-medium">${selectedPayslip.deductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-red-600">
                    <span>Total Deductions</span>
                    <span>${(selectedPayslip.pf + selectedPayslip.tax + selectedPayslip.deductions).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                <span className="font-semibold text-lg">Net Salary</span>
                <span className="text-2xl font-bold text-blue-600">${selectedPayslip.netSalary.toLocaleString()}</span>
              </div>

              <Button
                onClick={() => handleDownloadPayslip(selectedPayslip)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Payslip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeePayslips;

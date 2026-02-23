import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '../components/ui/input';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Shield, Activity, LogIn, Search } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    loadAuditLogs();
    loadLoginLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      
      const response = await axios.get(
        `${API_URL}/api/v1/admin/audit/audit-logs?${params.toString()}`,
        getAuthHeaders()
      );
      setAuditLogs(response.data.logs);
    } catch (error) {
      toast.error('Failed to load audit logs');
    }
    setLoading(false);
  };

  const loadLoginLogs = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/admin/audit/login-logs?email=${searchTerm}`,
        getAuthHeaders()
      );
      setLoginLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to load login logs');
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm) loadLoginLogs();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
    loadAuditLogs();
  }, [entityFilter, actionFilter]);

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      UPDATE_STATUS: 'bg-orange-100 text-orange-700',
      PROCESS_PAYROLL: 'bg-purple-100 text-purple-700'
    };
    return <Badge className={colors[action] || 'bg-gray-100 text-gray-700'}>{action}</Badge>;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit & Security Logs</h1>
        <p className="text-gray-500 mt-1">Track all system activities and login attempts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold">{auditLogs.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Login Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <LogIn className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold">{loginLogs.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Security Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="text-3xl font-bold">High</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="login">Login Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]" data-testid="entity-filter">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Entities</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="DEPARTMENT">Department</SelectItem>
                <SelectItem value="DESIGNATION">Designation</SelectItem>
                <SelectItem value="LEAVE_POLICY">Leave Policy</SelectItem>
                <SelectItem value="PAYROLL">Payroll</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]" data-testid="action-filter">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="data-table">
            <Table>
              <TableHeader className="table-header">
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
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
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`audit-log-${log.id}`}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <span className="font-medium">{log.entity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{log.userId || 'System'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{log.ipAddress || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDate(log.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="login" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
              data-testid="login-search-input"
            />
          </div>

          <div className="data-table">
            <Table>
              <TableHeader className="table-header">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No login logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  loginLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`login-log-${log.id}`}>
                      <TableCell className="font-medium">{log.email}</TableCell>
                      <TableCell>
                        <Badge className={log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{log.ipAddress || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 truncate max-w-xs">
                          {log.userAgent ? log.userAgent.substring(0, 50) + '...' : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDate(log.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditLogs;
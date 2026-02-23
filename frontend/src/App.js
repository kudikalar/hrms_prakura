import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Designations from './pages/Designations';
import LeavePolicy from './pages/LeavePolicy';
import Payroll from './pages/Payroll';
import Holidays from './pages/Holidays';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import CompanySettings from './pages/CompanySettings';
import EmployeeLifecycle from './pages/EmployeeLifecycle';
import {
  EmployeeDashboard,
  EmployeeProfile,
  EmployeeAttendance,
  EmployeeLeave,
  EmployeePayslips,
  EmployeeHolidays,
  EmployeeTimeline
} from './pages/employee';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  const { token, user } = useSelector((state) => state.auth);
  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const isEmployee = user?.role === 'EMPLOYEE';

  // Determine default redirect path based on role
  const getDefaultPath = () => {
    if (!isAuthenticated) return '/login';
    if (isAdmin) return '/admin';
    return '/employee';
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getDefaultPath()} />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={getDefaultPath()} />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            isAuthenticated && isAdmin ? (
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/designations" element={<Designations />} />
                  <Route path="/leave-policy" element={<LeavePolicy />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/holidays" element={<Holidays />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/company" element={<CompanySettings />} />
                  <Route path="/lifecycle" element={<EmployeeLifecycle />} />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee/*"
          element={
            isAuthenticated ? (
              <EmployeeLayout>
                <Routes>
                  <Route path="/" element={<EmployeeDashboard />} />
                  <Route path="/profile" element={<EmployeeProfile />} />
                  <Route path="/attendance" element={<EmployeeAttendance />} />
                  <Route path="/leave" element={<EmployeeLeave />} />
                  <Route path="/payslips" element={<EmployeePayslips />} />
                  <Route path="/holidays" element={<EmployeeHolidays />} />
                  <Route path="/timeline" element={<EmployeeTimeline />} />
                </Routes>
              </EmployeeLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        
        <Route path="/" element={<Navigate to={getDefaultPath()} />} />
        <Route path="*" element={<Navigate to={getDefaultPath()} />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;

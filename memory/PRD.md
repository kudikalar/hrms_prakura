# Prakura HRMS - Product Requirements Document

## Original Problem Statement
Build a production-ready, enterprise-grade HRMS Admin Module for a company named "Prakura HRMS".

## Technology Stack
- **Backend:** Node.js + Express, Prisma ORM, PostgreSQL Database
- **Frontend:** React + TailwindCSS, Redux Toolkit for state management
- **Authentication:** JWT + bcrypt
- **Validation:** Zod
- **Security:** Helmet, Rate Limiting, CORS
- **Deployment:** Docker ready, with CI/CD scripts (GitHub Actions)
- **Architecture:** SaaS-ready multi-tenant architecture

## Core Modules

### 1. Company Management
- Create/update company profile, logo, working hours, timezone, financial year
- Status: Implemented

### 2. User Management
- CRUD for HR/Employee
- Role assignment (SUPER_ADMIN, ADMIN, HR, EMPLOYEE)
- Fields: First Name, Last Name, Email, Password, Role, Phone, Salary
- **Enhanced Fields:** Date of Joining, Department, Designation
- Search, filter, pagination
- Status: Implemented

### 3. Department Management
- CRUD operations
- Assign department head
- Status: Implemented

### 4. Designation Management
- CRUD operations
- Link to department
- Status: Implemented

### 5. Leave Policy Management
- Create leave types (Sick, Casual, Earned, Maternity, Paternity, Unpaid)
- Define limits, carry-forward rules
- Status: Implemented

### 6. Payroll Configuration
- Define salary components
- Generate payslips
- Status: Implemented

### 7. Holiday Calendar
- Add/edit holidays
- Year-wise view
- Status: Implemented

### 8. Reports Dashboard
- Widgets for key metrics
- Status: Implemented

### 9. Audit & Security
- Login/activity logs
- Role permissions
- Status: Implemented

### 10. Employee Lifecycle Management
- Track complete employment journey from joining to exit
- Department, Designation, DOJ, Tenure tracking
- Timeline view for each employee
- Exit management (Resigned, Terminated, Contract End)
- Status: Implemented

### 11. GitHub Actions CI/CD
- Single workflow for frontend and backend deployment
- Health checks, rollback capability
- Status: Implemented

### 12. Employee Portal (NEW - Implemented 2026-02-23)
- **Employee Dashboard:** Welcome section, attendance card, leave balance, profile summary
- **My Profile:** View/edit personal info, employment details, change password
- **Attendance:** Clock In/Out functionality, monthly attendance history, summary stats
- **Leave Management:** View leave balance by type, apply for leave, track request status
- **Payslips:** View monthly payslips, download functionality, earnings summary
- **Holidays:** Company holiday calendar, upcoming holidays
- **My Timeline:** Employment journey visualization, career milestones
- Role-based routing: Admins → /admin, Employees → /employee
- Status: Implemented

## Database Schema (Key Models)
- User (with dateOfJoining, departmentId, designationId, employmentStatus, exitDate, exitType)
- Company
- Department
- Designation
- LeavePolicy
- Leave (employee leave requests)
- Attendance (clock in/out records)
- Payroll
- Holiday
- EmploymentHistory
- AuditLog
- LoginLog

## API Endpoints

### Admin APIs
- `/api/v1/auth/login` - Authentication
- `/api/v1/auth/register` - Company/User registration
- `/api/v1/admin/users` - User CRUD
- `/api/v1/admin/departments` - Department CRUD
- `/api/v1/admin/designations` - Designation CRUD
- `/api/v1/admin/leave-policy` - Leave policies
- `/api/v1/admin/payroll` - Payroll management
- `/api/v1/admin/holidays` - Holiday calendar
- `/api/v1/admin/reports` - Reports
- `/api/v1/admin/audit` - Audit logs
- `/api/v1/admin/company` - Company settings
- `/api/v1/admin/lifecycle` - Employee lifecycle

### Employee APIs (NEW)
- `/api/v1/employee/dashboard` - Dashboard summary data
- `/api/v1/employee/profile` - Get/Update profile
- `/api/v1/employee/change-password` - Change password
- `/api/v1/employee/attendance/today` - Today's attendance status
- `/api/v1/employee/attendance/clock-in` - Clock in
- `/api/v1/employee/attendance/clock-out` - Clock out
- `/api/v1/employee/attendance/history` - Attendance history
- `/api/v1/employee/leave/balance` - Leave balance by type
- `/api/v1/employee/leave/apply` - Apply for leave
- `/api/v1/employee/leave/requests` - Get leave requests
- `/api/v1/employee/payslips` - Get payslips
- `/api/v1/employee/holidays` - Company holidays
- `/api/v1/employee/timeline` - Employment timeline

## Completed Features

### Session 1 (2026-02-23)
1. Fixed PostgreSQL connectivity (installed and configured locally)
2. Fixed Employee Lifecycle page - now loads and displays all employee data
3. Fixed User Management page - now loads and displays users
4. Enhanced User Management form with DOJ, Department, Designation fields
5. Data synchronization between User Management and Employee Lifecycle
6. Employment history tracking when users are created/updated

### Session 2 (2026-02-23)
7. **Complete Employee Portal Implementation:**
   - Employee Dashboard with clock in/out, leave balance, profile summary
   - My Profile page with personal info and employment details
   - Attendance page with clock in/out and history
   - Leave Management with balance cards and request tracking
   - Payslips page with view and download
   - Holidays page with company holiday calendar
   - My Timeline with employment journey visualization
   - Role-based routing (admins → /admin, employees → /employee)
8. All backend APIs verified (100% test pass rate - 22/22 tests)
9. All frontend features verified (7 employee pages working)

## Test Credentials
- **Admin:** admin@prakura.com / password123
- **Employee:** jane@prakura.com / password123

## Future Enhancements (Backlog)
1. Bulk user upload via CSV
2. Export functionality (PDF, Excel)
3. Advanced reporting with charts
4. Email notifications for leave approval
5. Mobile responsive improvements
6. IP whitelisting feature
7. Manual backup functionality
8. Employee self-service leave approval workflow
9. Payslip PDF generation with company branding

## Deployment Notes
- PostgreSQL must be running: `sudo /etc/init.d/postgresql start`
- Backend runs on port 8001 internally
- Frontend runs on port 3000 internally
- Preview URL: https://prakura-hrms-admin.preview.emergentagent.com

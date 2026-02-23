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

## Database Schema (Key Models)
- User (with dateOfJoining, departmentId, designationId, employmentStatus, exitDate, exitType)
- Company
- Department
- Designation
- LeavePolicy
- Payroll
- EmploymentHistory
- AuditLog
- LoginLog

## API Endpoints
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

## Completed Features (2026-02-23)
1. Fixed PostgreSQL connectivity (installed and configured locally)
2. Fixed Employee Lifecycle page - now loads and displays all employee data
3. Fixed User Management page - now loads and displays users
4. Enhanced User Management form with DOJ, Department, Designation fields
5. Data synchronization between User Management and Employee Lifecycle
6. Employment history tracking when users are created/updated
7. All backend APIs verified (100% test pass rate)
8. All frontend features verified

## Test Credentials
- Email: admin@prakura.com
- Password: password123

## Future Enhancements (Backlog)
1. Bulk user upload via CSV
2. Export functionality (PDF, Excel)
3. Advanced reporting with charts
4. Email notifications for leave approval
5. Employee self-service portal
6. Mobile responsive improvements
7. IP whitelisting feature
8. Manual backup functionality

## Deployment Notes
- PostgreSQL must be running: `sudo /etc/init.d/postgresql start`
- Backend runs on port 8001 internally
- Frontend runs on port 3000 internally
- Preview URL: https://prakura-hrms-admin.preview.emergentagent.com

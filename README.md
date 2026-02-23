# Prakura HRMS - Enterprise Admin Module

**Production-ready, SaaS-enabled HRMS Admin Panel**

## 🚀 Technology Stack

### Backend
- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Validation:** Zod
- **Security:** Helmet, Rate Limiting, CORS
- **Logging:** Winston

### Frontend
- **Framework:** React 19
- **State Management:** Redux Toolkit
- **Routing:** React Router v7
- **UI Components:** Shadcn/UI (Radix UI)
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Notifications:** Sonner

## ✨ Key Features Implemented

### 1. Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (SUPER_ADMIN, ADMIN, HR, EMPLOYEE)
- ✅ Secure password hashing with bcrypt
- ✅ Login/Register flows
- ✅ Session management

### 2. User Management
- ✅ Create, Read, Update, Delete users
- ✅ Role assignment (Admin, HR, Employee)
- ✅ Status management (Active, Inactive, Suspended)
- ✅ Search and filter functionality
- ✅ Pagination
- ✅ Salary management

### 3. Dashboard & Analytics
- ✅ Real-time statistics
  - Total Employees
  - Active/Inactive breakdown
  - Department count
  - Leave statistics
  - Payroll summary
- ✅ Department distribution pie chart
- ✅ Leave summary bar chart

### 4. Department Management
- ✅ API endpoints ready
- ✅ CRUD operations
- 🔄 Frontend UI (placeholder - ready for implementation)

### 5. Designation Management
- ✅ API endpoints ready
- ✅ Salary band configuration
- 🔄 Frontend UI (placeholder - ready for implementation)

### 6. Leave Policy Management
- ✅ API endpoints ready
- ✅ Leave types (Sick, Casual, Earned, Maternity, Paternity, Unpaid)
- ✅ Carry forward rules
- 🔄 Frontend UI (placeholder - ready for implementation)

### 7. Payroll Management
- ✅ Monthly payroll processing
- ✅ Salary components (Basic, HRA, Allowances, PF, Tax)
- ✅ Payroll history
- ✅ Employee-wise payroll reports
- 🔄 Frontend UI (placeholder - ready for implementation)

### 8. Holiday Calendar
- ✅ API endpoints ready
- ✅ Year-wise holiday management
- 🔄 Frontend UI (placeholder - ready for implementation)

### 9. Reports & Analytics
- ✅ Dashboard statistics
- ✅ Attendance reports
- ✅ Payroll reports
- ✅ Leave reports
- 🔄 Advanced reporting UI (placeholder)

### 10. Audit & Security
- ✅ Audit logs for all critical actions
- ✅ Login logs with IP tracking
- ✅ Activity tracking
- 🔄 Frontend UI (placeholder - ready for implementation)

### 11. Company Settings
- ✅ API endpoints ready
- ✅ Company profile management
- ✅ Working hours configuration
- ✅ Timezone settings
- 🔄 Frontend UI (placeholder - ready for implementation)

## 🏗️ SaaS-Ready Architecture

- **Multi-tenancy:** Every table includes `companyId` for data isolation
- **Company Onboarding:** Registration creates company + super admin
- **Scalable:** Designed for multiple companies on single infrastructure
- **Role Hierarchy:** SUPER_ADMIN → ADMIN → HR → EMPLOYEE

## 📦 Installation & Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Yarn package manager

### Backend Setup

```bash
# Navigate to backend
cd /app/backend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the server
node src/index.js
```

### Frontend Setup

```bash
# Navigate to frontend
cd /app/frontend

# Install dependencies
yarn install

# Configure environment
# Update REACT_APP_BACKEND_URL in .env

# Start development server
yarn start
```

## 🔐 Default Credentials

After registration, use your created credentials. Example test account:
- **Email:** admin@prakura.com
- **Password:** admin123

## 📡 API Endpoints

### Authentication
```
POST /api/v1/auth/register      - Register new company
POST /api/v1/auth/login         - User login
POST /api/v1/auth/reset-password - Reset password
```

### User Management (Admin Only)
```
GET    /api/v1/admin/users           - List all users
POST   /api/v1/admin/users           - Create user
PUT    /api/v1/admin/users/:id       - Update user
PATCH  /api/v1/admin/users/:id/status - Update status
DELETE /api/v1/admin/users/:id       - Delete user
```

### Dashboard & Reports
```
GET /api/v1/admin/reports/dashboard   - Dashboard stats
GET /api/v1/admin/reports/attendance  - Attendance report
GET /api/v1/admin/reports/payroll     - Payroll report
GET /api/v1/admin/reports/leave       - Leave report
```

### Departments
```
GET    /api/v1/admin/departments     - List departments
POST   /api/v1/admin/departments     - Create department
PUT    /api/v1/admin/departments/:id - Update department
DELETE /api/v1/admin/departments/:id - Delete department
```

### Payroll
```
POST /api/v1/admin/payroll/process      - Process monthly payroll
GET  /api/v1/admin/payroll/history      - Payroll history
GET  /api/v1/admin/payroll/:employeeId  - Employee payroll
```

### Audit Logs
```
GET /api/v1/admin/audit/audit-logs  - Audit logs
GET /api/v1/admin/audit/login-logs  - Login logs
```

## 🎨 UI/UX Design

- **Design System:** Clean professional enterprise dashboard
- **Color Scheme:** Blue primary (#3b82f6) with complementary colors
- **Typography:** Manrope for headings, Work Sans for body text
- **Layout:** Fixed sidebar navigation with top header
- **Responsive:** Mobile-friendly design
- **Components:** Reusable Shadcn/UI components

## 🔒 Security Features

1. **Authentication:** JWT tokens with secure storage
2. **Password Security:** bcrypt hashing with salt rounds
3. **Rate Limiting:** 100 requests per 15 minutes per IP
4. **CORS:** Configured for production
5. **Helmet:** Security headers enabled
6. **Input Validation:** Zod schema validation
7. **SQL Injection Prevention:** Prisma ORM with parameterized queries
8. **Audit Logging:** All critical actions logged

## 📊 Database Schema

**Core Tables:**
- `companies` - Multi-tenant company data
- `users` - User accounts with roles
- `departments` - Organizational departments
- `designations` - Job titles and salary bands
- `leave_policies` - Leave type configurations
- `leaves` - Leave applications
- `payrolls` - Payroll records
- `attendance` - Attendance tracking
- `holidays` - Company holidays
- `audit_logs` - System audit trail
- `login_logs` - Authentication logs

## 🚀 Deployment

### Production Checklist

- [ ] Update JWT_SECRET in production .env
- [ ] Configure production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Run security audit

## 📈 Roadmap

### Phase 2 - Full Feature Implementation
- [ ] Complete Department Management UI
- [ ] Complete Designation Management UI
- [ ] Complete Leave Policy Management UI
- [ ] Complete Payroll Processing UI
- [ ] Complete Holiday Calendar UI
- [ ] Complete Audit Logs UI
- [ ] Complete Company Settings UI

### Phase 3 - Advanced Features
- [ ] Bulk user upload via Excel
- [ ] PDF payslip generation
- [ ] Email notifications
- [ ] Advanced reporting & exports
- [ ] Role permission matrix
- [ ] IP whitelisting
- [ ] Two-factor authentication
- [ ] Mobile app

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:8001/api/health

# Test registration
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","companyName":"Test Company"}'

# Test login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 📝 License

Proprietary - Prakura Technologies

## 👥 Team

**Built with Emergent AI Agent Platform**
- Enterprise-grade HRMS solution
- Production-ready architecture
- SaaS-enabled multi-tenancy

---

**Version:** 1.0.0  
**Last Updated:** February 2026

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, hrMiddleware } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// All HR routes require authentication and HR/Admin role
router.use(authMiddleware);
router.use(hrMiddleware);

// ==================== HR DASHBOARD ====================

// Get HR Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Pending leave requests
    const pendingLeaves = await prisma.leave.count({
      where: {
        status: 'PENDING',
        user: { companyId: req.companyId }
      }
    });

    // Today's attendance stats
    const todayAttendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: today,
        user: { companyId: req.companyId }
      },
      _count: true
    });

    // Total employees
    const totalEmployees = await prisma.user.count({
      where: { companyId: req.companyId, status: 'ACTIVE' }
    });

    // Employees on leave today
    const onLeaveToday = await prisma.leave.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
        user: { companyId: req.companyId }
      }
    });

    // Pending onboarding
    const pendingOnboarding = await prisma.onboarding.count({
      where: {
        companyId: req.companyId,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] }
      }
    });

    // New joiners this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const newJoiners = await prisma.user.count({
      where: {
        companyId: req.companyId,
        dateOfJoining: { gte: monthStart }
      }
    });

    // Upcoming birthdays (next 7 days) - Using dateOfJoining as placeholder
    // In production, add a dateOfBirth field to User model

    // Recent leave requests
    const recentLeaveRequests = await prisma.leave.findMany({
      where: {
        user: { companyId: req.companyId }
      },
      include: {
        user: { select: { firstName: true, lastName: true, department: true } },
        policy: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Attendance summary
    const attendanceStats = {
      present: todayAttendance.find(a => a.status === 'PRESENT')?._count || 0,
      absent: totalEmployees - (todayAttendance.find(a => a.status === 'PRESENT')?._count || 0) - onLeaveToday,
      onLeave: onLeaveToday,
      total: totalEmployees
    };

    res.json({
      pendingLeaves,
      pendingOnboarding,
      newJoiners,
      totalEmployees,
      attendanceStats,
      recentLeaveRequests
    });
  } catch (error) {
    logger.error('HR Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ==================== LEAVE APPROVAL ====================

// Get All Leave Requests (for HR approval)
router.get('/leaves', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      user: { companyId: req.companyId }
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              designation: true
            }
          },
          policy: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.leave.count({ where })
    ]);

    res.json({
      leaves,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Approve/Reject Leave
router.put('/leaves/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const leave = await prisma.leave.update({
      where: { id },
      data: {
        status,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        reason: comments ? `${req.body.reason || ''}\n\nHR Comments: ${comments}` : undefined
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        policy: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: status === 'APPROVED' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
        entity: 'LEAVE',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json(leave);
  } catch (error) {
    logger.error('Update leave status error:', error);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// Get Leave Calendar (who's on leave when)
router.get('/leaves/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const leaves = await prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        user: { companyId: req.companyId },
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          { AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }] }
        ]
      },
      include: {
        user: { select: { firstName: true, lastName: true, department: true } },
        policy: true
      },
      orderBy: { startDate: 'asc' }
    });

    res.json(leaves);
  } catch (error) {
    logger.error('Get leave calendar error:', error);
    res.status(500).json({ error: 'Failed to fetch leave calendar' });
  }
});

// ==================== ATTENDANCE MANAGEMENT ====================

// Get All Employees Attendance
router.get('/attendance', async (req, res) => {
  try {
    const { date, departmentId, page = 1, limit = 50 } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const userWhere = { companyId: req.companyId, status: 'ACTIVE' };
    if (departmentId) {
      userWhere.departmentId = departmentId;
    }

    // Get all employees with their attendance for the date
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        include: {
          department: true,
          designation: true,
          attendance: {
            where: { date: targetDate }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }]
      }),
      prisma.user.count({ where: userWhere })
    ]);

    // Format response
    const attendanceData = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      department: emp.department?.name || 'N/A',
      designation: emp.designation?.title || 'N/A',
      attendance: emp.attendance[0] || null
    }));

    res.json({
      date: targetDate,
      attendance: attendanceData,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Mark Attendance for Employee
router.post('/attendance/mark', async (req, res) => {
  try {
    const { userId, date, status, checkIn, checkOut } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: { userId, date: targetDate }
      },
      create: {
        userId,
        date: targetDate,
        status: status || 'PRESENT',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        hoursWorked: checkIn && checkOut 
          ? (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60) 
          : 0
      },
      update: {
        status: status || 'PRESENT',
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        hoursWorked: checkIn && checkOut 
          ? (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60) 
          : undefined
      }
    });

    res.json(attendance);
  } catch (error) {
    logger.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Bulk Mark Attendance
router.post('/attendance/bulk-mark', async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ userId, status, checkIn, checkOut }]
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      records.map(async (record) => {
        return prisma.attendance.upsert({
          where: {
            userId_date: { userId: record.userId, date: targetDate }
          },
          create: {
            userId: record.userId,
            date: targetDate,
            status: record.status || 'PRESENT',
            checkIn: record.checkIn ? new Date(record.checkIn) : null,
            checkOut: record.checkOut ? new Date(record.checkOut) : null
          },
          update: {
            status: record.status || 'PRESENT',
            checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
            checkOut: record.checkOut ? new Date(record.checkOut) : undefined
          }
        });
      })
    );

    res.json({ message: `${results.length} records updated`, results });
  } catch (error) {
    logger.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Failed to bulk mark attendance' });
  }
});

// Get Attendance Report
router.get('/attendance/report', async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const userWhere = { companyId: req.companyId, status: 'ACTIVE' };
    if (departmentId) {
      userWhere.departmentId = departmentId;
    }

    const employees = await prisma.user.findMany({
      where: userWhere,
      include: {
        department: true,
        attendance: {
          where: {
            date: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    // Calculate working days in month (excluding weekends)
    let workingDays = 0;
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const report = employees.map(emp => {
      const present = emp.attendance.filter(a => a.status === 'PRESENT').length;
      const absent = emp.attendance.filter(a => a.status === 'ABSENT').length;
      const late = emp.attendance.filter(a => a.status === 'LATE').length;
      const halfDay = emp.attendance.filter(a => a.status === 'HALF_DAY').length;
      const totalHours = emp.attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'N/A',
        present,
        absent,
        late,
        halfDay,
        totalHours: Math.round(totalHours * 10) / 10,
        workingDays,
        attendancePercentage: Math.round((present / workingDays) * 100)
      };
    });

    res.json({
      month: targetMonth + 1,
      year: targetYear,
      workingDays,
      report
    });
  } catch (error) {
    logger.error('Get attendance report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ==================== ONBOARDING MANAGEMENT ====================

// Get All Onboardings
router.get('/onboarding', async (req, res) => {
  try {
    const { status } = req.query;

    const where = { companyId: req.companyId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const onboardings = await prisma.onboarding.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            designation: true,
            dateOfJoining: true
          }
        },
        tasks: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(onboardings);
  } catch (error) {
    logger.error('Get onboardings error:', error);
    res.status(500).json({ error: 'Failed to fetch onboardings' });
  }
});

// Create Onboarding for New Employee
router.post('/onboarding', async (req, res) => {
  try {
    const { userId, tasks } = req.body;

    // Check if user exists and doesn't have onboarding
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.companyId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingOnboarding = await prisma.onboarding.findUnique({
      where: { userId }
    });

    if (existingOnboarding) {
      return res.status(400).json({ error: 'Onboarding already exists for this user' });
    }

    // Default onboarding tasks if not provided
    const defaultTasks = tasks || [
      { taskName: 'Submit ID Proof', category: 'DOCUMENTS', order: 1 },
      { taskName: 'Submit Address Proof', category: 'DOCUMENTS', order: 2 },
      { taskName: 'Submit Educational Certificates', category: 'DOCUMENTS', order: 3 },
      { taskName: 'Submit Previous Employment Documents', category: 'DOCUMENTS', order: 4 },
      { taskName: 'Bank Account Details', category: 'DOCUMENTS', order: 5 },
      { taskName: 'Laptop/System Setup', category: 'IT_SETUP', order: 6 },
      { taskName: 'Email Account Creation', category: 'IT_SETUP', order: 7 },
      { taskName: 'Access Card/Badge', category: 'IT_SETUP', order: 8 },
      { taskName: 'Software Installation', category: 'IT_SETUP', order: 9 },
      { taskName: 'Company Policy Training', category: 'TRAINING', order: 10 },
      { taskName: 'Department Orientation', category: 'TRAINING', order: 11 },
      { taskName: 'HR Policy Acknowledgment', category: 'COMPLIANCE', order: 12 },
      { taskName: 'NDA Signing', category: 'COMPLIANCE', order: 13 }
    ];

    const onboarding = await prisma.onboarding.create({
      data: {
        userId,
        companyId: req.companyId,
        status: 'IN_PROGRESS',
        startDate: new Date(),
        assignedHrId: req.user.id,
        tasks: {
          create: defaultTasks
        }
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        tasks: { orderBy: { order: 'asc' } }
      }
    });

    res.status(201).json(onboarding);
  } catch (error) {
    logger.error('Create onboarding error:', error);
    res.status(500).json({ error: 'Failed to create onboarding' });
  }
});

// Update Onboarding Task
router.put('/onboarding/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { isCompleted } = req.body;

    const task = await prisma.onboardingTask.update({
      where: { id: taskId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy: isCompleted ? req.user.id : null
      }
    });

    // Check if all tasks are completed
    const onboarding = await prisma.onboarding.findFirst({
      where: { tasks: { some: { id: taskId } } },
      include: { tasks: true }
    });

    if (onboarding) {
      const allCompleted = onboarding.tasks.every(t => t.id === taskId ? isCompleted : t.isCompleted);
      if (allCompleted) {
        await prisma.onboarding.update({
          where: { id: onboarding.id },
          data: { status: 'COMPLETED', completedDate: new Date() }
        });
      } else if (onboarding.status === 'COMPLETED') {
        await prisma.onboarding.update({
          where: { id: onboarding.id },
          data: { status: 'IN_PROGRESS', completedDate: null }
        });
      }
    }

    res.json(task);
  } catch (error) {
    logger.error('Update onboarding task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Get Single Onboarding Details
router.get('/onboarding/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const onboarding = await prisma.onboarding.findFirst({
      where: { id, companyId: req.companyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: true,
            designation: true,
            dateOfJoining: true
          }
        },
        tasks: { orderBy: { order: 'asc' } }
      }
    });

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding not found' });
    }

    res.json(onboarding);
  } catch (error) {
    logger.error('Get onboarding error:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding' });
  }
});

// ==================== EMPLOYEE DIRECTORY ====================

// Get Employee Directory
router.get('/directory', async (req, res) => {
  try {
    const { search, departmentId, status = 'ACTIVE', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { companyId: req.companyId };
    
    if (status !== 'ALL') {
      where.status = status;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          dateOfJoining: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } }
        },
        orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }],
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      employees,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get directory error:', error);
    res.status(500).json({ error: 'Failed to fetch directory' });
  }
});

// Get Organization Chart Data
router.get('/org-chart', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { companyId: req.companyId, isActive: true },
      include: {
        users: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            designation: { select: { title: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Format for org chart
    const orgChart = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      headId: dept.headId,
      employees: dept.users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        designation: u.designation?.title || 'N/A'
      })),
      employeeCount: dept.users.length
    }));

    res.json(orgChart);
  } catch (error) {
    logger.error('Get org chart error:', error);
    res.status(500).json({ error: 'Failed to fetch org chart' });
  }
});

// Get Employee Quick Profile
router.get('/directory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.user.findFirst({
      where: { id, companyId: req.companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        dateOfJoining: true,
        employmentStatus: true,
        department: true,
        designation: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 5
        },
        leaves: {
          where: { status: 'APPROVED' },
          orderBy: { startDate: 'desc' },
          take: 3,
          include: { policy: true }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    logger.error('Get employee profile error:', error);
    res.status(500).json({ error: 'Failed to fetch employee profile' });
  }
});

module.exports = router;

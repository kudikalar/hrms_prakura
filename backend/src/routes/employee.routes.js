const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { authMiddleware } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// All employee routes require authentication
router.use(authMiddleware);

// ==================== PROFILE ====================

// Get Employee Profile
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        department: true,
        designation: true,
        company: {
          select: { id: true, name: true, logo: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Employee Profile
router.put('/profile', async (req, res) => {
  try {
    const { phone, address, emergencyContact, emergencyPhone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        phone,
        // Store additional info in a JSON field or extend schema
      },
      include: {
        department: true,
        designation: true
      }
    });

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== ATTENDANCE ====================

// Clock In
router.post('/attendance/clock-in', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        date: today
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today
        }
      },
      create: {
        userId: req.user.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT'
      },
      update: {
        checkIn: new Date(),
        status: 'PRESENT'
      }
    });

    res.json(attendance);
  } catch (error) {
    logger.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock Out
router.post('/attendance/clock-out', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        date: today
      }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ error: 'Please clock in first' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }

    const checkOut = new Date();
    const hoursWorked = (checkOut - new Date(attendance.checkIn)) / (1000 * 60 * 60);

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100
      }
    });

    res.json(updatedAttendance);
  } catch (error) {
    logger.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Get Today's Attendance Status
router.get('/attendance/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        date: today
      }
    });

    res.json(attendance || { status: 'NOT_MARKED' });
  } catch (error) {
    logger.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get Attendance History
router.get('/attendance/history', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const attendance = await prisma.attendance.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate summary
    const summary = {
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0)
    };

    res.json({ attendance, summary });
  } catch (error) {
    logger.error('Get attendance history error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// ==================== LEAVE ====================

// Get Leave Balance
router.get('/leave/balance', async (req, res) => {
  try {
    const policies = await prisma.leavePolicy.findMany({
      where: {
        companyId: req.companyId,
        isActive: true
      }
    });

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const usedLeaves = await prisma.leave.groupBy({
      by: ['policyId'],
      where: {
        userId: req.user.id,
        status: 'APPROVED',
        startDate: { gte: startOfYear },
        endDate: { lte: endOfYear }
      },
      _sum: {
        days: true
      }
    });

    const usedMap = usedLeaves.reduce((acc, item) => {
      acc[item.policyId] = item._sum.days || 0;
      return acc;
    }, {});

    const balance = policies.map(policy => ({
      id: policy.id,
      leaveType: policy.leaveType,
      totalDays: policy.totalDays,
      usedDays: usedMap[policy.id] || 0,
      remainingDays: policy.totalDays - (usedMap[policy.id] || 0),
      carryForward: policy.carryForward
    }));

    res.json(balance);
  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// Apply for Leave
router.post('/leave/apply', async (req, res) => {
  try {
    const { policyId, startDate, endDate, reason } = req.body;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const policy = await prisma.leavePolicy.findUnique({
      where: { id: policyId }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Leave policy not found' });
    }

    const currentYear = new Date().getFullYear();
    const usedLeaves = await prisma.leave.aggregate({
      where: {
        userId: req.user.id,
        policyId,
        status: 'APPROVED',
        startDate: { gte: new Date(currentYear, 0, 1) }
      },
      _sum: { days: true }
    });

    const usedDays = usedLeaves._sum.days || 0;
    if (usedDays + days > policy.totalDays) {
      return res.status(400).json({ error: 'Insufficient leave balance' });
    }

    const leave = await prisma.leave.create({
      data: {
        userId: req.user.id,
        policyId,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: policy.requiresApproval ? 'PENDING' : 'APPROVED'
      },
      include: { policy: true }
    });

    res.status(201).json(leave);
  } catch (error) {
    logger.error('Apply leave error:', error);
    res.status(500).json({ error: 'Failed to apply for leave' });
  }
});

// Get My Leave Requests
router.get('/leave/requests', async (req, res) => {
  try {
    const { status, year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const where = {
      userId: req.user.id,
      startDate: {
        gte: new Date(targetYear, 0, 1),
        lte: new Date(targetYear, 11, 31, 23, 59, 59)
      }
    };

    if (status) {
      where.status = status;
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: { policy: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leaves);
  } catch (error) {
    logger.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Cancel Leave Request
router.delete('/leave/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status === 'APPROVED' && new Date(leave.startDate) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel approved leave that has started' });
    }

    await prisma.leave.delete({ where: { id } });
    res.json({ message: 'Leave request cancelled' });
  } catch (error) {
    logger.error('Cancel leave error:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

// ==================== PAYSLIPS ====================

// Get My Payslips
router.get('/payslips', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const payslips = await prisma.payroll.findMany({
      where: {
        userId: req.user.id,
        year: targetYear
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(payslips);
  } catch (error) {
    logger.error('Get payslips error:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// Get Single Payslip
router.get('/payslips/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payroll.findFirst({
      where: { id, userId: req.user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            designation: true
          }
        },
        company: {
          select: { name: true, logo: true }
        }
      }
    });

    if (!payslip) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    res.json(payslip);
  } catch (error) {
    logger.error('Get payslip error:', error);
    res.status(500).json({ error: 'Failed to fetch payslip' });
  }
});

// ==================== HOLIDAYS ====================

// Get Company Holidays
router.get('/holidays', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const holidays = await prisma.holiday.findMany({
      where: {
        companyId: req.companyId,
        isActive: true,
        date: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json(holidays);
  } catch (error) {
    logger.error('Get holidays error:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// ==================== TIMELINE ====================

// Get My Employment Timeline
router.get('/timeline', async (req, res) => {
  try {
    const history = await prisma.employmentHistory.findMany({
      where: { employeeId: req.user.id },
      orderBy: { effectiveDate: 'desc' }
    });

    res.json(history);
  } catch (error) {
    logger.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// ==================== ANNOUNCEMENTS ====================

// Get Company Announcements (using audit log or separate model)
router.get('/announcements', async (req, res) => {
  try {
    // For now, return recent company-wide events
    // In production, create a separate Announcement model
    const announcements = await prisma.auditLog.findMany({
      where: {
        companyId: req.companyId,
        entity: { in: ['ANNOUNCEMENT', 'COMPANY', 'HOLIDAY'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(announcements);
  } catch (error) {
    logger.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// ==================== DASHBOARD STATS ====================

// Get Dashboard Summary
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Today's attendance
    const todayAttendance = await prisma.attendance.findFirst({
      where: { userId: req.user.id, date: today }
    });

    // Leave balance summary
    const policies = await prisma.leavePolicy.findMany({
      where: { companyId: req.companyId, isActive: true }
    });

    const usedLeaves = await prisma.leave.groupBy({
      by: ['policyId'],
      where: {
        userId: req.user.id,
        status: 'APPROVED',
        startDate: { gte: new Date(currentYear, 0, 1) }
      },
      _sum: { days: true }
    });

    const usedMap = usedLeaves.reduce((acc, item) => {
      acc[item.policyId] = item._sum.days || 0;
      return acc;
    }, {});

    const totalLeaveBalance = policies.reduce((sum, p) => sum + p.totalDays - (usedMap[p.id] || 0), 0);

    // Pending leave requests
    const pendingLeaves = await prisma.leave.count({
      where: { userId: req.user.id, status: 'PENDING' }
    });

    // Upcoming holidays
    const upcomingHolidays = await prisma.holiday.findMany({
      where: {
        companyId: req.companyId,
        isActive: true,
        date: { gte: today }
      },
      orderBy: { date: 'asc' },
      take: 3
    });

    // This month's attendance summary
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const monthAttendance = await prisma.attendance.findMany({
      where: {
        userId: req.user.id,
        date: { gte: monthStart, lte: monthEnd }
      }
    });

    const attendanceSummary = {
      present: monthAttendance.filter(a => a.status === 'PRESENT').length,
      totalWorkingDays: monthAttendance.length,
      avgHours: monthAttendance.length > 0
        ? Math.round(monthAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0) / monthAttendance.length * 10) / 10
        : 0
    };

    res.json({
      todayAttendance: todayAttendance || { status: 'NOT_MARKED' },
      totalLeaveBalance,
      pendingLeaves,
      upcomingHolidays,
      attendanceSummary
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;

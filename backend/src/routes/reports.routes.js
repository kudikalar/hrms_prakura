const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const [totalEmployees, activeEmployees, inactiveEmployees, departmentCount] = await Promise.all([
      prisma.user.count({ where: { companyId: req.companyId } }),
      prisma.user.count({ where: { companyId: req.companyId, status: 'ACTIVE' } }),
      prisma.user.count({ where: { companyId: req.companyId, status: 'INACTIVE' } }),
      prisma.department.count({ where: { companyId: req.companyId } })
    ]);

    // Leave Summary
    const leaveStats = await prisma.leave.groupBy({
      by: ['status'],
      where: {
        user: { companyId: req.companyId }
      },
      _count: { id: true }
    });

    // Payroll Summary (Current Month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const payrollSummary = await prisma.payroll.aggregate({
      where: {
        companyId: req.companyId,
        month: currentMonth,
        year: currentYear
      },
      _sum: { netSalary: true },
      _count: { id: true }
    });

    // Department Distribution
    const departmentDistribution = await prisma.department.findMany({
      where: { companyId: req.companyId },
      select: {
        name: true,
        _count: {
          select: { users: true }
        }
      }
    });

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      departmentCount,
      leaveStats: {
        pending: leaveStats.find(s => s.status === 'PENDING')?._count.id || 0,
        approved: leaveStats.find(s => s.status === 'APPROVED')?._count.id || 0,
        rejected: leaveStats.find(s => s.status === 'REJECTED')?._count.id || 0
      },
      payrollSummary: {
        totalPaid: payrollSummary._sum.netSalary || 0,
        employeeCount: payrollSummary._count.id || 0,
        month: currentMonth,
        year: currentYear
      },
      departmentDistribution: departmentDistribution.map(d => ({
        name: d.name,
        count: d._count.users
      }))
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Attendance Report
router.get('/attendance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      user: { companyId: req.companyId }
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(attendance);
  } catch (error) {
    logger.error('Attendance report error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
});

// Payroll Report
router.get('/payroll', async (req, res) => {
  try {
    const { month, year } = req.query;

    const where = { companyId: req.companyId };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(payrolls);
  } catch (error) {
    logger.error('Payroll report error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll report' });
  }
});

// Leave Report
router.get('/leave', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where = {
      user: { companyId: req.companyId }
    };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        policy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leaves);
  } catch (error) {
    logger.error('Leave report error:', error);
    res.status(500).json({ error: 'Failed to fetch leave report' });
  }
});

module.exports = router;

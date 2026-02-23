const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Process Monthly Payroll
router.post('/process', async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Get all active employees
    const employees = await prisma.user.findMany({
      where: {
        companyId: req.companyId,
        status: 'ACTIVE',
        salary: { not: null }
      }
    });

    const payrolls = [];
    for (const employee of employees) {
      const basicSalary = employee.salary || 0;
      const hra = basicSalary * 0.4; // 40% HRA
      const allowances = basicSalary * 0.2; // 20% Allowances
      const pf = basicSalary * 0.12; // 12% PF
      const tax = basicSalary * 0.1; // 10% Tax
      const deductions = pf + tax;
      const netSalary = basicSalary + hra + allowances - deductions;

      // Check if payroll already exists
      const existing = await prisma.payroll.findUnique({
        where: {
          userId_month_year: {
            userId: employee.id,
            month: parseInt(month),
            year: parseInt(year)
          }
        }
      });

      if (!existing) {
        const payroll = await prisma.payroll.create({
          data: {
            companyId: req.companyId,
            userId: employee.id,
            month: parseInt(month),
            year: parseInt(year),
            basicSalary,
            hra,
            allowances,
            deductions,
            pf,
            tax,
            netSalary,
            status: 'PROCESSED'
          },
          include: { user: true }
        });
        payrolls.push(payroll);
      }
    }

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'PROCESS_PAYROLL',
        entity: 'PAYROLL',
        changes: JSON.stringify({ month, year, count: payrolls.length }),
        ipAddress: req.ip
      }
    });

    res.json({
      message: `Processed payroll for ${payrolls.length} employees`,
      payrolls
    });
  } catch (error) {
    logger.error('Process payroll error:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// Get Payroll History
router.get('/history', async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      companyId: req.companyId,
      ...(month && { month: parseInt(month) }),
      ...(year && { year: parseInt(year) })
    };

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
      }),
      prisma.payroll.count({ where })
    ]);

    res.json({
      payrolls,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get payroll history error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
});

// Get Employee Payroll
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payrolls = await prisma.payroll.findMany({
      where: {
        userId: employeeId,
        companyId: req.companyId
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(payrolls);
  } catch (error) {
    logger.error('Get employee payroll error:', error);
    res.status(500).json({ error: 'Failed to fetch employee payroll' });
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Helper: Calculate tenure
const calculateTenure = (startDate, endDate = null) => {
  const end = endDate ? new Date(endDate) : new Date();
  const start = new Date(startDate);
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  if (days < 0) {
    months--;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
};

// List Employees with Lifecycle Data
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      department = '', 
      role = '',
      employmentStatus = '',
      dojFrom = '',
      dojTo = '',
      exitFrom = '',
      exitTo = ''
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      companyId: req.companyId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(department && { departmentId: department }),
      ...(role && { role }),
      ...(employmentStatus && { employmentStatus }),
      ...(dojFrom && dojTo && {
        dateOfJoining: {
          gte: new Date(dojFrom),
          lte: new Date(dojTo)
        }
      }),
      ...(exitFrom && exitTo && {
        exitDate: {
          gte: new Date(exitFrom),
          lte: new Date(exitTo)
        }
      })
    };

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          department: true,
          designation: true
        },
        orderBy: { dateOfJoining: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const employeesWithTenure = employees.map(emp => {
      const { password, ...employee } = emp;
      const tenure = emp.dateOfJoining ? calculateTenure(emp.dateOfJoining, emp.exitDate) : null;
      return {
        ...employee,
        tenure: tenure ? `${tenure.years}y ${tenure.months}m ${tenure.days}d` : 'N/A'
      };
    });

    res.json({
      employees: employeesWithTenure,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get employees lifecycle error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get Employee Timeline
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId: req.companyId },
      include: {
        department: true,
        designation: true
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const history = await prisma.employmentHistory.findMany({
      where: { employeeId, companyId: req.companyId },
      orderBy: { effectiveDate: 'desc' }
    });

    const { password, ...employeeData } = employee;
    const tenure = employee.dateOfJoining ? calculateTenure(employee.dateOfJoining, employee.exitDate) : null;

    res.json({
      employee: {
        ...employeeData,
        tenure: tenure ? `${tenure.years} Years ${tenure.months} Months ${tenure.days} Days` : 'N/A'
      },
      history
    });
  } catch (error) {
    logger.error('Get employee timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch employee timeline' });
  }
});

// Add Employment Event
router.post('/:employeeId/event', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { eventType, oldValue, newValue, effectiveDate, notes } = req.body;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId: req.companyId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const event = await prisma.employmentHistory.create({
      data: {
        employeeId,
        companyId: req.companyId,
        eventType,
        oldValue,
        newValue,
        effectiveDate: new Date(effectiveDate),
        notes,
        createdBy: req.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'EMPLOYMENT_EVENT',
        entityId: event.id,
        changes: JSON.stringify({ eventType, employeeId }),
        ipAddress: req.ip
      }
    });

    res.status(201).json(event);
  } catch (error) {
    logger.error('Add employment event error:', error);
    res.status(500).json({ error: 'Failed to add employment event' });
  }
});

// Record Exit
router.post('/:employeeId/exit', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { exitDate, exitType, exitReason, noticeServed, rehireEligible } = req.body;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId: req.companyId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.employmentStatus === 'EXITED') {
      return res.status(400).json({ error: 'Employee already exited' });
    }

    // Update user
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        exitDate: new Date(exitDate),
        exitType,
        exitReason,
        employmentStatus: 'EXITED',
        status: 'INACTIVE'
      }
    });

    // Create exit event
    await prisma.employmentHistory.create({
      data: {
        employeeId,
        companyId: req.companyId,
        eventType: 'EXIT',
        oldValue: 'ACTIVE',
        newValue: exitType,
        effectiveDate: new Date(exitDate),
        notes: `Exit Reason: ${exitReason}. Notice Served: ${noticeServed}. Rehire Eligible: ${rehireEligible}`,
        createdBy: req.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'EXIT',
        entity: 'EMPLOYEE',
        entityId: employeeId,
        changes: JSON.stringify({ exitType, exitDate }),
        ipAddress: req.ip
      }
    });

    const { password, ...employeeData } = updatedEmployee;
    res.json(employeeData);
  } catch (error) {
    logger.error('Record exit error:', error);
    res.status(500).json({ error: 'Failed to record exit' });
  }
});

// Rehire Employee
router.post('/:employeeId/rehire', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { dateOfJoining, departmentId, designationId, salary } = req.body;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId: req.companyId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.employmentStatus !== 'EXITED') {
      return res.status(400).json({ error: 'Employee is not exited' });
    }

    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        dateOfJoining: new Date(dateOfJoining),
        employmentStatus: 'ACTIVE',
        status: 'ACTIVE',
        exitDate: null,
        exitType: null,
        exitReason: null,
        departmentId,
        designationId,
        salary: salary ? parseFloat(salary) : employee.salary
      }
    });

    await prisma.employmentHistory.create({
      data: {
        employeeId,
        companyId: req.companyId,
        eventType: 'JOINED',
        oldValue: 'EXITED',
        newValue: 'REHIRED',
        effectiveDate: new Date(dateOfJoining),
        notes: 'Employee rehired',
        createdBy: req.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'REHIRE',
        entity: 'EMPLOYEE',
        entityId: employeeId,
        changes: JSON.stringify({ dateOfJoining }),
        ipAddress: req.ip
      }
    });

    const { password, ...employeeData } = updatedEmployee;
    res.json(employeeData);
  } catch (error) {
    logger.error('Rehire employee error:', error);
    res.status(500).json({ error: 'Failed to rehire employee' });
  }
});

module.exports = router;

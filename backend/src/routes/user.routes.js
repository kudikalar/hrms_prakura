const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Validation Schema
const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    role: z.enum(['ADMIN', 'HR', 'EMPLOYEE']),
    phone: z.string().optional(),
    departmentId: z.string().uuid().optional().nullable(),
    designationId: z.string().uuid().optional().nullable(),
    dateOfJoining: z.string().optional(),
    salary: z.number().optional()
  })
});

// Get All Users
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', role = '' } = req.query;
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
      ...(status && { status }),
      ...(role && { role })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          department: true,
          designation: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.json({
      users: usersWithoutPassword,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create User
router.post('/', validate(createUserSchema), async (req, res) => {
  try {
    const { email, password, dateOfJoining, departmentId, designationId, ...userData } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Clean up empty strings for optional fields
    const cleanDepartmentId = departmentId && departmentId.trim() !== '' ? departmentId : null;
    const cleanDesignationId = designationId && designationId.trim() !== '' ? designationId : null;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        companyId: req.companyId,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
        departmentId: cleanDepartmentId,
        designationId: cleanDesignationId,
        ...userData
      },
      include: {
        department: true,
        designation: true
      }
    });

    // Create employment history event if dateOfJoining is set
    if (dateOfJoining) {
      await prisma.employmentHistory.create({
        data: {
          employeeId: user.id,
          companyId: req.companyId,
          eventType: 'JOINED',
          newValue: 'Joined',
          effectiveDate: new Date(dateOfJoining),
          createdBy: req.user.id
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        ipAddress: req.ip
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update User
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, email, ...updateData } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        designation: true
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        ipAddress: req.ip
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update User Status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE_STATUS',
        entity: 'USER',
        entityId: id,
        changes: JSON.stringify({ status }),
        ipAddress: req.ip
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete User
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'DELETE',
        entity: 'USER',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;

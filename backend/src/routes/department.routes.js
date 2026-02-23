const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Get All Departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { companyId: req.companyId },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(departments);
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create Department
router.post('/', async (req, res) => {
  try {
    const { name, headId, description } = req.body;

    const department = await prisma.department.create({
      data: {
        companyId: req.companyId,
        name,
        headId,
        description
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'DEPARTMENT',
        entityId: department.id,
        ipAddress: req.ip
      }
    });

    res.status(201).json(department);
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update Department
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, headId, description, isActive } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: { name, headId, description, isActive }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'DEPARTMENT',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json(department);
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete Department
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'DELETE',
        entity: 'DEPARTMENT',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Get All Designations
router.get('/', async (req, res) => {
  try {
    const designations = await prisma.designation.findMany({
      where: { companyId: req.companyId },
      include: {
        department: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(designations);
  } catch (error) {
    logger.error('Get designations error:', error);
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
});

// Create Designation
router.post('/', async (req, res) => {
  try {
    const { title, departmentId, salaryBand } = req.body;

    const designation = await prisma.designation.create({
      data: {
        companyId: req.companyId,
        title,
        departmentId,
        salaryBand
      },
      include: { department: true }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'DESIGNATION',
        entityId: designation.id,
        ipAddress: req.ip
      }
    });

    res.status(201).json(designation);
  } catch (error) {
    logger.error('Create designation error:', error);
    res.status(500).json({ error: 'Failed to create designation' });
  }
});

// Update Designation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, departmentId, salaryBand, isActive } = req.body;

    const designation = await prisma.designation.update({
      where: { id },
      data: { title, departmentId, salaryBand, isActive },
      include: { department: true }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'DESIGNATION',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json(designation);
  } catch (error) {
    logger.error('Update designation error:', error);
    res.status(500).json({ error: 'Failed to update designation' });
  }
});

// Delete Designation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.designation.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'DELETE',
        entity: 'DESIGNATION',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    logger.error('Delete designation error:', error);
    res.status(500).json({ error: 'Failed to delete designation' });
  }
});

module.exports = router;

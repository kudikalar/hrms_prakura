const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Get All Holidays
router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    const where = { companyId: req.companyId };

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json(holidays);
  } catch (error) {
    logger.error('Get holidays error:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// Create Holiday
router.post('/', async (req, res) => {
  try {
    const { name, date, description } = req.body;

    const holiday = await prisma.holiday.create({
      data: {
        companyId: req.companyId,
        name,
        date: new Date(date),
        description
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'HOLIDAY',
        entityId: holiday.id,
        ipAddress: req.ip
      }
    });

    res.status(201).json(holiday);
  } catch (error) {
    logger.error('Create holiday error:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// Update Holiday
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, description, isActive } = req.body;

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        description,
        isActive
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'HOLIDAY',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json(holiday);
  } catch (error) {
    logger.error('Update holiday error:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// Delete Holiday
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.holiday.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'DELETE',
        entity: 'HOLIDAY',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    logger.error('Delete holiday error:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;

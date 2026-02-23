const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Get All Leave Policies
router.get('/', async (req, res) => {
  try {
    const policies = await prisma.leavePolicy.findMany({
      where: { companyId: req.companyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(policies);
  } catch (error) {
    logger.error('Get leave policies error:', error);
    res.status(500).json({ error: 'Failed to fetch leave policies' });
  }
});

// Create Leave Policy
router.post('/', async (req, res) => {
  try {
    const { leaveType, totalDays, carryForward, carryForwardLimit, requiresApproval } = req.body;

    const policy = await prisma.leavePolicy.create({
      data: {
        companyId: req.companyId,
        leaveType,
        totalDays: parseInt(totalDays),
        carryForward: carryForward || false,
        carryForwardLimit: parseInt(carryForwardLimit) || 0,
        requiresApproval: requiresApproval !== false
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'LEAVE_POLICY',
        entityId: policy.id,
        ipAddress: req.ip
      }
    });

    res.status(201).json(policy);
  } catch (error) {
    logger.error('Create leave policy error:', error);
    res.status(500).json({ error: 'Failed to create leave policy' });
  }
});

// Update Leave Policy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, totalDays, carryForward, carryForwardLimit, requiresApproval, isActive } = req.body;

    const policy = await prisma.leavePolicy.update({
      where: { id },
      data: {
        leaveType,
        totalDays: totalDays ? parseInt(totalDays) : undefined,
        carryForward,
        carryForwardLimit: carryForwardLimit ? parseInt(carryForwardLimit) : undefined,
        requiresApproval,
        isActive
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'LEAVE_POLICY',
        entityId: id,
        ipAddress: req.ip
      }
    });

    res.json(policy);
  } catch (error) {
    logger.error('Update leave policy error:', error);
    res.status(500).json({ error: 'Failed to update leave policy' });
  }
});

module.exports = router;

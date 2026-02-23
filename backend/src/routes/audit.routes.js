const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Get Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, entity, action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { companyId: req.companyId };
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get Login Logs
router.get('/login-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, email, success } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { companyId: req.companyId };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (success !== undefined) where.success = success === 'true';

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.loginLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('Get login logs error:', error);
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
});

module.exports = router;

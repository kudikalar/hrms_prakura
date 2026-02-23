const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminOnly);

// Get Company Details
router.get('/', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    logger.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// Update Company Details
router.put('/', async (req, res) => {
  try {
    const { name, logo, workingHoursStart, workingHoursEnd, timezone, financialYearStart } = req.body;

    const company = await prisma.company.update({
      where: { id: req.companyId },
      data: {
        name,
        logo,
        workingHoursStart,
        workingHoursEnd,
        timezone,
        financialYearStart
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'COMPANY',
        entityId: company.id,
        ipAddress: req.ip
      }
    });

    res.json(company);
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company details' });
  }
});

module.exports = router;

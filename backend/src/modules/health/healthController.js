const { successResponse } = require('../../utils/responseUtils');
const { prisma } = require('../../config/db');

const getHealth = async (req, res, next) => {
  try {
    let dbStatus = 'disconnected';
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (e) {
        dbStatus = 'unreachable';
      }
    }

    return successResponse(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy',
      },
    }, 'JobPilot AI API is healthy');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};

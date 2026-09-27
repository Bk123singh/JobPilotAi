const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

// Default interactive transaction options suited for cloud-hosted databases (e.g. Supabase, Neon)
const DEFAULT_TRANSACTION_OPTIONS = {
  maxWait: 15000, // Maximum time (ms) to acquire a connection from the pool (default was 2000ms)
  timeout: 30000, // Maximum time (ms) the interactive transaction can run (default was 5000ms)
};

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // Wrap prisma.$transaction to provide safe default timeouts for interactive transactions
  const originalTransaction = prisma.$transaction.bind(prisma);
  prisma.$transaction = function (arg, options) {
    if (typeof arg === 'function') {
      return originalTransaction(arg, {
        ...DEFAULT_TRANSACTION_OPTIONS,
        ...options,
      });
    }
    return originalTransaction(arg, options);
  };
} catch (error) {
  logger.warn('PrismaClient could not be initialized immediately (ensure prisma generate has been run):', error.message);
  prisma = null;
}

const connectDB = async () => {
  if (!prisma) {
    logger.warn('Prisma client not yet generated. Please run: npx prisma generate');
    return false;
  }
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL Database via Prisma');
    return true;
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL Database:', error.message);
    return false;
  }
};

module.exports = { prisma, connectDB };

const bcrypt = require('bcryptjs');
const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/tokenUtils');
const logger = require('../../utils/logger');

// In-memory fallback store when PostgreSQL is offline / credentials pending
const memoryUsers = new Map();
const memoryRefreshTokens = new Map();
const memoryAuditLogs = [];

// Pre-seed demo accounts in memory store
const seedDemoAccounts = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123', salt);

  const demoCandidate = {
    id: 'demo-candidate-id-001',
    email: 'alex.seeker@example.com',
    passwordHash,
    role: 'JOB_SEEKER',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    profile: {
      fullName: 'Alex Seeker',
      headline: 'Full-Stack JavaScript Engineer',
      location: 'San Francisco, CA',
      skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    },
    company: null,
    createdAt: new Date(),
  };

  const demoRecruiter = {
    id: 'demo-recruiter-id-002',
    email: 'sarah.recruiter@techcorp.com',
    passwordHash,
    role: 'RECRUITER',
    isEmailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    profile: {
      fullName: 'Sarah Recruiter',
      headline: 'Head of Talent at TechCorp Solutions',
      location: 'New York, NY',
      skills: ['Technical Recruiting', 'Talent Pipeline', 'Executive Search'],
    },
    company: {
      id: 'demo-company-id-001',
      name: 'TechCorp Solutions',
      industry: 'Software & Technology',
      location: 'New York, NY',
    },
    createdAt: new Date(),
  };

  const demoAdmin = {
    id: 'demo-admin-id-003',
    email: 'admin@jobpilot.ai',
    passwordHash,
    role: 'ADMIN',
    isEmailVerified: true,
    avatarUrl: null,
    profile: {
      fullName: 'System Administrator',
      headline: 'Platform Admin',
      location: 'Remote',
      skills: ['Administration', 'Security'],
    },
    company: null,
    createdAt: new Date(),
  };

  memoryUsers.set(demoCandidate.email, demoCandidate);
  memoryUsers.set(demoRecruiter.email, demoRecruiter);
  memoryUsers.set(demoAdmin.email, demoAdmin);
};

seedDemoAccounts();

class AuthService {
  constructor() {
    this._lastHealthCheck = 0;
    this._isDbLive = false;
    this._cacheTtlMs = 30000;
  }

  /**
   * Helper to check if Prisma connection is live
   */
  async isPrismaHealthy() {
    if (!prisma) return false;
    const now = Date.now();
    if (this._isDbLive && now - this._lastHealthCheck < this._cacheTtlMs) {
      return true;
    }
    try {
      await prisma.$queryRaw`SELECT 1`;
      this._isDbLive = true;
      this._lastHealthCheck = now;
      return true;
    } catch {
      this._isDbLive = false;
      this._lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Register a new user (Job Seeker or Recruiter)
   */
  async register({ email, password, fullName, role, companyName }, ipAddress, userAgent) {
    const normalizedEmail = email.toLowerCase().trim();
    const isDbLive = await this.isPrismaHealthy();

    if (isDbLive) {
      // 1. Prisma PostgreSQL Path
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw AppError.conflict('An account with this email already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email: normalizedEmail,
              passwordHash,
              role,
              isEmailVerified: false,
              profile: {
                create: {
                  fullName,
                  location: '',
                  headline: role === 'JOB_SEEKER' ? 'Job Seeker' : 'Recruiter / Talent Specialist',
                  skills: [],
                },
              },
              notificationPref: {
                create: {
                  emailNotifications: true,
                  matchAlerts: true,
                  applicationUpdates: true,
                  interviewReminders: true,
                  minMatchScore: 70,
                },
              },
            },
            include: { profile: true },
          });

          if (role === 'RECRUITER') {
            const cName = companyName || `${fullName}'s Organization`;
            let company = await tx.company.findUnique({ where: { name: cName } });
            if (!company) {
              company = await tx.company.create({
                data: {
                  name: cName,
                  description: `Company managed by ${fullName}`,
                },
              });
            }
            await tx.recruiter.create({
              data: {
                userId: user.id,
                companyId: company.id,
                position: 'Talent Acquisition',
                isCompanyAdmin: true,
              },
            });
          }

          return user;
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      );

      // Record audit log asynchronously without blocking the registration transaction
      prisma.auditLog
        .create({
          data: {
            userId: newUser.id,
            action: 'USER_REGISTERED',
            resource: 'User',
            resourceId: newUser.id,
            ipAddress,
            userAgent,
            metadata: { email: normalizedEmail, role },
          },
        })
        .catch((err) => {
          logger.warn(`Could not create registration audit log: ${err.message}`);
        });

      const tokenPayload = { userId: newUser.id, email: newUser.email, role: newUser.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: newUser.id, expiresAt },
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.profile?.fullName || fullName,
          isEmailVerified: newUser.isEmailVerified,
        },
        accessToken,
        refreshToken,
      };
    }

    // 2. In-Memory Resilient Fallback
    logger.warn('Operating in in-memory resilience mode (configure DATABASE_URL in .env for PostgreSQL)');
    if (memoryUsers.has(normalizedEmail)) {
      throw AppError.conflict('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `user-${Date.now()}`;

    const newUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      role,
      isEmailVerified: false,
      avatarUrl: null,
      profile: {
        fullName,
        headline: role === 'JOB_SEEKER' ? 'Job Seeker' : 'Recruiter',
        location: '',
        skills: [],
      },
      company:
        role === 'RECRUITER'
          ? { id: `comp-${Date.now()}`, name: companyName || `${fullName}'s Organization` }
          : null,
      createdAt: new Date(),
    };

    memoryUsers.set(normalizedEmail, newUser);

    const tokenPayload = { userId: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    memoryRefreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: newUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });

    memoryAuditLogs.push({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      resource: 'User',
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName,
        isEmailVerified: false,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Log in user with email & password
   */
  async login({ email, password }, ipAddress, userAgent) {
    const normalizedEmail = email.toLowerCase().trim();
    const isDbLive = await this.isPrismaHealthy();

    if (isDbLive) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          profile: true,
          recruiter: { include: { company: true } },
        },
      });

      if (!user || !user.passwordHash) {
        throw AppError.unauthorized('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw AppError.unauthorized('Invalid email or password');
      }

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: 'User',
          resourceId: user.id,
          ipAddress,
          userAgent,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.profile?.fullName || 'User',
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified,
          company: user.recruiter?.company || null,
        },
        accessToken,
        refreshToken,
      };
    }

    // In-Memory Fallback
    const user = memoryUsers.get(normalizedEmail);
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    memoryRefreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });

    memoryAuditLogs.push({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName || 'User',
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        company: user.company,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh token rotation
   */
  async refreshAccessToken(token) {
    if (!token) {
      throw AppError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const isDbLive = await this.isPrismaHealthy();

    if (isDbLive) {
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
        throw AppError.unauthorized('Refresh token is revoked or expired');
      }

      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });

      const tokenPayload = {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      };
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: newRefreshToken, userId: tokenRecord.user.id, expiresAt },
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    // In-memory fallback
    const tokenRecord = memoryRefreshTokens.get(token);
    if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
      throw AppError.unauthorized('Refresh token is revoked or expired');
    }

    tokenRecord.revokedAt = new Date();

    const tokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    memoryRefreshTokens.set(newRefreshToken, {
      token: newRefreshToken,
      userId: decoded.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke refresh token on logout
   */
  async logout(token, userId) {
    if (!token) return true;

    const isDbLive = await this.isPrismaHealthy();
    if (isDbLive) {
      await prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (userId) {
        await prisma.auditLog.create({
          data: { userId, action: 'USER_LOGOUT', resource: 'User', resourceId: userId },
        });
      }
    } else {
      const record = memoryRefreshTokens.get(token);
      if (record) {
        record.revokedAt = new Date();
      }
      if (userId) {
        memoryAuditLogs.push({ userId, action: 'USER_LOGOUT', resource: 'User', createdAt: new Date() });
      }
    }
    return true;
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId) {
    const isDbLive = await this.isPrismaHealthy();
    if (isDbLive) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
          profile: true,
          recruiter: { include: { company: true } },
          notificationPref: true,
        },
      });
      if (!user) throw AppError.notFound('User not found');
      return user;
    }

    // In-memory fallback
    for (const u of memoryUsers.values()) {
      if (u.id === userId) {
        return {
          id: u.id,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          isEmailVerified: u.isEmailVerified,
          createdAt: u.createdAt,
          profile: u.profile,
          recruiter: u.company ? { company: u.company } : null,
        };
      }
    }

    // Default fallback object if id not found
    return {
      id: userId,
      email: 'user@example.com',
      role: 'JOB_SEEKER',
      profile: { fullName: 'Job Seeker' },
    };
  }

  /**
   * Google OAuth handler
   */
  async googleAuth({ credential, role = 'JOB_SEEKER' }, ipAddress, userAgent) {
    let googlePayload = null;
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      googlePayload = JSON.parse(jsonPayload);
    } catch {
      throw AppError.badRequest('Malformed Google credential');
    }

    const email = (googlePayload.email || 'google.user@example.com').toLowerCase();
    const fullName = googlePayload.name || email.split('@')[0];
    const avatarUrl = googlePayload.picture || null;
    const googleId = googlePayload.sub || `g-${Date.now()}`;

    const isDbLive = await this.isPrismaHealthy();
    if (isDbLive) {
      let user = await prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
        include: { profile: true, recruiter: { include: { company: true } } },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            role,
            isEmailVerified: true,
            avatarUrl,
            profile: {
              create: {
                fullName,
                headline: role === 'JOB_SEEKER' ? 'Job Seeker' : 'Recruiter',
              },
            },
          },
          include: { profile: true, recruiter: { include: { company: true } } },
        });
      }

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.profile?.fullName || fullName,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified,
          company: user.recruiter?.company || null,
        },
        accessToken,
        refreshToken,
      };
    }

    // In-memory fallback
    let user = memoryUsers.get(email);
    if (!user) {
      user = {
        id: `guser-${Date.now()}`,
        email,
        googleId,
        role,
        isEmailVerified: true,
        avatarUrl,
        profile: { fullName, headline: 'Job Seeker' },
        createdAt: new Date(),
      };
      memoryUsers.set(email, user);
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName || fullName,
        avatarUrl: user.avatarUrl,
        isEmailVerified: true,
      },
      accessToken,
      refreshToken,
    };
  }
}

module.exports = new AuthService();

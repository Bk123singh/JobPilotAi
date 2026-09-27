const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const logger = require('../../utils/logger');

// Fallback in-memory company store
const memoryCompanies = new Map();
const memoryRecruiters = new Map();

// Seed demo company
const seedDemoCompany = () => {
  const companyId = 'demo-company-id-001';
  memoryCompanies.set(companyId, {
    id: companyId,
    name: 'TechCorp Solutions',
    description:
      'TechCorp Solutions is a leading enterprise software company pioneering AI-driven developer platforms, high-scale cloud infrastructure, and modern collaboration tools.',
    logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
    website: 'https://techcorp.example.com',
    location: 'New York, NY',
    industry: 'Software & Technology',
    companySize: '51-200 employees',
    isVerified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  });

  // Link Sarah Recruiter to TechCorp
  memoryRecruiters.set('demo-recruiter-id-002', {
    id: 'recruiter-sarah-001',
    userId: 'demo-recruiter-id-002',
    companyId: companyId,
    position: 'Head of Talent & People',
    isCompanyAdmin: true,
  });
};

seedDemoCompany();

class CompanyService {
  /**
   * Get company belonging to logged-in recruiter
   */
  async getMyCompany(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId },
        include: {
          company: {
            include: {
              _count: { select: { jobs: true, recruiters: true } },
            },
          },
        },
      });

      if (!recruiter || !recruiter.company) {
        return null;
      }

      return {
        ...recruiter.company,
        recruiterRole: recruiter.position,
        isCompanyAdmin: recruiter.isCompanyAdmin,
      };
    }

    // In-memory fallback
    const recruiter = memoryRecruiters.get(userId);
    if (!recruiter) {
      return null;
    }

    const company = memoryCompanies.get(recruiter.companyId);
    if (!company) return null;

    return {
      ...company,
      recruiterRole: recruiter.position,
      isCompanyAdmin: recruiter.isCompanyAdmin,
      _count: { jobs: 0, recruiters: 1 },
    };
  }

  /**
   * Create a new company profile and associate recruiter
   */
  async createCompany(userId, data, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      // Check if company name is already taken
      const existing = await prisma.company.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw AppError.conflict('A company with this name is already registered');
      }

      return await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: data.name,
            description: data.description || '',
            website: data.website || '',
            location: data.location || '',
            industry: data.industry || 'Technology',
            companySize: data.companySize || '11-50 employees',
            logoUrl: data.logoUrl || null,
            isVerified: false,
          },
        });

        // Link or create recruiter record
        const recruiter = await tx.recruiter.upsert({
          where: { userId },
          create: {
            userId,
            companyId: company.id,
            position: 'Company Founder / Admin',
            isCompanyAdmin: true,
          },
          update: {
            companyId: company.id,
            isCompanyAdmin: true,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'COMPANY_CREATED',
            resource: 'Company',
            resourceId: company.id,
            ipAddress,
            userAgent,
            metadata: { companyName: company.name },
          },
        });

        return {
          ...company,
          recruiterRole: recruiter.position,
          isCompanyAdmin: recruiter.isCompanyAdmin,
        };
      });
    }

    // In-memory fallback
    for (const c of memoryCompanies.values()) {
      if (c.name.toLowerCase() === data.name.toLowerCase()) {
        throw AppError.conflict('A company with this name is already registered');
      }
    }

    const companyId = `comp-${Date.now()}`;
    const newCompany = {
      id: companyId,
      name: data.name,
      description: data.description || '',
      website: data.website || '',
      location: data.location || '',
      industry: data.industry || 'Technology',
      companySize: data.companySize || '11-50 employees',
      logoUrl: data.logoUrl || '',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryCompanies.set(companyId, newCompany);
    memoryRecruiters.set(userId, {
      id: `rec-${Date.now()}`,
      userId,
      companyId,
      position: 'Company Founder / Admin',
      isCompanyAdmin: true,
    });

    return {
      ...newCompany,
      recruiterRole: 'Company Founder / Admin',
      isCompanyAdmin: true,
      _count: { jobs: 0, recruiters: 1 },
    };
  }

  /**
   * Update existing company details
   */
  async updateCompany(userId, companyId, updateData, ipAddress, userAgent) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      // Verify recruiter belongs to company and is admin
      const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
      if (!recruiter || recruiter.companyId !== companyId) {
        throw AppError.forbidden('You do not have administrative access to this company');
      }

      const updated = await prisma.company.update({
        where: { id: companyId },
        data: {
          name: updateData.name,
          description: updateData.description,
          website: updateData.website,
          location: updateData.location,
          industry: updateData.industry,
          companySize: updateData.companySize,
          logoUrl: updateData.logoUrl,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'COMPANY_UPDATED',
          resource: 'Company',
          resourceId: companyId,
          ipAddress,
          userAgent,
        },
      });

      return updated;
    }

    // In-memory fallback
    const recruiter = memoryRecruiters.get(userId);
    if (!recruiter || recruiter.companyId !== companyId) {
      throw AppError.forbidden('You do not have administrative access to this company');
    }

    const company = memoryCompanies.get(companyId);
    if (!company) throw AppError.notFound('Company not found');

    const updated = {
      ...company,
      ...updateData,
      updatedAt: new Date(),
    };

    memoryCompanies.set(companyId, updated);
    return updated;
  }

  /**
   * Get public company profile by ID
   */
  async getCompanyById(companyId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          jobs: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              title: true,
              location: true,
              workplaceType: true,
              jobType: true,
              createdAt: true,
            },
          },
        },
      });
      if (!company) throw AppError.notFound('Company not found');
      return company;
    }

    // In-memory fallback
    const company = memoryCompanies.get(companyId);
    if (!company) throw AppError.notFound('Company not found');

    return {
      ...company,
      jobs: [],
    };
  }

  /**
   * List all companies
   */
  async listCompanies() {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.company.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { jobs: { where: { status: 'ACTIVE' } } } },
        },
      });
    }

    // In-memory fallback
    const list = [];
    for (const c of memoryCompanies.values()) {
      list.push({ ...c, _count: { jobs: 0 } });
    }
    return list;
  }
}

module.exports = new CompanyService();

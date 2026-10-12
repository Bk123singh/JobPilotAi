const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data into database...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123', salt);

  // 1. Create or update Demo Candidate
  const candidateUser = await prisma.user.upsert({
    where: { email: 'alex.seeker@example.com' },
    update: {},
    create: {
      email: 'alex.seeker@example.com',
      passwordHash,
      role: 'JOB_SEEKER',
      isEmailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      profile: {
        create: {
          fullName: 'Alex Seeker',
          headline: 'Full-Stack JavaScript Engineer',
          location: 'San Francisco, CA',
          skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
          bio: 'Passionate full-stack developer specializing in modern web applications and AI-driven platforms.',
        },
      },
    },
  });
  console.log('✅ Candidate seeded: alex.seeker@example.com');

  // 2. Create or update Company
  const company = await prisma.company.upsert({
    where: { name: 'TechCorp Solutions' },
    update: {},
    create: {
      name: 'TechCorp Solutions',
      description: 'Leading provider of enterprise cloud and AI infrastructure solutions.',
      industry: 'Software & Technology',
      location: 'New York, NY',
      website: 'https://techcorp.example.com',
      companySize: '50-200',
      isVerified: true,
      logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=160',
    },
  });
  console.log('✅ Company seeded: TechCorp Solutions');

  // 3. Create or update Demo Recruiter
  const recruiterUser = await prisma.user.upsert({
    where: { email: 'sarah.recruiter@techcorp.com' },
    update: {},
    create: {
      email: 'sarah.recruiter@techcorp.com',
      passwordHash,
      role: 'RECRUITER',
      isEmailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
      profile: {
        create: {
          fullName: 'Sarah Recruiter',
          headline: 'Head of Talent Acquisition at TechCorp',
          location: 'New York, NY',
          skills: ['Technical Recruiting', 'Talent Strategy', 'Interviewing'],
        },
      },
      recruiter: {
        create: {
          companyId: company.id,
          position: 'Head of Talent Acquisition',
          isCompanyAdmin: true,
        },
      },
    },
    include: { recruiter: true },
  });
  console.log('✅ Recruiter seeded: sarah.recruiter@techcorp.com');

  // 4. Create or update Demo Admin
  await prisma.user.upsert({
    where: { email: 'admin@jobpilot.ai' },
    update: {},
    create: {
      email: 'admin@jobpilot.ai',
      passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      profile: {
        create: {
          fullName: 'Platform Super Admin',
          headline: 'JobPilot AI Operations Lead',
          location: 'Remote',
          skills: ['System Administration', 'Security', 'Compliance'],
        },
      },
    },
  });
  console.log('✅ Admin seeded: admin@jobpilot.ai');

  // 5. Seed sample Job
  const recruiterId = recruiterUser.recruiter?.id;
  if (recruiterId) {
    const existingJob = await prisma.job.findFirst({
      where: { companyId: company.id, title: 'Senior Full-Stack Engineer' },
    });

    if (!existingJob) {
      await prisma.job.create({
        data: {
          title: 'Senior Full-Stack Engineer',
          description: 'We are seeking an experienced Full-Stack Engineer with React, Node.js, and PostgreSQL expertise.',
          location: 'Remote (US/Global)',
          workplaceType: 'REMOTE',
          jobType: 'FULL_TIME',
          minSalary: 130000,
          maxSalary: 175000,
          currency: 'USD',
          status: 'ACTIVE',
          experienceLevel: 'Senior Level (4-6 yrs)',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
          niceToHaveSkills: ['Docker', 'Tailwind CSS', 'TypeScript'],
          companyId: company.id,
          recruiterId: recruiterId,
        },
      });
      console.log('✅ Sample job seeded: Senior Full-Stack Engineer');
    }
  }

  // 6. Seed sample Resume for Candidate
  const existingResume = await prisma.resume.findFirst({
    where: { userId: candidateUser.id },
  });

  if (!existingResume) {
    await prisma.resume.create({
      data: {
        userId: candidateUser.id,
        title: 'Senior Full-Stack Resume (2026)',
        fileUrl: 'https://res.cloudinary.com/jobpilot/raw/upload/v1/jobpilot/resumes/alex_seeker_resume.pdf',
        isPrimary: true,
        visibility: 'APPLICATION_ONLY',
        qualityScore: 94,
        rawText: 'Alex Seeker - Senior Full-Stack Engineer. Skills: React, Node.js, PostgreSQL, Docker, Tailwind CSS.',
      },
    });
    console.log('✅ Candidate resume seeded');
  }

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

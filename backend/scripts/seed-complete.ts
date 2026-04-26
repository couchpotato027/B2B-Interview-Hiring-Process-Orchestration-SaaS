import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Complete IDEMPOTENT Seeder...');

  // 1. Setup default tenant
  const tenantId = 'default-tenant';
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: { id: tenantId, name: 'HireFlow Corp' },
  });
  console.log('✅ Tenant ready');

  // 2. Setup roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: 'ADMIN' } },
      update: {},
      create: { tenantId, name: 'ADMIN' },
    }),
    prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: 'RECRUITER' } },
      update: {},
      create: { tenantId, name: 'RECRUITER' },
    }),
  ]);
  const adminRole = roles[0];
  console.log('✅ Roles ready');

  // 3. Setup admin user
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: 'admin@hireflow.com' } },
    update: { passwordHash },
    create: {
      tenantId,
      roleId: adminRole.id,
      email: 'admin@hireflow.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
    },
  });
  console.log('✅ Admin user ready');

  // 3b. Setup recruiter user
  const recruiterRole = roles[1];
  const recruiterUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: 'recruiter@hireflow.com' } },
    update: { passwordHash },
    create: {
      tenantId,
      roleId: recruiterRole.id,
      email: 'recruiter@hireflow.com',
      passwordHash,
      firstName: 'Lead',
      lastName: 'Recruiter',
    },
  });
  console.log('✅ Recruiter user ready');

  // 4. Setup pipeline template
  const pipeline = await prisma.pipelineTemplate.upsert({
    where: { tenantId_name: { tenantId, name: 'Standard Software Engineering' } },
    update: {},
    create: {
      tenantId,
      name: 'Standard Software Engineering',
      roleType: 'ENGINEERING',
      stages: {
        create: [
          { tenantId, name: 'Sourced', orderIndex: 0, stageType: 'STATIC' },
          { tenantId, name: 'Technical Screening', orderIndex: 1, stageType: 'ASSESSMENT' },
          { tenantId, name: 'Interview Loop', orderIndex: 2, stageType: 'INTERVIEW' },
          { tenantId, name: 'Offer', orderIndex: 3, stageType: 'STATIC' },
        ],
      },
    },
    include: { stages: true },
  });
  const stages = pipeline.stages.sort((a, b) => a.orderIndex - b.orderIndex);
  console.log(`✅ Pipeline ready with ${stages.length} stages`);

  // 5. Setup jobs
  const jobTitles = ['Senior Frontend Engineer', 'Backend Node.js Developer', 'Product Designer'];
  const jobs = [];
  for (const title of jobTitles) {
    const job = await prisma.job.create({
        data: {
          tenantId,
          title,
          department: title.includes('Engineer') || title.includes('Developer') ? 'Engineering' : 'Design',
          hiringManagerId: adminUser.id,
          pipelineTemplateId: pipeline.id,
          status: 'OPEN',
        }
    });
    jobs.push(job);
  }
  console.log(`✅ ${jobs.length} jobs ready`);

  // 6. Setup candidates
  const candidateData = [
    { first: 'Alice', last: 'Smith' }, { first: 'Bob', last: 'Johnson' }, 
    { first: 'Charlie', last: 'Davis' }, { first: 'Diana', last: 'Prince' }, 
    { first: 'Ethan', last: 'Hunt' }, { first: 'Fiona', last: 'Gallagher' },
    { first: 'George', last: 'Costanza' }, { first: 'Hannah', last: 'Baker' }, 
    { first: 'Ian', last: 'Wright' }, { first: 'Julia', last: 'Roberts' }
  ];

  for (let i = 0; i < candidateData.length; i++) {
    const { first, last } = candidateData[i] as { first: string, last: string };
    const job = jobs[i % jobs.length];
    const stage = stages[i % stages.length];
    
    const candidate = await prisma.candidate.create({
      data: {
        tenantId,
        pipelineId: pipeline.id,
        jobId: job!.id,
        currentStageId: stage!.id,
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        status: 'ACTIVE',
      },
    });

    // Create a mock evaluation for some candidates
    if (i % 2 === 0) {
        await prisma.evaluation.create({
            data: {
                tenantId,
                candidateId: candidate.id,
                jobId: job!.id,
                stageId: stage!.id,
                interviewerId: adminUser.id,
                recommendation: i % 4 === 0 ? 'STRONG_HIRE' : 'HIRE',
                skillMatchScore: 4,
                experienceScore: 5,
                projectRelevanceScore: 4,
                overallScore: 4,
            }
        });
    }
  }
  console.log(`✅ ${candidateData.length} candidates ready with evaluations`);

  // 7. Success message
  console.log('\n🚀 IDEMPOTENT SEEDING COMPLETE!');
  console.log('--------------------------------------------------');
  console.log('Admin Email: admin@hireflow.com');
  console.log('Recruiter Email: recruiter@hireflow.com');
  console.log('Password (for both): password123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seeder...');

  // 1. Cleanup existing data (optional, but good for fresh start)
  console.log('🧹 Cleaning up old data...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.slaAlert.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipelineTemplate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Create Tenant
  console.log('🏢 Creating Tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'default-tenant-id',
      name: 'HireFlow Corp',
    },
  });

  // 3. Create Roles
  console.log('🎭 Creating Roles...');
  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'ADMIN',
    },
  });

  const recruiterRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'RECRUITER',
    },
  });

  // 4. Create User
  console.log('👤 Creating Admin User...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      email: 'admin@hireflow.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // 5. Create Pipeline Template & Stages
  console.log('🛤️ Creating Pipeline Template...');
  const pipeline = await prisma.pipelineTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Standard Software Engineering',
      roleType: 'ENGINEERING',
      stages: {
        create: [
          { tenantId: tenant.id, name: 'Sourced', orderIndex: 0, stageType: 'STATIC' },
          { tenantId: tenant.id, name: 'Technical Screening', orderIndex: 1, stageType: 'ASSESSMENT' },
          { tenantId: tenant.id, name: 'Interview Loop', orderIndex: 2, stageType: 'INTERVIEW' },
          { tenantId: tenant.id, name: 'Offer', orderIndex: 3, stageType: 'STATIC' },
        ],
      },
    },
    include: { stages: true },
  });

  const stages = pipeline.stages.sort((a, b) => a.orderIndex - b.orderIndex);

  // 6. Create Jobs
  console.log('💼 Creating Jobs...');
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        status: 'OPEN',
        hiringManagerId: user.id,
        pipelineTemplateId: pipeline.id,
      },
    }),
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        title: 'Backend Node.js Developer',
        department: 'Platform',
        status: 'OPEN',
        hiringManagerId: user.id,
        pipelineTemplateId: pipeline.id,
      },
    }),
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        title: 'Product Designer',
        department: 'Design',
        status: 'OPEN',
        hiringManagerId: user.id,
        pipelineTemplateId: pipeline.id,
      },
    }),
  ]);

  // 7. Create Candidates
  console.log('👥 Creating Candidates...');
  const candidateNames = [
    ['Alice', 'Smith'], ['Bob', 'Johnson'], ['Charlie', 'Davis'],
    ['Diana', 'Prince'], ['Ethan', 'Hunt'], ['Fiona', 'Gallagher'],
    ['George', 'Costanza'], ['Hannah', 'Baker'], ['Ian', 'Wright'],
    ['Julia', 'Roberts']
  ];

  for (let i = 0; i < candidateNames.length; i++) {
    const [first, last] = candidateNames[i];
    const job = jobs[i % jobs.length];
    const stage = stages[i % stages.length];

    await prisma.candidate.create({
      data: {
        tenantId: tenant.id,
        pipelineId: pipeline.id,
        jobId: job.id,
        currentStageId: stage.id,
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        status: 'ACTIVE',
      },
    });
  }

  console.log('\n✨ Seeding Complete!');
  console.log('--------------------------------------------------');
  console.log('CREDENTIALS:');
  console.log('Email: admin@hireflow.com');
  console.log('Password: password123');
  console.log('Tenant ID: default-tenant-id');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

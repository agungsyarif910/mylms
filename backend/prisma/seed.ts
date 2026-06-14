import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create instructor account
  const passwordHash = await bcrypt.hash('instructor123', 12);

  const instructor = await prisma.user.upsert({
    where: { email: 'adam.bhuana@gmail.com' },
    update: {},
    create: {
      email: 'adam.bhuana@gmail.com',
      passwordHash,
      fullName: 'Adam Bhuana',
      role: 'INSTRUCTOR',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✅ Instructor created: ${instructor.email}`);

  // Create sample student
  const studentHash = await bcrypt.hash('student123', 12);

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      passwordHash: studentHash,
      fullName: 'Demo Student',
      role: 'STUDENT',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✅ Student created: ${student.email}`);

  // Create sample course
  const course = await prisma.course.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      instructorId: instructor.id,
      title: 'Fullstack Web Development dengan Next.js & NestJS',
      description:
        'Pelajari cara membangun aplikasi web modern menggunakan Next.js untuk frontend dan NestJS untuk backend. Materi mencakup TypeScript, React, REST API, database PostgreSQL, authentication, dan deployment.',
      shortDescription:
        'Belajar fullstack web development dari nol hingga production-ready',
      price: 500000,
      maxParticipants: 30,
      category: 'Web Development',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  console.log(`✅ Sample course created: ${course.title}`);

  // Create sample sessions
  const sessions = [
    {
      title: 'Sesi 1: Pengenalan TypeScript & Environment Setup',
      sessionDate: new Date('2025-07-01'),
      startTime: '09:00',
      endTime: '11:00',
      sessionOrder: 1,
    },
    {
      title: 'Sesi 2: React & Next.js Fundamentals',
      sessionDate: new Date('2025-07-08'),
      startTime: '09:00',
      endTime: '11:00',
      sessionOrder: 2,
    },
    {
      title: 'Sesi 3: NestJS Backend & REST API',
      sessionDate: new Date('2025-07-15'),
      startTime: '09:00',
      endTime: '11:00',
      sessionOrder: 3,
    },
    {
      title: 'Sesi 4: Database & Prisma ORM',
      sessionDate: new Date('2025-07-22'),
      startTime: '09:00',
      endTime: '11:00',
      sessionOrder: 4,
    },
  ];

  for (const session of sessions) {
    await prisma.courseSession.create({
      data: {
        courseId: course.id,
        ...session,
        status: 'SCHEDULED',
      },
    });
  }

  console.log(`✅ ${sessions.length} sessions created`);
  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Instructor: adam.bhuana@gmail.com / instructor123');
  console.log('   Student:    student@example.com / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

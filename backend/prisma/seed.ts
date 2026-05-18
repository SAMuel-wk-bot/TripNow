import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@tripnow.local' },
    update: {},
    create: {
      email: 'admin@tripnow.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'TripNow',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  console.info('Seed completed: admin user created (admin@tripnow.local / Admin123!)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

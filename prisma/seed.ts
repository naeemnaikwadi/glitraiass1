import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Add your seed data here
  // Example:
  // await prisma.user.create({ data: { email: 'admin@example.com', name: 'Admin' } });

  console.log('✅ Seeding complete.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

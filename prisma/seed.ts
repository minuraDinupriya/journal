import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Default User
  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      name: 'Trader',
      email: 'trader@example.com'
    }
  });
  console.log(`User created/found: ${user.id}`);

  // 2. Create Tags
  const defaultTags = [
    { name: 'Scalp', color: '#ef4444' }, // Red
    { name: 'Swing', color: '#3b82f6' }, // Blue
    { name: 'Breakout', color: '#10b981' }, // Green
    { name: 'Reversal', color: '#f59e0b' }, // Amber
    { name: 'Trend Following', color: '#8b5cf6' }, // Violet
  ];

  for (const tagData of defaultTags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagData.name },
      update: { color: tagData.color },
      create: tagData
    });
    console.log(`Tag created/updated: ${tag.name}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

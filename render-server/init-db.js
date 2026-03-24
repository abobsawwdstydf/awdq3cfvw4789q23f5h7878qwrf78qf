/**
 * Nexo Messenger - Database Initialization
 * Чистый Node.js для Render
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing database...\n');

  const password = await bcrypt.hash('demo123', 10);

  const usersData = [
    { username: 'evgeniy', displayName: 'Евгений', bio: 'Nexo Creator' },
    { username: 'anastasia', displayName: 'Анастасия', bio: 'UI/UX Designer' },
    { username: 'artem', displayName: 'Артём', bio: 'Frontend Dev' },
    { username: 'polina', displayName: 'Полина', bio: 'Backend Dev' },
    { username: 'daniil', displayName: 'Даниил', bio: 'DevOps' },
    { username: 'vladimir', displayName: 'Владимир', bio: 'Product Manager' },
  ];

  const users = await Promise.all(
    usersData.map((u) =>
      prisma.user.upsert({
        where: { username: u.username },
        update: { displayName: u.displayName, bio: u.bio },
        create: {
          username: u.username,
          displayName: u.displayName,
          password,
          bio: u.bio,
          isOnline: false,
        },
      })
    )
  );

  console.log(`✅ Created ${users.length} users\n`);
  console.log('--- Test Accounts ---');
  console.log('Password: demo123\n');
  users.forEach(user => {
    console.log(`  ${user.username} (${user.displayName})`);
  });
  console.log('\n✅ Database initialized!\n');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

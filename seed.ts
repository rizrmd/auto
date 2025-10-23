import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: 'joni@example.com',
      name: 'joni',
    },
  });

  console.log('Created user:', user);

  // Create some sample posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Welcome to joni',
      content: 'This is the first post in the joni application.',
      published: true,
      authorId: user.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Getting Started with Prisma',
      content: 'Prisma makes database operations easy and type-safe.',
      published: false,
      authorId: user.id,
    },
  });

  console.log('Created posts:', [post1, post2]);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
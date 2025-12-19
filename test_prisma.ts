
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('Checking prisma.user...');
  if (prisma.user) console.log('prisma.user exists.');
  else console.log('prisma.user MISSING');

  console.log('Checking prisma.request...');
  if (prisma.request) console.log('prisma.request exists.');
  else console.log('prisma.request MISSING');
  
  console.log('Checking prisma.person...');
  if (prisma.person) console.log('prisma.person exists.');
  else console.log('prisma.person MISSING');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });

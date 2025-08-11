import { PrismaClient } from '@prisma/client'
import { lineageData, Ancestor } from '../src/lib/data';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient()

async function seedAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  await prisma.admin.upsert({
    where: { email: 'admin@bataklineage.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@bataklineage.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });
  console.log('Admin user seeded.');
}


async function seedPeople(ancestors: Ancestor[]) {
  for (const ancestor of ancestors) {
    const person = await prisma.person.create({
      data: {
        id: ancestor.id,
        name: ancestor.name,
        generation: ancestor.generation,
        wife: ancestor.wife,
        birthOrder: ancestor.birthOrder,
        description: `This is a profile for ${ancestor.name}.`, // Example description
        fatherId: ancestor.fatherId,
      },
    });

    console.log(`Created person: ${person.name}`);

    if (ancestor.children && ancestor.children.length > 0) {
      await seedPeople(ancestor.children);
    }
  }
}

async function main() {
  console.log('Start seeding ...');
  
  await seedAdmin();
  
  // Start seeding with the root of the lineage
  await seedPeople([lineageData]);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

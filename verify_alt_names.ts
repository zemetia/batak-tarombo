// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const person = await prisma.person.findFirst({
    where: { 
        detail: {
            alternativeNames: {
                has: 'Raja Uti'
            }
        }
    },
    include: { detail: true }
  });

  if (person) {
      console.log(`Found person by alternative name 'Raja Uti': ${person.name}`);
      console.log(`Alternative names: ${person.detail?.alternativeNames.join(', ')}`);
  } else {
      console.log('Person with alternative name Raja Uti not found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

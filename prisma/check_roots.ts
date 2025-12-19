import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const targets = ["Si Raja Batak", "Si Boru Deak Parujar"];
  
  for (const name of targets) {
    const person = await prisma.person.findFirst({
        where: { name: { contains: name, mode: 'insensitive' } },
        include: { parent: true }
    });
    console.log(`\nName: ${name}`);
    console.log(person ? JSON.stringify(person, null, 2) : "Not Found");
  }
}

checkData().finally(() => prisma.$disconnect());

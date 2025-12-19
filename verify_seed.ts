import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Verifying Sitorus Pane lineage...');
  
  // Find "Sitorus Pane" or "Raja Pane" and trace back up
  // Or find "Si Raja Batak" and trace down to "Sitorus Pane"
  
  // Let's look for "Raja Pane"
  const rajaPane = await prisma.person.findFirst({
    where: { name: 'Raja Pane' },
    include: {
        parent: {
            include: {
                husband: true
            }
        },
        marriagesAsHusband: {
            include: {
                children: true
            }
        }
    }
  });

  if (!rajaPane) {
      console.log('Raja Pane not found!');
      return;
  }

  console.log(`Found: ${rajaPane.name} (Gen ?)`);
  
  if (rajaPane.parent && rajaPane.parent.husband) {
      console.log(` Father: ${rajaPane.parent.husband.name}`);
      const father = await prisma.person.findUnique({
          where: { id: rajaPane.parent.husband.id },
          include: { parent: { include: { husband: true } } }
      });
      if(father?.parent?.husband) {
           console.log(`  Grandfather: ${father.parent.husband.name}`);
      }
  }

  console.log(' Children of Raja Pane (Sitorus Pane generation):');
  if (rajaPane.marriagesAsHusband.length > 0) {
      for(const marriage of rajaPane.marriagesAsHusband) {
          for(const child of marriage.children) {
              console.log(`  - ${child.name}`);
          }
      }
  } else {
      console.log('  No children found via marriage.');
      // Check if attached directly? Current logic puts them in marriage.
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

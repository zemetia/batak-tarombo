import { PrismaClient, PersonStatus, Gender } from '@prisma/client'
import { lineageData, Ancestor } from '../src/lib/data';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient()

async function seedPerson(ancestor: Ancestor, parentMarriageId?: string) {
  // 1. Create the Person
  const person = await prisma.person.create({
    data: {
      id: ancestor.id,
      name: ancestor.name,
      gender: ancestor.gender === 'FEMALE' ? Gender.FEMALE : Gender.MALE,
      status: PersonStatus.ACTIVE,
      parentId: parentMarriageId, // Link to parent marriage
      detail: {
        create: {
          birthOrder: ancestor.birthOrder || 0,
          description: ancestor.description || `Generasi ke-${ancestor.generation}`,
          alternativeNames: ancestor.alternativeNames || [],
        }
      }
    },
  });

  console.log(`Created person: ${person.name} (Gen ${ancestor.generation})`);

  let marriageId: string | undefined;

  // 2. If 'wife' is specified, create wife and marriage
  if (ancestor.wife) {
    const wifeId = uuidv4();
    const wife = await prisma.person.create({
      data: {
        id: wifeId,
        name: ancestor.wife,
        gender: Gender.FEMALE,
        status: PersonStatus.ACTIVE,
        detail: {
            create: {
                 description: `Wife of ${ancestor.name}`
            }
        }
      }
    });
    console.log(`  Created wife: ${wife.name}`);

    // Create Marriage
    const marriage = await prisma.marriage.create({
      data: {
        husbandId: person.id,
        wifeId: wife.id,
      }
    }); 
    marriageId = marriage.id;
    console.log(`  Created marriage between ${person.name} and ${wife.name}`);
  } else if (ancestor.children && ancestor.children.length > 0) {
      // If there are children but no wife specified, we still need a marriage node (possibly with null wife or just a placeholder)
      // to assume the 'parent' relationship in this schema (Person -> Marriage <- Person)
      // If schema requires wifeId? wifeId is nullable in schema.
      
      const marriage = await prisma.marriage.create({
          data: {
              husbandId: person.id,
              // wife possibly unknown
          }
      });
      marriageId = marriage.id;
      console.log(`  Created single-parent/unknown-wife marriage for ${person.name}`);
  }

  // 3. Recurse for children
  if (ancestor.children && ancestor.children.length > 0 && marriageId) {
    for (const child of ancestor.children) {
      await seedPerson(child, marriageId);
    }
  }
}

async function main() {
  console.log('Start seeding ...');
  
  // Clean DB (Optional, be careful in prod, but safe for `db seed`)
  // await prisma.personRequest.deleteMany();
  // await prisma.request.deleteMany();
  // await prisma.personDetail.deleteMany();
  // await prisma.marriage.deleteMany();
  // await prisma.person.deleteMany();

  // Start with Root
  await seedPerson(lineageData);

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

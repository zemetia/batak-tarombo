
import { PrismaClient, Prisma } from '@prisma/client';
import type { Ancestor } from '@/lib/data';

const prisma = new PrismaClient();

async function isDescendant(personId: string, potentialDescendantId: string): Promise<boolean> {
    let currentNodeId: string | null = potentialDescendantId;

    while (currentNodeId) {
        if (currentNodeId === personId) {
            return true;
        }
        const person = await prisma.person.findUnique({
            where: { id: currentNodeId },
            select: { fatherId: true },
        });
        currentNodeId = person?.fatherId ?? null;
    }

    return false;
}

export async function getLineageTree(): Promise<Ancestor> {
  const people = await prisma.person.findMany({
    orderBy: [
        { generation: 'asc' },
        { birthOrder: 'asc' }
    ],
  });

  const peopleMap = new Map<string, Ancestor>();
  people.forEach(person => {
    peopleMap.set(person.id, {
        ...person,
        children: []
    });
  });

  const rootNodes: Ancestor[] = [];
  people.forEach(person => {
    if (person.fatherId && peopleMap.has(person.fatherId)) {
      const father = peopleMap.get(person.fatherId);
      father?.children?.push(peopleMap.get(person.id)!);
    } else {
      rootNodes.push(peopleMap.get(person.id)!);
    }
  });

  // Handle case where there might be no data
  if (rootNodes.length === 0) {
      // You might want to return a default structure or handle this case as an error
      // For now, returning a default root if no data exists.
      const defaultRoot: Ancestor = {
          id: 'temp-root',
          name: 'No Ancestors Found',
          generation: 0,
          children: []
      };
      return defaultRoot;
  }

  // This logic still assumes one root for the main tree view, but the DB can support multiple.
  return rootNodes[0];
}

export async function getAllPeople() {
    return prisma.person.findMany({ 
        orderBy: [
            { generation: 'asc' },
            { birthOrder: 'asc' }
        ]
    });
}

export async function addPerson(person: Omit<Ancestor, 'id' | 'children'>) {
    const newPerson = await prisma.person.create({
        data: {
            name: person.name,
            generation: person.generation,
            wife: person.wife,
            description: person.description,
            fatherId: person.fatherId,
            birthOrder: person.birthOrder,
        }
    });
    return newPerson;
}

export async function updatePerson(id: string, person: Partial<Omit<Ancestor, 'id' | 'children' | 'fatherId'>> & { fatherId?: string | null }) {
    
    if (person.fatherId !== undefined) {
        const newFatherId = person.fatherId === 'null' ? null : person.fatherId;

        // Validation: A person cannot be their own father.
        if (id === newFatherId) {
            throw new Error("A person cannot be their own father.");
        }

        // Validation: A person cannot be a child of one of their own descendants.
        if (newFatherId) {
             const isNewFatherADescendant = await isDescendant(id, newFatherId);
             if (isNewFatherADescendant) {
                 throw new Error("Cannot set a descendant as a father, as this would create a circular reference.");
             }
        }
        
        const dataToUpdate: Prisma.PersonUpdateInput = { ...person, fatherId: newFatherId };
        
        if (newFatherId) {
            const father = await prisma.person.findUnique({ where: { id: newFatherId }});
            if (father) {
                dataToUpdate.generation = father.generation + 1;
            }
        } else {
             dataToUpdate.generation = 1; 
        }

        const updatedPerson = await prisma.person.update({
            where: { id },
            data: dataToUpdate
        });
        return updatedPerson;

    } else {
         const updatedPerson = await prisma.person.update({
            where: { id },
            data: person
        });
        return updatedPerson;
    }
}

export async function deletePerson(id: string) {
    // To maintain data integrity, we should only delete a person if they have no children.
    const childrenCount = await prisma.person.count({
        where: { fatherId: id }
    });

    if (childrenCount > 0) {
        throw new Error("Cannot delete a person with children. Please delete their descendants first.");
    }
    
    const deletedPerson = await prisma.person.delete({
        where: { id }
    });
    return deletedPerson;
}

export async function reorderSiblings(personId: string, direction: 'up' | 'down') {
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new Error("Person not found");

    const siblings = await prisma.person.findMany({
        where: { fatherId: person.fatherId },
        orderBy: { birthOrder: 'asc' },
    });

    const currentIndex = siblings.findIndex(p => p.id === personId);
    if (currentIndex === -1) throw new Error("Person not found among siblings");

    let swapIndex = -1;
    if (direction === 'up' && currentIndex > 0) {
        swapIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
        swapIndex = currentIndex + 1;
    }

    if (swapIndex !== -1) {
        const otherSibling = siblings[swapIndex];

        // Swap birthOrder
        await prisma.$transaction([
            prisma.person.update({
                where: { id: person.id },
                data: { birthOrder: otherSibling.birthOrder },
            }),
            prisma.person.update({
                where: { id: otherSibling.id },
                data: { birthOrder: person.birthOrder },
            }),
        ]);
    }
    
    return await getAllPeople();
}

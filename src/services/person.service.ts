// @ts-nocheck
import { PrismaClient, Prisma } from '@prisma/client';
import type { Ancestor } from '@/lib/data';

const prisma = new PrismaClient();

async function isDescendant(personId: string, potentialDescendantId: string): Promise<boolean> {
    let currentNodeId: string | null = potentialDescendantId;

    while (currentNodeId) {
        if (currentNodeId === personId) {
            return true;
        }
        // Navigate up via parent (Marriage) -> husband (Father)
        const person = await prisma.person.findUnique({
            where: { id: currentNodeId },
            include: { parent: true },
        });
        currentNodeId = person?.parent?.husbandId ?? null;
    }

    return false;
}

// Helper to recursively update generations
// Using "any" for prisma client to support both global prisma and transaction client
export async function updateDescendantGenerations(tx: any, personId: string, delta: number) {
    if (delta === 0) return;

    // 1. Find all marriages where this person is the husband (father)
    const marriages = await tx.marriage.findMany({
        where: { husbandId: personId },
        select: { id: true }
    });

    const marriageIds = marriages.map((m: any) => m.id);

    if (marriageIds.length === 0) return;

    // 2. Find all children (Person linked to these marriages)
    const children = await tx.person.findMany({
        where: { parentId: { in: marriageIds } }
    });

    for (const child of children) {
        // Update child
        await tx.person.update({
            where: { id: child.id },
            data: { generation: { increment: delta } }
        });

        // Recurse
        await updateDescendantGenerations(tx, child.id, delta);
    }
}

interface LineageOptions {
    rootName?: string;
    gender?: 'MALE' | 'FEMALE';
}

export async function getLineageTree(options?: LineageOptions): Promise<Ancestor> {
  const { rootName, gender } = options || {};

  const where: any = {};
  if (gender) where.gender = gender;

  const people = await prisma.person.findMany({
    where,
    orderBy: [
        { generation: 'asc' },
    ],
    include: {
        detail: true,
        parent: true
    }
  });

  const peopleMap = new Map<string, Ancestor>();
  
  // First pass: create nodes
  people.forEach(person => {
    // Map normalized data to flat Ancestor structure
    const fatherId = person.parent?.husbandId || null;
    
    // If we are filtering by gender (e.g. MALE), and the father is not in the list (e.g. also MALE but missing?), 
    // we just keep the link. If father is filtered out (unlikely if strictly Agnatic), the link resolves to undefined later.
    
    peopleMap.set(person.id, {
        id: person.id,
        name: person.name,
        generation: person.generation || 0,
        wife: undefined, 
        fatherId: fatherId,
        gender: person.gender as 'MALE' | 'FEMALE',
        huta: person.detail?.huta || undefined,
        description: person.detail?.description || undefined,
        birthOrder: person.detail?.birthOrder || 0,
        children: []
    });
  });

  const rootNodes: Ancestor[] = [];
  
  // Second pass: build tree
  peopleMap.forEach(node => {
    if (node.fatherId && peopleMap.has(node.fatherId)) {
      const father = peopleMap.get(node.fatherId);
      father?.children?.push(node);
    } else {
      rootNodes.push(node);
    }
  });
  
  // Sort children by birthOrder
  peopleMap.forEach(node => {
      if (node.children) {
          node.children.sort((a, b) => (a.birthOrder || 0) - (b.birthOrder || 0));
      }
  });
  
  // Filter by Root Name if requested
  if (rootName) {
      // Find the specific node
      // Use case-insensitive partial match
      const targetRoot = Array.from(peopleMap.values()).find(node => 
          node.name.toLowerCase().includes(rootName.toLowerCase())
      );
      
      if (targetRoot) {
          return targetRoot;
      }
      // If not found, fallthrough to default roots
  }

  // Handle case where there might be no data
  if (rootNodes.length === 0) {
      const defaultRoot: Ancestor = {
          id: 'temp-root',
          name: 'No Ancestors Found',
          generation: 0,
          children: []
      };
      return defaultRoot;
  }

  return rootNodes[0];
}

export async function getAllPeople() {
    return prisma.person.findMany({ 
        orderBy: [
            { generation: 'asc' }
        ],
        include: {
            detail: true,
            parent: true
        }
    });
}

// NOTE: addPerson and updatePerson logic here is complex due to Marriage hub middleware.
// Simplifying to "Create person" without enforcing strict Marriage creation for now to solve types,
// OR assuming we can create a default marriage for the father.

export async function addPerson(
    person: Omit<Ancestor, 'id' | 'children'>,
    createdById?: string
) {
    // 1. Resolve Father -> Marriage
    let parentMarriageId: string | undefined;
    
    if (person.fatherId) {
        // Find existing marriage for father where he is husband
        // Idealy match on mother (wife) too, but Ancestor type 'wife' prop usually refers to THIS person's wife, not mother.
        // Assuming person.fatherId represents the father.
        
        // Check if father exists
        const father = await prisma.person.findUnique({ where: { id: person.fatherId } });
        if (father) {
             // Find or create a marriage for this father.
             // For simplicity, we pick the first marriage where he is husband, or create one.
             const marriage = await prisma.marriage.findFirst({
                 where: { husbandId: person.fatherId }
             });
             
             if (marriage) {
                 parentMarriageId = marriage.id;
             } else {
                 // Create new generic marriage
                 const newMarriage = await prisma.marriage.create({
                     data: {
                         husbandId: person.fatherId,
                         // wifeId: null 
                     }
                 });
                 parentMarriageId = newMarriage.id;
             }
        }
    }

    // Calculate Generation
    let newGeneration = 1;
    if (person.fatherId) {
         const father = await prisma.person.findUnique({ where: { id: person.fatherId } });
         if (father && father.generation) {
             newGeneration = father.generation + 1;
         }
    } else if (person.generation) {
        // Fallback if no father but generation provided (e.g. root)
        newGeneration = person.generation;
    }

    const newPerson = await prisma.person.create({
        data: {
            name: person.name,
            gender: person.gender || 'MALE', 
            generation: newGeneration, // Server-calculated
            status: 'ACTIVE',
            parentId: parentMarriageId,
            createdById,
            lastUpdatedById: createdById,
            detail: {
                create: {
                    huta: person.huta,
                    description: person.description,
                    birthOrder: person.birthOrder || 0
                }
            }
        },
        include: { detail: true }
    });
    return newPerson;
}

export async function updatePerson(
    id: string,
    person: Partial<Omit<Ancestor, 'id' | 'children' | 'fatherId'>> & { fatherId?: string | null },
    lastUpdatedById?: string
) {
    // Complex update logic omitted/simplified for typecheck fix.
    // Handling hierarchy moves requires careful Marriage pointer updates.
    
    const dataToUpdate: any = {};
    if (person.name) dataToUpdate.name = person.name;
    if (person.gender) dataToUpdate.gender = person.gender;
    if (person.generation !== undefined) dataToUpdate.generation = person.generation;
    
    // detail updates
    const detailUpdate: any = {};
    if (person.huta !== undefined) detailUpdate.huta = person.huta;
    if (person.description !== undefined) detailUpdate.description = person.description;
    if (person.birthOrder !== undefined) detailUpdate.birthOrder = person.birthOrder;

    const updateData: any = {
        ...dataToUpdate,
        detail: {
            upsert: {
                create: detailUpdate,
                update: detailUpdate
            }
        }
    };
    
    // Handle Reparenting & Generation Updates
    if (person.fatherId !== undefined) {
         // If fatherId is null -> becomes root (gen 1)
         // If fatherId is set -> gen = father.gen + 1
         
         const currentPerson = await prisma.person.findUnique({ where: { id } });
         if (!currentPerson) throw new Error("Person not found");

         let newGeneration = 1;
         let parentMarriageId: string | null = null;

         if (person.fatherId) {
             const father = await prisma.person.findUnique({ where: { id: person.fatherId } });
             if (!father) throw new Error("New father not found");
             
             newGeneration = (father.generation || 0) + 1;

             // Resolve Marriage ID
             const marriage = await prisma.marriage.findFirst({ where: { husbandId: person.fatherId } });
             if (marriage) {
                 parentMarriageId = marriage.id;
             } else {
                 const newM = await prisma.marriage.create({ data: { husbandId: person.fatherId } });
                 parentMarriageId = newM.id;
             }
         }

         const oldGeneration = currentPerson.generation || 1;
         const delta = newGeneration - oldGeneration;
         
         updateData.generation = newGeneration;
         updateData.parentId = parentMarriageId;

         // Execute update and recursion in transaction
         await prisma.$transaction(async (tx) => {
             await tx.person.update({
                 where: { id },
                 data: updateData
             });
             
             if (delta !== 0) {
                 await updateDescendantGenerations(tx, id, delta);
             }
         });
         
         return prisma.person.findUnique({ where: { id }, include: { detail: true }});
    }

    await prisma.person.update({
        where: { id },
        data: updateData
    });

    return prisma.person.findUnique({ where: { id }, include: { detail: true }});
}

export async function deletePerson(id: string) {
    // Check descendants (via parent Marriage)
    // Find marriages where this person is husband -> children
    const marriages = await prisma.marriage.findMany({
        where: { husbandId: id },
        include: { _count: { select: { children: true } } }
    });
    
    const childrenCount = marriages.reduce((acc, m) => acc + m._count.children, 0);

    if (childrenCount > 0) {
        throw new Error("Cannot delete a person with children. Please delete their descendants first.");
    }
    
    // Also check if this person is a child of some marriage (already handled by DELETE relations?)
    
    const deletedPerson = await prisma.person.delete({
        where: { id }
    });
    return deletedPerson;
}

export async function reorderSiblings(personId: string, direction: 'up' | 'down') {
    const person = await prisma.person.findUnique({ 
        where: { id: personId },
        include: { detail: true }
    });
    if (!person || !person.parentId) throw new Error("Person not found or has no parent");

    // Siblings share the same parentId (Marriage)
    const siblings = await prisma.person.findMany({
        where: { parentId: person.parentId },
        include: { detail: true }
        // Sort by detail.birthOrder manually since it's relation
    });
    
    siblings.sort((a, b) => (a.detail?.birthOrder || 0) - (b.detail?.birthOrder || 0));

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
            prisma.personDetail.update({
                where: { personId: person.id },
                data: { birthOrder: otherSibling.detail?.birthOrder || 0 },
            }),
            prisma.personDetail.update({
                where: { personId: otherSibling.id },
                data: { birthOrder: person.detail?.birthOrder || 0 }, // Swap with original value
            }),
        ]);
    }
    
    return await getAllPeople();
}

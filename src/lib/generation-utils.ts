import { PrismaClient } from '@prisma/client';

/**
 * Recalculates and updates the generation for all persons in the database.
 * Logic: Person -> ParentId (Marriage) -> HusbandId (Father)
 * 
 * Roots (no known father) start at generation 1.
 * Children are Father's Generation + 1.
 */
export async function recalculateGenerations(prisma: PrismaClient | any, dryRun = false) {
  console.log("Fetching all persons and marriages...");
  
  // Fetch only necessary fields
  const allPersons = await prisma.person.findMany({
    select: { id: true, parentId: true, name: true, generation: true, status: true }
  });

  const allMarriages = await prisma.marriage.findMany({
    select: { id: true, husbandId: true }
  });

  // Index marriages by ID for O(1) lookup
  const marriageMap = new Map<string, string>(); // MarriageId -> HusbandId
  for (const m of allMarriages) {
    marriageMap.set(m.id, m.husbandId);
  }

  // Build Adjacency List: FatherID -> List<ChildID>
  // Also track Child -> Father for verification
  const childrenMap = new Map<string, string[]>(); // FatherId -> [ChildIds]
  const parentMap = new Map<string, string>(); // ChildId -> FatherId
  const roots: string[] = [];

  for (const p of allPersons) {
    let fatherId: string | undefined;
    
    if (p.parentId && marriageMap.has(p.parentId)) {
      fatherId = marriageMap.get(p.parentId);
    }
    
    if (fatherId) {
      if (!childrenMap.has(fatherId)) childrenMap.set(fatherId, []);
      childrenMap.get(fatherId)!.push(p.id);
      parentMap.set(p.id, fatherId);
    } else {
      roots.push(p.id);
    }
  }

  console.log(`Found ${roots.length} roots (persons with no recorded father).`);

  // BFS/DFS to assign generations
  const newGenerations = new Map<string, number>();
  const queue: Array<{ id: string, gen: number }> = [];

  // Initialize roots
  for (const rootId of roots) {
    // Check if valid person (sanity check)
    // For roots, if they have NULL generation, start at 1?
    // "Si Raja Batak" usually 1. 
    newGenerations.set(rootId, 1);
    queue.push({ id: rootId, gen: 1 });
  }

  // Iterate
  // Use a visited set to detect cycles (though ideally none exist)
  const visited = new Set<string>(roots);

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    
    // Process children
    const children = childrenMap.get(id);
    if (children) {
      const nextGen = gen + 1;
      for (const childId of children) {
          if (!visited.has(childId)) {
            newGenerations.set(childId, nextGen);
            visited.add(childId);
            queue.push({ id: childId, gen: nextGen });
          } else {
            // Cycle detected or multi-path? Tree should be acyclic.
            // If already visited, we might have a cycle or cross-link (unlikely in tree).
            console.warn(`Cycle or multi-path detected for person ${childId}`);
          }
      }
    }
  }

  // Prepare updates
  let updateCount = 0;
  const updates: Array<Promise<any>> = [];

  console.log("Analyzing changes...");

  // Batch updates? Or individual?
  // Prisma doesn't support bulk update with different values easily without separate queries.
  // We can use $transaction for batches.

  for (const p of allPersons) {
    const calculatedGen = newGenerations.get(p.id) || 1; // Default to 1 if unconnected? (Shared orphan)
    
    if (p.generation !== calculatedGen) {
      // console.log(`update ${p.name}: ${p.generation} -> ${calculatedGen}`);
      if (!dryRun) {
        updates.push(prisma.person.update({
          where: { id: p.id },
          data: { generation: calculatedGen }
        }));
      }
      updateCount++;
    }
  }

  console.log(`Requires update for ${updateCount} persons.`);

  if (!dryRun && updateCount > 0) {
    console.log("Applying updates...");
    
    // Process in chunks to avoid transaction limits if huge
    const chunkSize = 100;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      await prisma.$transaction(chunk);
      console.log(`Processed ${Math.min(i + chunkSize, updates.length)} / ${updates.length}`);
    }
    console.log("Updates completed.");
  } else {
    console.log("No updates performed (Dry Run or Up to Date).");
  }

  return updateCount;
}

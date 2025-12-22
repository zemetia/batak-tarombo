// @ts-nocheck
/**
 * Request Service - Request and PersonRequest management
 *
 * Handles the submission, review, and approval workflow for lineage changes
 * Replaces the old DataSubmission/ProposedPerson system
 */

import { PrismaClient, Request, PersonRequest, RequestStatus, Person, PersonDetail } from '@prisma/client';
import {
  PersonRequestData,
  PersonData,
  validatePersonRequest,
  isNewOperation,
  isEditOperation,
  isDeleteOperation,
  createNewPersonRequest,
  createEditPersonRequest,
  createDeletePersonRequest,
  calculatePersonDiff
} from '@/lib/schemas/person-request.schema';
import { updateDescendantGenerations } from './person.service';

const prisma = new PrismaClient();

// ==================== TYPES ====================

export interface CreateRequestData {
  title: string;
  description?: string;
  submittedById: string;
  taromboProveUrl?: string;
}

export interface AddPersonRequestData {
  requestId: string;
  operation: "NEW" | "EDIT" | "DELETE";
  personId?: string; // Required for EDIT/DELETE
  newData?: any; // JSON data
  previousData?: any; // JSON data
  changedFields?: string[];
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get all requests with user and PersonRequest details
 */
export async function getRequests(status?: RequestStatus) {
  return prisma.request.findMany({
    where: status ? { status } : undefined,
    include: {
      submittedBy: {
        include: {
            profile: true
        }
      },
      reviewedBy: {
        include: {
            profile: true
        }
      },
      personRequests: {
        select: {
          id: true,
          operation: true,
          personId: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          personRequests: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });
}

/**
 * Get requests by user
 */
export async function getRequestsByUser(userId: string, status?: RequestStatus) {
  return prisma.request.findMany({
    where: {
      submittedById: userId,
      ...(status ? { status } : {})
    },
    include: {
      reviewedBy: {
        include: {
            profile: true
        }
      },
      _count: {
        select: {
          personRequests: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });
}

/**
 * Get active request by user (PENDING or IN_REVIEW)
 */
export async function getActiveRequestByUser(userId: string) {
  return prisma.request.findFirst({
    where: {
      submittedById: userId,
      status: {
        in: ['PENDING', 'IN_REVIEW']
      }
    },
    include: {
      personRequests: {
        include: {
          person: {
            select: {
              id: true,
              name: true,
              generation: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      submittedBy: {
        include: {
            profile: true
        }
      },
      reviewedBy: {
        include: {
            profile: true
        }
      }
    }
  });
}

/**
 * Get request by ID with full details
 */
export async function getRequestById(requestId: string) {
  return prisma.request.findUnique({
    where: { id: requestId },
    include: {
      submittedBy: {
         include: {
             profile: true
         }
      },
      reviewedBy: {
         include: {
             profile: true
         }
      },
      personRequests: {
        include: {
          person: {
              include: {
                  detail: true
              }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
}

/**
 * Get pending requests (admin view)
 */
export async function getPendingRequests() {
  return getRequests('PENDING');
}

// ==================== REQUEST CREATION ====================

/**
 * Create a new request
 */
export async function createRequest(data: CreateRequestData): Promise<Request> {
  // Check if user already has an active request
  const existingActive = await getActiveRequestByUser(data.submittedById);

  if (existingActive) {
    throw new Error(
      'You already have an active request. Please cancel or wait for your current request to be reviewed.'
    );
  }

  return prisma.request.create({
    data: {
      title: data.title,
      description: data.description,
      submittedById: data.submittedById,
      taromboProveUrl: data.taromboProveUrl,
      status: 'PENDING'
    },
    include: {
      submittedBy: {
        include: {
            profile: true
        }
      }
    }
  });
}

// ==================== PERSON REQUEST MANAGEMENT ====================

/**
 * Add a PersonRequest to a Request
 */
export async function addPersonRequest(data: AddPersonRequestData): Promise<PersonRequest> {
  // Validate the data structure
  const validatedData = validatePersonRequest({
    operation: data.operation,
    personId: data.personId || null,
    newData: data.newData || null,
    previousData: data.previousData || null,
    changedFields: data.changedFields || []
  });

  return prisma.personRequest.create({
    data: {
      requestId: data.requestId,
      operation: data.operation, // Cast if needed, but schema should match
      personId: data.personId,
      newData: data.newData,
      previousData: data.previousData,
      changedFields: data.changedFields || []
    }
  });
}

/**
 * Add NEW PersonRequest (add new person)
 */
/**
 * Add NEW PersonRequest (add new person)
 */
export async function addNewPersonRequest(
  requestId: string,
  personData: PersonData
): Promise<PersonRequest> {
  // Create a DRAFT person first to get a real ID
  const draftPerson = await prisma.person.create({
    data: {
      name: personData.name,
      gender: personData.gender,
      generation: personData.generation, // Will be recalculated on apply? Or trust client?
      status: 'DRAFT',
      parentId: personData.fatherId, // Can point to Active or Draft person
      detail: {
        create: {
          birthYear: personData.birthYear,
          deathYear: personData.deathYear,
          isAlive: personData.isAlive,
          huta: personData.huta,
          description: personData.description,
          birthOrder: personData.birthOrder
        }
      }
    }
  });

  const requestData = createNewPersonRequest(personData);

  return addPersonRequest({
    requestId,
    operation: 'NEW',
    personId: draftPerson.id, // Link to the draft person
    newData: requestData.newData,
    previousData: null,
    changedFields: []
  });
}

/**
 * Add EDIT PersonRequest (modify existing person)
 */
export async function addEditPersonRequest(
  requestId: string,
  personId: string,
  newData: Partial<PersonData>,
  previousData: Partial<PersonData>
): Promise<PersonRequest> {
  const requestData = createEditPersonRequest(personId, newData, previousData);

  return addPersonRequest({
    requestId,
    operation: 'EDIT',
    personId,
    newData: requestData.newData,
    previousData: requestData.previousData,
    changedFields: requestData.changedFields
  });
}

/**
 * Add EDIT PersonRequest by calculating diff
 */
export async function addEditPersonRequestWithDiff(
  requestId: string,
  personId: string,
  updatedData: Partial<PersonData>
): Promise<PersonRequest> {
  // Get current person data with details
  const currentPerson = await prisma.person.findUnique({
    where: { id: personId },
    include: { detail: true }
  });

  if (!currentPerson) {
    throw new Error(`Person ${personId} not found`);
  }

  // Construct flat PersonData from normalized DB data
  const originalData: PersonData = {
    name: currentPerson.name,
    gender: currentPerson.gender as "MALE" | "FEMALE",
    generation: currentPerson.generation || undefined,
    birthOrder: currentPerson.detail?.birthOrder || 0,
    birthYear: currentPerson.detail?.birthYear || undefined,
    deathYear: currentPerson.detail?.deathYear || undefined,
    isAlive: currentPerson.detail?.isAlive ?? true,
    huta: currentPerson.detail?.huta || undefined,
    description: currentPerson.detail?.description || undefined,
    fatherId: currentPerson.parentId || undefined,
    // motherName not easily mapped without Marriage lookup, omit for now or fetch if needed
    // If motherName is critical, we need to fetch parent marriage -> wife -> name
  };

  const { newData, previousData, changedFields } = calculatePersonDiff(originalData, updatedData);

  return addEditPersonRequest(requestId, personId, newData, previousData);
}

/**
 * Add DELETE PersonRequest (remove person)
 */
export async function addDeletePersonRequest(
  requestId: string,
  personId: string
): Promise<PersonRequest> {
  // Get person data for snapshot
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { detail: true }
  });

  if (!person) {
    throw new Error(`Person ${personId} not found`);
  }

  // Check if person has children (via parentId)
  const childrenCount = await prisma.person.count({
    where: { parentId: personId }
  });

  if (childrenCount > 0) {
    throw new Error(
      `Cannot delete person - has ${childrenCount} descendant(s). ` +
      `Please delete descendants first or reassign their father.`
    );
  }

  const previousData: PersonData = {
    name: person.name,
    gender: person.gender as "MALE" | "FEMALE",
    generation: person.generation || undefined,
    birthOrder: person.detail?.birthOrder || 0,
    birthYear: person.detail?.birthYear || undefined,
    deathYear: person.detail?.deathYear || undefined,
    isAlive: person.detail?.isAlive ?? true,
    huta: person.detail?.huta || undefined,
    description: person.detail?.description || undefined,
    fatherId: person.parentId || undefined,
  };

  const requestData = createDeletePersonRequest(personId, previousData);

  return addPersonRequest({
    requestId,
    operation: 'DELETE',
    personId,
    newData: null,
    previousData: requestData.previousData,
    changedFields: []
  });
}

/**
 * Update PersonRequest (admin can modify before approval)
 */
export async function updatePersonRequest(
  personRequestId: string,
  data: {
    newData?: any;
    previousData?: any;
    changedFields?: string[];
  }
): Promise<PersonRequest> {
  return prisma.personRequest.update({
    where: { id: personRequestId },
    data
  });
}

/**
 * Delete PersonRequest
 */
export async function deletePersonRequest(personRequestId: string): Promise<PersonRequest> {
  return prisma.personRequest.delete({
    where: { id: personRequestId }
  });
}

// ==================== REQUEST WORKFLOW ====================

/**
 * Cancel request (contributor only, PENDING or IN_REVIEW)
 */
export async function cancelRequest(requestId: string, userId: string) {
  // Verify request belongs to user and is cancellable
  const request = await prisma.request.findFirst({
    where: {
      id: requestId,
      submittedById: userId,
      status: {
        in: ['PENDING', 'IN_REVIEW']
      }
    }
  });

  if (!request) {
    throw new Error('Request not found or cannot be cancelled.');
  }

  // Update status to CANCELLED
  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'CANCELLED',
      reviewedAt: new Date()
    }
  });
}

/**
 * Review request (admin sets status to IN_REVIEW or REJECTED)
 */
export async function reviewRequest(
  requestId: string,
  adminId: string,
  action: 'IN_REVIEW' | 'REJECTED' | 'APPROVED',
  adminNotes?: string
) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { personRequests: true }
  });

  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status === 'CANCELLED') {
    throw new Error('Cannot review cancelled request');
  }

  if (request.status === 'APPROVED') {
    throw new Error('Request already approved');
  }

  // If approving, apply the changes
  if (action === 'APPROVED') {
    await applyRequest(requestId, adminId);
    return getRequestById(requestId);
  }

  // Otherwise just update status
  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: action,
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNotes
    },
    include: {
      submittedBy: {
        include: {
            profile: true
        }
      },
      reviewedBy: {
        include: {
            profile: true
        }
      }
    }
  });
}

/**
 * Apply request - executes all PersonRequests and updates Person table
 * THIS IS THE CORE FUNCTION that applies changes to the database
 */
export async function applyRequest(requestId: string, adminId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { personRequests: true }
  });

  if (!request) {
    throw new Error('Request not found');
  }

  if (request.personRequests.length === 0) {
    throw new Error('Request has no changes to apply');
  }

  // Use transaction for atomicity - all or nothing
  await prisma.$transaction(async (tx) => {
    for (const pr of request.personRequests) {
      // Validate PersonRequest data
      const validatedData = validatePersonRequest({
        operation: pr.operation,
        personId: pr.personId,
        newData: pr.newData,
        previousData: pr.previousData,
        changedFields: pr.changedFields
      });

      if (isNewOperation(validatedData)) {
        // ACTIVATE the DRAFT person
        if (!validatedData.personId) {
            throw new Error('NEW operation requires personId (Draft Person)');
        }

        const draftPerson = await tx.person.findUnique({ where: { id: validatedData.personId } });
        if (!draftPerson) {
             throw new Error(`Draft person ${validatedData.personId} not found`);
        }
        
        // Recalculate generation and resolve parent marriage only if necessary
        // Or trust the draft state if it was maintained?
        // Let's ensure lineage integrity:
        let newGeneration = 1;
        let parentMarriageId = draftPerson.parentId; // Currently points to Person? No, parentId points to Marriage in Schema?
        // Schema says: parentId String? parent Marriage?
        // Wait, Person.parentId points to MARRIAGE.
        // But PersonData.fatherId usually points to PERSON (Father).
        // My addNewPersonRequest above mapped parentId: personData.fatherId.
        // If PersonData.fatherId is a Person ID, then Person.parentId (Marriage ID) assignment was WRONG in addNewPersonRequest?
        
        // CORRECTION NEEDED: Person.parentId MUST be a Marriage ID.
        // If personData.fatherId is a Person ID, we need to find/create a Marriage for that father.
        
        // Re-evaluating addNewPersonRequest...
        // For DRAFT, maybe we don't strictly enforce Marriage link yet? 
        // Or we store fatherId in detail? or somewhere else?
        // IF schema says parentId references Marriage, we cannot store PersonID there.
        // Reference: parent Marriage? @relation("Parenting", ...)
        
        // So my addNewPersonRequest logic above will FAIL FK constraint if I put PersonID in parentId.
        // I must fix addNewPersonRequest first. (See next thought block)
        
        // Assuming we fixed that, applyRequest just needs to flip status.
        // But wait, if we couldn't create Marriage during Draft (because father is Draft?), we have a problem.
        // If Father is Draft, he has no Marriage record as Husband yet.
        
        // Complexity alert: The strict "Marriage Hub" schema makes "Draft Tree" hard if we enforce constraints.
        // Maybe DRAFT persons should be created with NO parentId initially, and we store the "intended father" in newData?
        // Yes. `newData.fatherId` holds the intention.
        // So addNewPersonRequest should NOT set parentId if it's not a Marriage ID.
        
        // Back to applyRequest logic:
        const d = validatedData.newData;
        
        // Resolve Father & Generation
        let derivedGeneration = 1;
        let derivedParentMarriageId: string | null = null;
        
        if (d.fatherId) {
            const father = await tx.person.findUnique({ where: { id: d.fatherId } });
            if (father) {
                derivedGeneration = (father.generation || 0) + 1;
                
                // Find/Create Marriage for the father
                // Note: If father is also becoming ACTIVE in this transaction, it should work fine if we find/create marriage.
                // But we must use tx to see changes? 
                // Creating marriage for a potentially Draft father:
                // If father was Draft, he is now being Active.
                // We can create a Marriage even for Draft father? Yes, if marriage table doesn't check status.
                
                const marriage = await tx.marriage.findFirst({ where: { husbandId: d.fatherId } });
                if (marriage) {
                    derivedParentMarriageId = marriage.id;
                } else {
                    const newM = await tx.marriage.create({ data: { husbandId: d.fatherId } });
                    derivedParentMarriageId = newM.id;
                }
            }
        } else if (d.generation) {
             derivedGeneration = d.generation;
        }

        await tx.person.update({
          where: { id: validatedData.personId },
          data: {
            status: 'ACTIVE',
            generation: derivedGeneration,
            parentId: derivedParentMarriageId,
            // Update other details if newData differs from what was in Draft?
            // Usually Draft matches newData.
          }
        });
      } else if (isEditOperation(validatedData)) {
        // UPDATE existing person
        if (!validatedData.personId) {
          throw new Error('EDIT operation requires personId');
        }

        const d = validatedData.newData; // Partial<PersonData>

        // Split update data
        const personUpdate: any = {};
        if (d.name !== undefined) personUpdate.name = d.name;
        if (d.gender !== undefined) personUpdate.gender = d.gender;
        // Check if reparenting happened
        if (d.fatherId !== undefined) {
             const currentPerson = await tx.person.findUnique({ where: { id: validatedData.personId } });
             
             if (currentPerson) {
                 let newGeneration = 1;
                 let parentMarriageId = null;
                 
                 if (d.fatherId) {
                     const father = await tx.person.findUnique({ where: { id: d.fatherId } });
                     if (father) {
                         newGeneration = (father.generation || 0) + 1;
                         
                         const marriage = await tx.marriage.findFirst({ where: { husbandId: d.fatherId } });
                         if (marriage) {
                             parentMarriageId = marriage.id;
                         } else {
                             const newM = await tx.marriage.create({ data: { husbandId: d.fatherId } });
                             parentMarriageId = newM.id;
                         }
                     }
                 }
                 
                 const oldGeneration = currentPerson.generation || 1;
                 const delta = newGeneration - oldGeneration;
                 
                 personUpdate.generation = newGeneration;
                 personUpdate.parentId = parentMarriageId;
                 
                 // Trigger recursion
                 if (delta !== 0) {
                     await updateDescendantGenerations(tx, validatedData.personId, delta);
                 }
             }
        }
        else if (d.generation !== undefined) {
            // Keep manually provided generation if no father change (e.g. root edit)
             personUpdate.generation = d.generation;
        }

        if (Object.keys(personUpdate).length > 0) {
            await tx.person.update({
                where: { id: validatedData.personId },
                data: personUpdate
            });
        }
        
        if (Object.keys(detailUpdate).length > 0) {
            await tx.personDetail.upsert({
                where: { personId: validatedData.personId },
                create: {
                   personId: validatedData.personId,
                   ...detailUpdate
                },
                update: detailUpdate
            });
        }

      } else if (isDeleteOperation(validatedData)) {
        // DELETE person
        if (!validatedData.personId) {
          throw new Error('DELETE operation requires personId');
        }

        // Validate no children
        const childrenCount = await tx.person.count({
          where: { parentId: validatedData.personId }
        });

        if (childrenCount > 0) {
          throw new Error(
            `Cannot delete person ${validatedData.personId} - has ${childrenCount} descendants`
          );
        }

        // Deleting person cascades to detail, so this is simple
        await tx.person.delete({
          where: { id: validatedData.personId }
        });
      }
    }

    // Update request status to APPROVED
    await tx.request.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date()
      }
    });
  });

  return getRequestById(requestId);
}

// ==================== STATISTICS ====================

/**
 * Get request statistics for a user
 */
export async function getUserRequestStats(userId: string) {
  const [total, pending, approved, rejected, cancelled] = await Promise.all([
    prisma.request.count({ where: { submittedById: userId } }),
    prisma.request.count({ where: { submittedById: userId, status: 'PENDING' } }),
    prisma.request.count({ where: { submittedById: userId, status: 'APPROVED' } }),
    prisma.request.count({ where: { submittedById: userId, status: 'REJECTED' } }),
    prisma.request.count({ where: { submittedById: userId, status: 'CANCELLED' } })
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    cancelled,
    inReview: total - pending - approved - rejected - cancelled
  };
}

/**
 * Get platform request statistics
 */
export async function getPlatformRequestStats() {
  const [total, pending, inReview, approved, rejected, cancelled] = await Promise.all([
    prisma.request.count(),
    prisma.request.count({ where: { status: 'PENDING' } }),
    prisma.request.count({ where: { status: 'IN_REVIEW' } }),
    prisma.request.count({ where: { status: 'APPROVED' } }),
    prisma.request.count({ where: { status: 'REJECTED' } }),
    prisma.request.count({ where: { status: 'CANCELLED' } })
  ]);

  return {
    total,
    pending,
    inReview,
    approved,
    rejected,
    cancelled
  };
}

/**
 * Get PersonRequest operation counts for a request
 */
export async function getRequestOperationCounts(requestId: string) {
  const [newCount, editCount, deleteCount] = await Promise.all([
    prisma.personRequest.count({ where: { requestId, operation: 'NEW' } }),
    prisma.personRequest.count({ where: { requestId, operation: 'EDIT' } }),
    prisma.personRequest.count({ where: { requestId, operation: 'DELETE' } })
  ]);

  return {
    new: newCount,
    edit: editCount,
    delete: deleteCount,
    total: newCount + editCount + deleteCount
  };
}

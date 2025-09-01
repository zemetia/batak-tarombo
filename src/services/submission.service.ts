import { PrismaClient, DataSubmission } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSubmissions() {
    return prisma.dataSubmission.findMany({
        include: {
            submittedBy: {
                select: {
                    fullName: true,
                    email: true,
                    whatsapp: true
                }
            },
            reviewedBy: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            submittedAt: 'desc'
        }
    });
}

export async function getSubmissionsByContributor(contributorId: string) {
    return prisma.dataSubmission.findMany({
        where: {
            contributorId
        },
        include: {
            reviewedBy: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            submittedAt: 'desc'
        }
    });
}

export async function getActiveProposalByContributor(contributorId: string) {
    return prisma.dataSubmission.findFirst({
        where: {
            contributorId,
            status: {
                in: ['waiting', 'in_review']
            }
        },
        include: {
            proposedPersons: true,
            submittedBy: {
                select: {
                    fullName: true,
                    email: true
                }
            },
            reviewedBy: {
                select: {
                    name: true
                }
            }
        }
    });
}

export async function createProposal(data: {
    changesDetail: string;
    taromboProve: string;
    ancestorName: string;
    selectedAncestorId: string;
    proposalType?: string;
    contributorId: string;
}) {
    // Check if contributor already has an active proposal
    const existingActiveProposal = await getActiveProposalByContributor(data.contributorId);
    
    if (existingActiveProposal) {
        throw new Error('You already have an active proposal. Please cancel or wait for your current proposal to be reviewed.');
    }

    // Create the proposal with selected ancestor
    return prisma.dataSubmission.create({
        data: {
            changesDetail: data.changesDetail,
            taromboProve: data.taromboProve,
            ancestorName: data.ancestorName,
            selectedAncestorId: data.selectedAncestorId,
            proposalType: data.proposalType || 'lineage_edit',
            contributorId: data.contributorId
        },
        include: {
            submittedBy: {
                select: {
                    fullName: true
                }
            }
        }
    });
}

export async function cancelProposal(proposalId: string, contributorId: string) {
    // Verify the proposal belongs to the contributor and is cancellable
    const proposal = await prisma.dataSubmission.findFirst({
        where: {
            id: proposalId,
            contributorId,
            status: {
                in: ['waiting', 'in_review']
            }
        }
    });

    if (!proposal) {
        throw new Error('Proposal not found or cannot be cancelled.');
    }

    // Delete associated proposed persons and update status
    await prisma.$transaction([
        prisma.proposedPerson.deleteMany({
            where: {
                dataSubmissionId: proposalId
            }
        }),
        prisma.dataSubmission.update({
            where: { id: proposalId },
            data: {
                status: 'cancelled',
                reviewedAt: new Date()
            }
        })
    ]);

    return { success: true, message: 'Proposal cancelled successfully.' };
}

export async function forkDescendantTree(ancestorId: string, proposalId: string) {
    // Get all people in the database
    const allPeople = await prisma.person.findMany();
    const peopleMap = new Map(allPeople.map(p => [p.id, p]));

    // Find all descendants of the selected ancestor
    const descendants: any[] = [];
    const queue = [ancestorId];
    const processedIds = new Set<string>();

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        
        if (processedIds.has(currentId)) continue;
        processedIds.add(currentId);

        const person = peopleMap.get(currentId);
        if (!person) continue;

        // Add current person to descendants
        descendants.push({
            originalPersonId: person.id,
            name: person.name,
            generation: person.generation,
            wife: person.wife,
            description: person.description,
            birthOrder: person.birthOrder,
            dataSubmissionId: proposalId
        });

        // Find children
        const children = allPeople.filter(p => p.fatherId === currentId);
        children.forEach(child => {
            if (!processedIds.has(child.id)) {
                queue.push(child.id);
            }
        });
    }

    // Create all proposed persons in a transaction
    const proposedPersonsData = descendants.map((desc, index) => ({
        ...desc,
        id: undefined // Let Prisma generate new IDs
    }));

    // Create proposed persons and establish relationships
    const createdProposedPersons = [];
    const originalToProposedIdMap = new Map<string, string>();

    // First pass: create all proposed persons without father relationships
    for (const personData of proposedPersonsData) {
        const created = await prisma.proposedPerson.create({
            data: {
                name: personData.name,
                generation: personData.generation,
                wife: personData.wife,
                description: personData.description,
                birthOrder: personData.birthOrder,
                originalPersonId: personData.originalPersonId,
                dataSubmissionId: proposalId
            }
        });
        
        createdProposedPersons.push(created);
        originalToProposedIdMap.set(personData.originalPersonId, created.id);
    }

    // Second pass: establish father relationships
    for (const proposedPerson of createdProposedPersons) {
        const originalPerson = peopleMap.get(proposedPerson.originalPersonId!);
        if (originalPerson?.fatherId && originalToProposedIdMap.has(originalPerson.fatherId)) {
            const proposedFatherId = originalToProposedIdMap.get(originalPerson.fatherId);
            
            await prisma.proposedPerson.update({
                where: { id: proposedPerson.id },
                data: { fatherId: proposedFatherId }
            });
        }
    }

    return createdProposedPersons;
}

// Proposal editing functions
export async function updateProposedPerson(id: string, data: {
    name?: string;
    wife?: string | null;
    description?: string | null;
    birthOrder?: number;
}) {
    return prisma.proposedPerson.update({
        where: { id },
        data
    });
}

export async function addProposedPerson(data: {
    name: string;
    generation: number;
    wife?: string | null;
    description?: string | null;
    birthOrder?: number;
    fatherId?: string | null;
    dataSubmissionId: string;
}) {
    return prisma.proposedPerson.create({
        data
    });
}

export async function deleteProposedPerson(id: string) {
    // Check if this person has children
    const childrenCount = await prisma.proposedPerson.count({
        where: { fatherId: id }
    });

    if (childrenCount > 0) {
        throw new Error("Cannot delete a person with children. Please delete their descendants first.");
    }

    return prisma.proposedPerson.delete({
        where: { id }
    });
}

export async function reorderProposedSiblings(personId: string, direction: 'up' | 'down') {
    const person = await prisma.proposedPerson.findUnique({ where: { id: personId } });
    if (!person) throw new Error("Person not found");

    const siblings = await prisma.proposedPerson.findMany({
        where: { 
            fatherId: person.fatherId,
            dataSubmissionId: person.dataSubmissionId 
        },
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
            prisma.proposedPerson.update({
                where: { id: person.id },
                data: { birthOrder: otherSibling.birthOrder },
            }),
            prisma.proposedPerson.update({
                where: { id: otherSibling.id },
                data: { birthOrder: person.birthOrder },
            }),
        ]);
    }
    
    return await prisma.proposedPerson.findMany({
        where: { dataSubmissionId: person.dataSubmissionId },
        orderBy: [
            { generation: 'asc' },
            { birthOrder: 'asc' }
        ]
    });
}

export async function createSubmission(data: {
    changesDetail: string;
    taromboProve: string;
    ancestorName: string;
    fatherName?: string;
    contributorId: string;
}) {
    return prisma.dataSubmission.create({
        data,
        include: {
            submittedBy: {
                select: {
                    fullName: true
                }
            }
        }
    });
}

export async function updateSubmissionStatus(
    id: string, 
    status: 'waiting' | 'in_review' | 'accepted' | 'accepted_with_discuss' | 'rejected',
    adminId: string,
    adminNotes?: string
) {
    return prisma.dataSubmission.update({
        where: { id },
        data: {
            status,
            adminId,
            adminNotes,
            reviewedAt: new Date()
        },
        include: {
            submittedBy: {
                select: {
                    fullName: true,
                    email: true
                }
            },
            reviewedBy: {
                select: {
                    name: true
                }
            }
        }
    });
}

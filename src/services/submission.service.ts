
import { Request } from '@prisma/client';
import * as RequestService from './request.service';

// Adapter function to map Request to old DataSubmission shape if strictly needed,
// but for now, we'll try to just return the Request object and see if callers adapt.
// Ideally, callers should be updated to use RequestService directly.

/**
 * @deprecated Use RequestService.createRequest instead
 */
export async function createProposal(data: {
    changesDetail: string;
    taromboProve: string;
    ancestorName: string;
    selectedAncestorId: string;
    proposalType?: string;
    contributorId: string;
}) {
    return RequestService.createRequest({
        title: data.ancestorName ? `Changes to ${data.ancestorName}'s lineage` : 'Lineage update',
        description: data.changesDetail,
        submittedById: data.contributorId,
        taromboProveUrl: data.taromboProve
    });
}

/**
 * @deprecated Use RequestService.cancelRequest instead
 */
export async function cancelProposal(proposalId: string, contributorId: string) {
    return RequestService.cancelRequest(proposalId, contributorId);
}

/**
 * @deprecated Use PersonRequest system in RequestService instead
 */
export async function forkDescendantTree(ancestorId: string, proposalId: string) {
    throw new Error('forkDescendantTree is deprecated. Use PersonRequest system via RequestService.');
}

/**
 * @deprecated Use RequestService instead
 */
export async function updateProposedPerson(id: string, data: any) {
    throw new Error('updateProposedPerson is deprecated. Use RequestService instead.');
}

/**
 * @deprecated Use RequestService instead
 */
export async function addProposedPerson(data: any) {
    throw new Error('addProposedPerson is deprecated. Use RequestService instead.');
}

/**
 * @deprecated Use RequestService instead
 */
export async function deleteProposedPerson(id: string) {
     throw new Error('deleteProposedPerson is deprecated. Use RequestService instead.');
}

/**
 * @deprecated Use RequestService instead
 */
export async function reorderProposedSiblings(personId: string, direction: 'up' | 'down') {
     throw new Error('reorderProposedSiblings is deprecated. Use RequestService instead.');
}

/**
 * @deprecated Use RequestService.createRequest instead
 */
export async function createSubmission(data: {
    changesDetail: string;
    taromboProve: string;
    ancestorName: string;
    fatherName?: string;
    contributorId: string;
}) {
    return RequestService.createRequest({
        title: `Changes to ${data.ancestorName}'s lineage`,
        description: data.changesDetail,
        submittedById: data.contributorId,
        taromboProveUrl: data.taromboProve
    });
}

/**
 * @deprecated Use RequestService.getRequests() instead
 */
export async function getSubmissions() {
    return RequestService.getRequests();
}

/**
 * @deprecated Use RequestService.getRequestsByUser() instead
 */
export async function getSubmissionsByContributor(contributorId: string) {
    return RequestService.getRequestsByUser(contributorId);
}

/**
 * @deprecated Use RequestService.getActiveRequestByUser() instead
 */
export async function getActiveProposalByContributor(contributorId: string) {
    return RequestService.getActiveRequestByUser(contributorId);
}


/**
 * @deprecated Use RequestService.reviewRequest instead
 */
export async function updateSubmissionStatus(
    id: string, 
    status: 'waiting' | 'in_review' | 'accepted' | 'accepted_with_discuss' | 'rejected',
    adminId: string,
    adminNotes?: string
) {
     // Map old status to new
  const statusMap: Record<string, 'IN_REVIEW' | 'APPROVED' | 'REJECTED'> = {
    'in_review': 'IN_REVIEW',
    'accepted': 'APPROVED',
    'accepted_with_discuss': 'APPROVED',
    'rejected': 'REJECTED'
  };

  const newStatus = statusMap[status] || 'IN_REVIEW';
  return RequestService.reviewRequest(id, adminId, newStatus, adminNotes);
}

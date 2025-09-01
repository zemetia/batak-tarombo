
'use server';

import type { Ancestor } from './data';
import * as PersonService from '@/services/person.service';
import * as AdminService from '@/services/admin.service';
import * as SubmissionService from '@/services/submission.service';
import * as ContributorService from '@/services/contributor.service';
import type { Contributor } from '@prisma/client';

export async function getLineageData(): Promise<Ancestor> {
  return PersonService.getLineageTree();
}

export async function getAllAncestors() {
    return PersonService.getAllPeople();
}

export async function getAdminUsers() {
    return AdminService.getAdmins();
}

export async function getContributors() {
    return AdminService.getContributors();
}

export async function getDataSubmissions() {
    return SubmissionService.getSubmissions();
}

export async function getSubmissionsByContributor(contributorId: string) {
    return SubmissionService.getSubmissionsByContributor(contributorId);
}

export async function adminLogin(email: string, password: string) {
    return AdminService.adminLogin(email, password);
}

export async function createAdmin(data: { name: string; email: string; password: string }) {
    return AdminService.createAdmin(data);
}

export async function updateSubmissionStatus(
    id: string, 
    status: 'waiting' | 'in_review' | 'accepted' | 'accepted_with_discuss' | 'rejected',
    adminId: string,
    adminNotes?: string
) {
    return SubmissionService.updateSubmissionStatus(id, status, adminId, adminNotes);
}

export async function createSubmission(data: {
    changesDetail: string;
    taromboProve: string;
    ancestorName: string;
    fatherName?: string;
    contributorId: string;
}) {
    return SubmissionService.createSubmission(data);
}

export async function registerContributor(data: Omit<Contributor, 'id' | 'createdAt' | 'updatedAt' | 'submissions'>) {
    return ContributorService.registerContributor(data);
}

export async function login(email: string, password: string):Promise<Contributor | null> {
    return ContributorService.login(email, password);
}

export async function addPerson(person: Omit<Ancestor, 'id' | 'children'>) {
    return PersonService.addPerson(person);
}

export async function updatePerson(id: string, person: Partial<Omit<Ancestor, 'id' | 'children'>>) {
    return PersonService.updatePerson(id, person);
}

export async function deletePerson(id: string) {
    return PersonService.deletePerson(id);
}

export async function reorderSiblings(personId: string, direction: 'up' | 'down') {
    return PersonService.reorderSiblings(personId, direction);
}

// Proposal-related actions
export async function getActiveProposal(contributorId: string) {
    return SubmissionService.getActiveProposalByContributor(contributorId);
}

export async function createProposal(data: {
    changesDetail: string;
    taromboProve: string;
    ancestorName: string;
    selectedAncestorId: string;
    proposalType?: string;
    contributorId: string;
}) {
    return SubmissionService.createProposal(data);
}

export async function cancelProposal(proposalId: string, contributorId: string) {
    return SubmissionService.cancelProposal(proposalId, contributorId);
}

export async function forkDescendantTree(ancestorId: string, proposalId: string) {
    return SubmissionService.forkDescendantTree(ancestorId, proposalId);
}

// Proposal editing actions
export async function updateProposedPerson(id: string, data: Partial<Omit<Ancestor, 'id' | 'children'>>) {
    return SubmissionService.updateProposedPerson(id, data);
}

export async function addProposedPerson(data: Omit<Ancestor, 'id' | 'children'> & { dataSubmissionId: string }) {
    return SubmissionService.addProposedPerson(data);
}

export async function deleteProposedPerson(id: string) {
    return SubmissionService.deleteProposedPerson(id);
}

export async function reorderProposedSiblings(personId: string, direction: 'up' | 'down') {
    return SubmissionService.reorderProposedSiblings(personId, direction);
}

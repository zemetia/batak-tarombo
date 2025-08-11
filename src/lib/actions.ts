
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

export async function getDataSubmissions() {
    return SubmissionService.getSubmissions();
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

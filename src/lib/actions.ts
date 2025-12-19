/**
 * Server Actions - API Layer
 *
 * This file provides server actions for Next.js App Router
 * Updated to use the new simplified schema (User, Request, PersonRequest)
 */

'use server';

import type { Ancestor } from './data';
import * as PersonService from '@/services/person.service';
import * as UserService from '@/services/user.service';
import * as RequestService from '@/services/request.service';
import type { UserRole, RequestStatus, OperationType } from '@prisma/client';
import type { PersonData } from '@/lib/schemas/person-request.schema';

// ==================== PERSON ACTIONS ====================

/**
 * Get full lineage tree
 */
export async function getLineageData(): Promise<Ancestor> {
  // Temporary: Enforce "Si Raja Batak" and "MALE" as per user request
  return PersonService.getLineageTree({
    rootName: "Si Raja Batak",
    gender: "MALE"
  });
}

/**
 * Get all people (flat list)
 */
export async function getAllAncestors() {
  return PersonService.getAllPeople();
}

/**
 * Add new person
 * @param person Person data
 * @param createdById User ID who is creating this person
 */
export async function addPerson(
  person: Omit<Ancestor, 'id' | 'children'>,
  createdById?: string
) {
  return PersonService.addPerson(person, createdById);
}

/**
 * Update existing person
 * @param id Person ID
 * @param person Updated person data
 * @param lastUpdatedById User ID who is updating this person
 */
export async function updatePerson(
  id: string,
  person: Partial<Omit<Ancestor, 'id' | 'children'>>,
  lastUpdatedById?: string
) {
  return PersonService.updatePerson(id, person, lastUpdatedById);
}

/**
 * Delete person (only if no children)
 */
export async function deletePerson(id: string) {
  return PersonService.deletePerson(id);
}

/**
 * Reorder siblings (change birth order)
 */
export async function reorderSiblings(personId: string, direction: 'up' | 'down') {
  return PersonService.reorderSiblings(personId, direction);
}

// ==================== USER ACTIONS (replaces Admin + Contributor) ====================

/**
 * Get all users with optional role filter
 */
export async function getUsers(role?: UserRole) {
  return UserService.getUsers(role);
}

/**
 * Get admin users only
 */
export async function getAdminUsers() {
  return UserService.getAdmins();
}

/**
 * Get contributors only
 */
export async function getContributors() {
  return UserService.getContributors();
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  return UserService.getUserById(id);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return UserService.getUserByEmail(email);
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  return UserService.getUserStats(userId);
}

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
  return UserService.getPlatformStats();
}

/**
 * Search users
 */
export async function searchUsers(query: string, role?: UserRole) {
  return UserService.searchUsers(query, role);
}

// ==================== AUTHENTICATION ACTIONS ====================

/**
 * Login with password (temporary - for migration period)
 * @deprecated Use loginWithFirebase after migration
 */
export async function loginWithPassword(email: string, password: string) {
  return UserService.loginWithPassword(email, password);
}

/**
 * Admin login (backward compatibility)
 * @deprecated Use loginWithPassword or loginWithFirebase
 */
export async function adminLogin(email: string, password: string) {
  return UserService.loginWithPassword(email, password);
}

/**
 * Contributor login (backward compatibility)
 * @deprecated Use loginWithPassword or loginWithFirebase
 */
export async function login(email: string, password: string) {
  return UserService.loginWithPassword(email, password);
}

/**
 * Login with Firebase token
 */
import { createSession } from '@/lib/auth/session';

/**
 * Login with Firebase token
 */
export async function loginWithFirebase(firebaseData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: 'GOOGLE' | 'FACEBOOK' | 'EMAIL' | 'PHONE';
}) {
  const result = await UserService.loginWithFirebase(firebaseData);
  
  // Create session cookie
  if (result.user) {
    await createSession(
      result.user.id,
      result.user.email,
      result.user.role,
      result.user.profile?.fullName,
      result.user.profile?.photoURL || undefined
    );
  }

  return result;
}

/**
 * Complete user profile
 */
export async function completeUserProfile(
  userId: string,
  data: {
    fullName: string;
    birthYear: number;
    city: string;
    marga: string;
    whatsapp: string;
    gender?: 'MALE' | 'FEMALE';
  }
) {
  const result = await UserService.completeUserProfile(userId, data);
  
  // Refresh session with new profile data
  if (result.user) {
      await createSession(
        result.user.id,
        result.user.email,
        result.user.role,
        result.user.profile?.fullName,
        result.user.profile?.photoURL || undefined
      );
  }
  
  return result;
}

/**
 * Link existing user to Firebase account
 */
export async function linkFirebaseAccount(userId: string, firebaseData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: 'GOOGLE' | 'FACEBOOK' | 'EMAIL' | 'PHONE';
}) {
  const user = await UserService.linkFirebaseAccount(userId, firebaseData);
  
  // Refresh session
  await createSession(
    user.id,
    user.email,
    user.role,
    user.profile?.fullName,
    user.profile?.photoURL || undefined
  );
  
  return user;
}

/**
 * Logout
 */
export async function logout() {
  const { deleteSession } = await import('@/lib/auth/session');
  await deleteSession();
  return { success: true };
}

// ==================== USER MANAGEMENT ACTIONS ====================

/**
 * Create new user
 */
export async function createUser(data: {
  email: string;
  fullName: string;
  password?: string;
  role: UserRole;
  marga?: string;
  birthday?: Date;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  facebook?: string;
  instagram?: string;
}) {
  return UserService.createUser(data);
}

/**
 * Create admin (backward compatibility)
 */
export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
}) {
  return UserService.createAdmin({
    fullName: data.name,
    email: data.email,
    password: data.password
  });
}

/**
 * Register contributor
 */
export async function registerContributor(data: {
  email: string;
  fullName: string;
  password: string;
  birthday?: Date;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  facebook?: string;
  instagram?: string;
}) {
  return UserService.registerContributor(data);
}

/**
 * Update user information
 */
export async function updateUser(userId: string, data: {
  fullName?: string;
  marga?: string;
  birthday?: Date;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  facebook?: string;
  instagram?: string;
}) {
  return UserService.updateUser(userId, data);
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: UserRole) {
  return UserService.updateUserRole(userId, role);
}

/**
 * Ban user
 */
export async function banUser(userId: string) {
  return UserService.banUser(userId);
}

/**
 * Unban user
 */
export async function unbanUser(userId: string) {
  return UserService.unbanUser(userId);
}

/**
 * Delete user
 */
export async function deleteUser(userId: string) {
  return UserService.deleteUser(userId);
}

// ==================== REQUEST ACTIONS (replaces DataSubmission) ====================

/**
 * Get all requests with optional status filter
 */
export async function getRequests(status?: RequestStatus) {
  return RequestService.getRequests(status);
}

/**
 * Get pending requests (admin view)
 */
export async function getPendingRequests() {
  return RequestService.getPendingRequests();
}

/**
 * Get data submissions (backward compatibility)
 * @deprecated Use getRequests()
 */
export async function getDataSubmissions() {
  return RequestService.getRequests();
}

/**
 * Get requests by user
 */
export async function getRequestsByUser(userId: string, status?: RequestStatus) {
  return RequestService.getRequestsByUser(userId, status);
}

/**
 * Get submissions by contributor (backward compatibility)
 * @deprecated Use getRequestsByUser()
 */
export async function getSubmissionsByContributor(contributorId: string) {
  return RequestService.getRequestsByUser(contributorId);
}

/**
 * Get active request by user (PENDING or IN_REVIEW)
 */
export async function getActiveRequest(userId: string) {
  return RequestService.getActiveRequestByUser(userId);
}

/**
 * Get active proposal (backward compatibility)
 * @deprecated Use getActiveRequest()
 */
export async function getActiveProposal(contributorId: string) {
  return RequestService.getActiveRequestByUser(contributorId);
}

/**
 * Get request by ID with full details
 */
export async function getRequestById(requestId: string) {
  return RequestService.getRequestById(requestId);
}

/**
 * Create new request
 */
export async function createRequest(data: {
  title: string;
  description?: string;
  submittedById: string;
  taromboProveUrl?: string;
}) {
  return RequestService.createRequest(data);
}

/**
 * Create submission (backward compatibility)
 * @deprecated Use createRequest()
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
 * Create proposal (backward compatibility)
 * @deprecated Use createRequest()
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
 * Cancel request
 */
export async function cancelRequest(requestId: string, userId: string) {
  return RequestService.cancelRequest(requestId, userId);
}

/**
 * Cancel proposal (backward compatibility)
 * @deprecated Use cancelRequest()
 */
export async function cancelProposal(proposalId: string, contributorId: string) {
  return RequestService.cancelRequest(proposalId, contributorId);
}

/**
 * Review request (admin)
 */
export async function reviewRequest(
  requestId: string,
  adminId: string,
  action: 'IN_REVIEW' | 'REJECTED' | 'APPROVED',
  adminNotes?: string
) {
  return RequestService.reviewRequest(requestId, adminId, action, adminNotes);
}

/**
 * Update submission status (backward compatibility)
 * @deprecated Use reviewRequest()
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

/**
 * Get request statistics
 */
export async function getRequestStats(userId: string) {
  return RequestService.getUserRequestStats(userId);
}

/**
 * Get platform request statistics
 */
export async function getPlatformRequestStats() {
  return RequestService.getPlatformRequestStats();
}

// ==================== PERSON REQUEST ACTIONS (replaces ProposedPerson) ====================

/**
 * Add NEW PersonRequest (create new person)
 */
export async function addNewPersonRequest(
  requestId: string,
  personData: PersonData
) {
  return RequestService.addNewPersonRequest(requestId, personData);
}

/**
 * Add EDIT PersonRequest (modify existing person)
 */
export async function addEditPersonRequest(
  requestId: string,
  personId: string,
  updatedData: Partial<PersonData>
) {
  return RequestService.addEditPersonRequestWithDiff(requestId, personId, updatedData);
}

/**
 * Add DELETE PersonRequest (remove person)
 */
export async function addDeletePersonRequest(
  requestId: string,
  personId: string
) {
  return RequestService.addDeletePersonRequest(requestId, personId);
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
) {
  return RequestService.updatePersonRequest(personRequestId, data);
}

/**
 * Delete PersonRequest
 */
export async function deletePersonRequest(personRequestId: string) {
  return RequestService.deletePersonRequest(personRequestId);
}

/**
 * Get operation counts for a request
 */
export async function getRequestOperationCounts(requestId: string) {
  return RequestService.getRequestOperationCounts(requestId);
}

// ==================== BACKWARD COMPATIBILITY (ProposedPerson) ====================
// These are deprecated but kept for gradual UI migration

/**
 * Fork descendant tree (deprecated)
 * @deprecated Use PersonRequest system instead
 */
export async function forkDescendantTree(ancestorId: string, proposalId: string) {
  throw new Error(
    'forkDescendantTree is deprecated. Use PersonRequest system: ' +
    'Create a Request, then add PersonRequests with NEW/EDIT/DELETE operations.'
  );
}

/**
 * Update proposed person (deprecated)
 * @deprecated Use updatePersonRequest()
 */
export async function updateProposedPerson(id: string, data: Partial<Omit<Ancestor, 'id' | 'children'>>) {
  throw new Error(
    'updateProposedPerson is deprecated. Use updatePersonRequest() instead.'
  );
}

/**
 * Add proposed person (deprecated)
 * @deprecated Use addNewPersonRequest()
 */
export async function addProposedPerson(data: Omit<Ancestor, 'id' | 'children'> & { dataSubmissionId: string }) {
  throw new Error(
    'addProposedPerson is deprecated. Use addNewPersonRequest() instead.'
  );
}

/**
 * Delete proposed person (deprecated)
 * @deprecated Use deletePersonRequest()
 */
export async function deleteProposedPerson(id: string) {
  throw new Error(
    'deleteProposedPerson is deprecated. Use deletePersonRequest() instead.'
  );
}

/**
 * Reorder proposed siblings (deprecated)
 * @deprecated Edit PersonRequest birthOrder field instead
 */
export async function reorderProposedSiblings(personId: string, direction: 'up' | 'down') {
  throw new Error(
    'reorderProposedSiblings is deprecated. Edit PersonRequest birthOrder field instead.'
  );
}


import { User, UserRole } from '@prisma/client';
import * as UserService from './user.service';

// Re-export types for backward compatibility
export type Admin = User;
export type Contributor = User;

export async function getAdmins() {
  return UserService.getAdmins();
}

export async function getContributors() {
  return UserService.getContributors();
}

export async function adminLogin(email: string, password: string) {
  return UserService.loginWithPassword(email, password);
}

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

export async function deleteAdmin(id: string) {
  return UserService.deleteUser(id);
}

export async function deleteContributor(id: string) {
  return UserService.deleteUser(id);
}

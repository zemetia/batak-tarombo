/**
 * User Service - Unified user management
 *
 * Combines Admin and Contributor functionality into a single User model
 * Supports both password-based (temporary) and Firebase authentication
 */

import { User, UserRole, AuthProvider, UserProfile, Gender } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

// ==================== TYPES ====================

export interface CreateUserData {
  email: string;
  fullName: string;
  password?: string; // Optional during Firebase migration
  role: UserRole;

  // Firebase fields (optional)
  uid?: string;
  displayName?: string;
  photoURL?: string;
  provider?: AuthProvider;

  // Contributor fields (optional)
  marga?: string;
  birthday?: Date;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  facebook?: string;
  instagram?: string;
}

export interface UpdateUserData {
  fullName?: string;
  marga?: string;
  birthday?: Date;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  facebook?: string;
  instagram?: string;
  displayName?: string;
  photoURL?: string;
}

export interface FirebaseUserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: AuthProvider;
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get all users with optional role filter
 */
export async function getUsers(role?: UserRole) {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    include: {
      profile: true,
      _count: {
        select: {
          requestsSubmitted: true,
          requestsReviewed: true,
          personsCreated: true,
          personsUpdated: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Get admins only (convenience function)
 */
export async function getAdmins() {
  return getUsers('ADMIN');
}

/**
 * Get contributors only (convenience function)
 */
export async function getContributors() {
  return getUsers('CONTRIBUTOR');
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true }
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(uid: string) {
  return prisma.user.findUnique({
    where: { uid },
    include: { profile: true }
  });
}

// ==================== AUTHENTICATION ====================

/**
 * Login with password (temporary - for migration period)
 * @deprecated Use loginWithFirebase after migration
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<(User & { profile: UserProfile | null }) | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });

  if (!user) {
    return null;
  }

  // Check if user has password (old accounts)
  if (!user.password) {
     // Allow if in dev mode or handle gracefully
     // throw new Error('Please login with Google or Facebook');
     return null;
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return null;
  }

  // Check if banned
  if (user.isBanned) { 
     throw new Error('Account has been banned');
  }

  return user;
}

/**
 * Login with Firebase (Client-side authentication)
 * Creates new user if doesn't exist, or links existing account
 *
 * NOTE: This function trusts the client-provided data.
 * In production, consider adding additional verification or rate limiting.
 */
export async function loginWithFirebase(
  firebaseData: FirebaseUserData
): Promise<{ user: User & { profile: UserProfile | null }, isNewUser: boolean }> {
  // Validate required fields
  if (!firebaseData.uid || !firebaseData.email) {
    throw new Error('Firebase UID and email are required');
  }

  // Try to find by Firebase UID first
  let user = await getUserByFirebaseUid(firebaseData.uid);

  if (user) {
    // User exists with Firebase account
    if (user.isBanned) {
      throw new Error('Account has been banned');
    }

    // Update display info if changed
    const currentName = user.profile?.fullName;
    const currentPhoto = user.profile?.photoURL;
    const newName = firebaseData.displayName || user.email.split('@')[0];
    
    if (currentName !== newName || currentPhoto !== firebaseData.photoURL) {
      // Update profile
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          fullName: newName,
          photoURL: firebaseData.photoURL
        },
        update: {
          fullName: newName,
          photoURL: firebaseData.photoURL
        }
      });
      
      // Fetch fresh user
      const updatedUser = await getUserByFirebaseUid(firebaseData.uid);
      if (updatedUser) return { user: updatedUser, isNewUser: false };
    }

    return { user, isNewUser: false };
  }

  // Try to find by email (for account linking)
  user = await getUserByEmail(firebaseData.email);

  if (user) {
    // Link existing password account to Firebase
    console.log(`Linking existing user ${user.email} to Firebase UID ${firebaseData.uid}`);

    // Update User
    await prisma.user.update({
      where: { id: user.id },
      data: {
        uid: firebaseData.uid,
        provider: firebaseData.provider,
        isVerified: true // Upgrade to verified
      }
    });

    // Update Profile
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
          userId: user.id,
          fullName: firebaseData.displayName || user.email.split('@')[0],
          photoURL: firebaseData.photoURL
      },
      update: {
          fullName: firebaseData.displayName || undefined,
          photoURL: firebaseData.photoURL
      }
    });

    const updatedUser = await getUserById(user.id);
    if (!updatedUser) throw new Error("User linking failed");
    return { user: updatedUser, isNewUser: false };
  }

  // Create new user
  console.log(`Creating new user with Firebase UID ${firebaseData.uid}`);

  const newUser = await prisma.user.create({
    data: {
      uid: firebaseData.uid,
      email: firebaseData.email,
      provider: firebaseData.provider,
      role: 'GENERAL', // New users start as GENERAL
      isVerified: true, // Firebase users are pre-verified
      profile: {
        create: {
            fullName: firebaseData.displayName || firebaseData.email.split('@')[0],
            photoURL: firebaseData.photoURL
        }
      }
    },
    include: {
        profile: true
    }
  });

  return { user: newUser, isNewUser: true };
}

/**
 * Link existing user account to Firebase
 */
export async function linkFirebaseAccount(
  userId: string,
  firebaseData: FirebaseUserData
): Promise<User & { profile: UserProfile | null }> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      uid: firebaseData.uid,
      provider: firebaseData.provider,
    },
    include: { profile: true }
  });

  await prisma.userProfile.upsert({
      where: { userId },
      create: {
          userId,
          fullName: firebaseData.displayName || 'Unknown',
          photoURL: firebaseData.photoURL
      },
      update: {
          fullName: firebaseData.displayName || undefined,
          photoURL: firebaseData.photoURL
      }
  });

  return updated;
}

// ==================== USER CREATION ====================

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<User & { profile: UserProfile | null }> {
  let hashedPassword: string | undefined;

  // Hash password if provided
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(data.password, salt);
  }

  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,

      // Firebase fields
      uid: data.uid,
      provider: data.provider,
      isVerified: !!data.uid,

      // Profile
      profile: {
          create: {
            fullName: data.fullName,
            photoURL: data.photoURL,
            marga: data.marga,
            birthday: data.birthday,
            whatsapp: data.whatsapp,
            address: data.address,
            city: data.city,
            country: data.country,
            facebook: data.facebook,
            instagram: data.instagram,
          }
      }
    },
    include: {
        profile: true
    }
  });
}

/**
 * Register new contributor (convenience function)
 */
export async function registerContributor(
  data: Omit<CreateUserData, 'role'>
): Promise<User & { profile: UserProfile | null }> {
  return createUser({ ...data, role: 'CONTRIBUTOR' });
}

/**
 * Create admin (convenience function)
 */
export async function createAdmin(data: {
  email: string;
  fullName: string;
  password: string;
}): Promise<User & { profile: UserProfile | null }> {
  return createUser({ ...data, role: 'ADMIN' });
}

// ==================== USER UPDATES ====================

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<User & { profile: UserProfile | null }> {
  const { 
      fullName, marga, birthday, whatsapp, address, 
      city, country, facebook, instagram, displayName, photoURL 
  } = data;
  
  // Update Profile
  const profileUpdate: any = {};
  if (fullName) profileUpdate.fullName = fullName;
  if (displayName) profileUpdate.fullName = displayName; // Use displayName as full name if provided
  if (marga !== undefined) profileUpdate.marga = marga;
  if (birthday !== undefined) profileUpdate.birthday = birthday;
  if (whatsapp !== undefined) profileUpdate.whatsapp = whatsapp;
  if (address !== undefined) profileUpdate.address = address;
  if (city !== undefined) profileUpdate.city = city;
  if (country !== undefined) profileUpdate.country = country;
  if (facebook !== undefined) profileUpdate.facebook = facebook;
  if (instagram !== undefined) profileUpdate.instagram = instagram;
  if (photoURL !== undefined) profileUpdate.photoURL = photoURL;

  if (Object.keys(profileUpdate).length > 0) {
      await prisma.userProfile.upsert({
          where: { userId },
          create: {
              userId,
              fullName: fullName || displayName || 'Unknown',
              ...profileUpdate
          },
          update: profileUpdate
      });
  }

  return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true }
  });
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    include: { profile: true }
  });
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  newPassword: string
): Promise<User> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
    include: { profile: true }
  });
}

// ==================== USER MANAGEMENT ====================

/**
 * Ban user
 */
export async function banUser(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: true },
    include: { profile: true }
  });
}

/**
 * Unban user
 */
export async function unbanUser(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: false },
    include: { profile: true }
  });
}

/**
 * Verify user
 */
export async function verifyUser(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
    include: { profile: true }
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<User> {
  return prisma.user.delete({
    where: { id: userId },
    include: { profile: true }
  });
}

// ==================== STATISTICS ====================

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      _count: {
        select: {
          requestsSubmitted: true,
          requestsReviewed: true,
          personsCreated: true,
          personsUpdated: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.profile?.fullName || 'Unknown',
    role: user.role,
    requestsSubmitted: user._count.requestsSubmitted,
    requestsReviewed: user._count.requestsReviewed,
    personsCreated: user._count.personsCreated,
    personsUpdated: user._count.personsUpdated,
    joinedAt: user.createdAt
  };
}

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
  const [totalUsers, admins, contributors, general, bannedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'CONTRIBUTOR' } }),
    prisma.user.count({ where: { role: 'GENERAL' } }),
    prisma.user.count({ where: { isBanned: true } })
  ]);

  return {
    totalUsers,
    admins,
    contributors,
    general,
    bannedUsers,
    activeUsers: totalUsers - bannedUsers
  };
}

// ==================== SEARCH & FILTER ====================

/**
 * Search users by name or email
 */
export async function searchUsers(query: string, role?: UserRole) {
  return prisma.user.findMany({
    where: {
      AND: [
        role ? { role } : {},
        {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { 
               profile: {
                 OR: [
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { marga: { contains: query, mode: 'insensitive' } }
                 ]
               }
            }
          ]
        }
      ]
    },
    include: {
      profile: true
    },
    take: 20
  });
}

/**
 * Get users by marga
 */
export async function getUsersByMarga(marga: string) {
  return prisma.user.findMany({
    where: { 
        profile: {
            marga: { equals: marga, mode: 'insensitive' }
        }
    },
    include: {
        profile: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

// ==================== VALIDATION ====================

/**
 * Check if email already exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  return !!user;
}

/**
 * Check if Firebase UID already exists
 */
export async function firebaseUidExists(uid: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { uid },
    select: { id: true }
  });
  return !!user;
}

/**
 * Complete user profile after initial signup
 */
export async function completeUserProfile(
  userId: string,
  data: {
    fullName: string;
    birthYear: number;
    city: string;
    marga: string;
    whatsapp: string;
    gender?: Gender;
  }
) {
  // Update User Profile
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      profile: {
        update: {
          fullName: data.fullName,
          city: data.city,
          marga: data.marga,
          whatsapp: data.whatsapp
        }
      }
    },
    include: { profile: true }
  });

  // Create Person Record
  // We need to create a Person record so they appear in the lineage system
  const person = await prisma.person.create({
    data: {
      name: data.fullName,
      gender: data.gender || 'MALE', // Default to MALE if not provided
      status: 'ACTIVE',
      detail: {
        create: {
          birthYear: data.birthYear,
          huta: data.city, // Mapping city to huta
          isAlive: true
        }
      },
      createdById: userId,
      lastUpdatedById: userId
    }
  });

  return { user, person };
}

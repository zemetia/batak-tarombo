import { PrismaClient, Admin } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function getAdmins() {
  return prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getContributors() {
  return prisma.contributor.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      whatsapp: true,
      city: true,
      country: true,
      createdAt: true,
      _count: {
        select: {
          submissions: true
        }
      }
    },
    orderBy: {
      fullName: 'asc'
    }
  });
}

export async function adminLogin(email: string, password: string): Promise<Admin | null> {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    return null;
  }

  return admin;
}

export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
}): Promise<Admin> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  return prisma.admin.create({
    data: {
      id: uuidv4(),
      ...data,
      password: hashedPassword,
    },
  });
}

export async function deleteAdmin(id: string) {
  return prisma.admin.delete({
    where: { id }
  });
}

export async function deleteContributor(id: string) {
  return prisma.contributor.delete({
    where: { id }
  });
}

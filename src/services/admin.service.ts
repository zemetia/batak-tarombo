import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAdmins() {
  return prisma.admin.findMany({ take: 4 });
}

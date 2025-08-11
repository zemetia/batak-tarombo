import { PrismaClient, Contributor } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function registerContributor(
  data: Omit<Contributor, 'id' | 'createdAt' | 'updatedAt' | 'submissions'>
): Promise<Contributor> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const contributor = await prisma.contributor.create({
    data: {
      id: uuidv4(),
      ...data,
      password: hashedPassword,
    },
  });
  return contributor;
}

export async function login(email: string, password: string):Promise<Contributor | null> {
    const contributor = await prisma.contributor.findUnique({
        where: { email },
    });

    if (!contributor) {
        return null;
    }

    const isMatch = await bcrypt.compare(password, contributor.password);

    if (!isMatch) {
        return null;
    }

    return contributor;
}

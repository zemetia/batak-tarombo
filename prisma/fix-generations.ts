import { PrismaClient } from '@prisma/client';
import { recalculateGenerations } from '../src/lib/generation-utils';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Generation Fix...");
  try {
    await recalculateGenerations(prisma, false); // Set to true for dry-run
    console.log("Generation Fix Complete.");
  } catch (e) {
    console.error("Error fixing generations:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

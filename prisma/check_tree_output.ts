import { getLineageTree } from '../src/services/person.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking Service Output with filters:");
        const tree = await getLineageTree({ rootName: "Si Raja Batak", gender: "MALE" });
        
        console.log(`Root Name: ${tree.name}`);
        console.log(`Root Generation: ${tree.generation}`);
        console.log(`Children Count: ${tree.children?.length}`);
        
        if (tree.children && tree.children.length > 0) {
            console.log("Children Names:", tree.children.map(c => c.name).join(", "));
        }
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();

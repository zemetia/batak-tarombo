import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSubmissions() {
    // This is placeholder data. In a real app, you'd fetch from `prisma.dataSubmission.findMany()`.
    return [
        { id: 's1', submittedBy: 'John Doe', ancestorName: 'Raja Hatorusan', fatherName: 'Raja Lontung', status: 'Pending' },
        { id: 's2', submittedBy: 'Jane Smith', ancestorName: 'Toga Sinaga', fatherName: 'Raja Lontung', status: 'Approved' },
        { id: 's3', submittedBy: 'John Doe', ancestorName: 'Toga Situmorang', fatherName: 'Raja Lontung', status: 'Pending' },
        { id: 's4', submittedBy: 'Admin User', ancestorName: 'Toga Pandiangan', fatherName: 'Raja Lontung', status: 'Rejected' },
    ];
}

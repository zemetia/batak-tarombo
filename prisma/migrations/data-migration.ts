// @ts-nocheck
/**
 * Safe Data Migration Script
 *
 * This script migrates data from the old schema to the new simplified schema.
 * It runs in multiple phases to ensure data safety.
 *
 * Run with: npx ts-node prisma/migrations/data-migration.ts
 */

import { PrismaClient, UserRole, RequestStatus, OperationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface OldAdmin {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OldContributor {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

interface OldDataSubmission {
  id: string;
  changesDetail: string;
  status: string;
  taromboProve: string;
  ancestorName: string;
  fatherName?: string;
  selectedAncestorId?: string;
  proposalType: string;
  adminNotes?: string;
  reviewedAt?: Date;
  adminId?: string;
  contributorId: string;
  submittedAt: Date;
}

interface OldProposedPerson {
  id: string;
  name: string;
  generation: number;
  wife?: string;
  description?: string;
  birthOrder: number;
  fatherId?: string;
  originalPersonId?: string;
  dataSubmissionId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OldPerson {
  id: string;
  name: string;
  generation: number;
  wife?: string;
  description?: string;
  birthOrder: number;
  fatherId?: string;
  contributorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to extract marga from email or name
function extractMarga(email: string, name?: string): string | null {
  // Common Batak margas
  const margas = [
    'Sitorus', 'Simatupang', 'Simbolon', 'Situmorang', 'Sinaga',
    'Sihombing', 'Hutabarat', 'Panjaitan', 'Pasaribu', 'Sagala',
    'Manurung', 'Nababan', 'Tampubolon', 'Hutapea', 'Simanjuntak'
  ];

  const searchText = `${email} ${name || ''}`.toLowerCase();

  for (const marga of margas) {
    if (searchText.includes(marga.toLowerCase())) {
      return marga;
    }
  }

  return null;
}

// Map old status to new RequestStatus enum
function mapStatus(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    'waiting': 'PENDING',
    'in_review': 'IN_REVIEW',
    'accepted': 'APPROVED',
    'accepted_with_discuss': 'APPROVED',
    'rejected': 'REJECTED',
    'cancelled': 'CANCELLED'
  };

  return statusMap[oldStatus] || 'PENDING';
}

async function main() {
  console.log('🚀 Starting safe data migration...\n');

  try {
    // ==================== PHASE 1: Migrate Admin → User ====================
    console.log('📋 Phase 1: Migrating Admin accounts to User...');

    const oldAdmins = await prisma.$queryRaw<OldAdmin[]>`
      SELECT * FROM "Admin"
    `;

    const userIdMap = new Map<string, string>(); // old ID → new User ID

    for (const admin of oldAdmins) {
      const newUser = await prisma.user.create({
        data: {
          email: admin.email,
          fullName: admin.name,
          password: admin.password, // Keep password temporarily
          role: 'ADMIN',
          uid: null, // Will be set when they login with Firebase
          isVerified: true,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      });

      userIdMap.set(`admin_${admin.id}`, newUser.id);
      console.log(`  ✅ Migrated admin: ${admin.email} → User ${newUser.id}`);
    }

    // ==================== PHASE 2: Migrate Contributor → User ====================
    console.log('\n📋 Phase 2: Migrating Contributor accounts to User...');

    const oldContributors = await prisma.$queryRaw<OldContributor[]>`
      SELECT * FROM "Contributor"
    `;

    for (const contributor of oldContributors) {
      const marga = extractMarga(contributor.email, contributor.fullName);

      const newUser = await prisma.user.create({
        data: {
          email: contributor.email,
          fullName: contributor.fullName,
          password: contributor.password, // Keep password temporarily
          role: 'CONTRIBUTOR',
          uid: null,
          marga,
          birthday: contributor.birthday,
          whatsapp: contributor.whatsapp,
          address: contributor.address,
          city: contributor.city,
          country: contributor.country,
          facebook: contributor.facebook,
          instagram: contributor.instagram,
          isVerified: true,
          createdAt: contributor.createdAt,
          updatedAt: contributor.updatedAt
        }
      });

      userIdMap.set(`contributor_${contributor.id}`, newUser.id);
      console.log(`  ✅ Migrated contributor: ${contributor.email} → User ${newUser.id}`);
    }

    // ==================== PHASE 3: Update Person Table ====================
    console.log('\n📋 Phase 3: Updating Person records...');

    const oldPersons = await prisma.$queryRaw<OldPerson[]>`
      SELECT * FROM "Person"
    `;

    const defaultAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!defaultAdmin) {
      throw new Error('No admin user found! Cannot proceed.');
    }

    for (const person of oldPersons) {
      // Find who created this person
      const creatorId = person.contributorId
        ? userIdMap.get(`contributor_${person.contributorId}`)
        : defaultAdmin.id;

      // Migrate wife field to motherName
      const motherName = person.wife || null;

      await prisma.person.update({
        where: { id: person.id },
        data: {
          motherName,
          createdById: creatorId,
          lastUpdatedById: creatorId
        }
      });

      console.log(`  ✅ Updated person: ${person.name}`);
    }

    // ==================== PHASE 4: Migrate Active DataSubmissions → Requests ====================
    console.log('\n📋 Phase 4: Migrating active DataSubmissions to Requests...');

    const activeSubmissions = await prisma.$queryRaw<OldDataSubmission[]>`
      SELECT * FROM "DataSubmission"
      WHERE status IN ('waiting', 'in_review')
    `;

    console.log(`  Found ${activeSubmissions.length} active submissions`);

    for (const submission of activeSubmissions) {
      const submitterId = userIdMap.get(`contributor_${submission.contributorId}`);
      if (!submitterId) {
        console.log(`  ⚠️  Skipping submission ${submission.id} - submitter not found`);
        continue;
      }

      const reviewerId = submission.adminId
        ? userIdMap.get(`admin_${submission.adminId}`)
        : null;

      const request = await prisma.request.create({
        data: {
          title: submission.ancestorName
            ? `Changes to ${submission.ancestorName}'s lineage`
            : 'Lineage update',
          description: submission.changesDetail,
          submittedById: submitterId,
          taromboProveUrl: submission.taromboProve,
          status: mapStatus(submission.status) as any,
          reviewedById: reviewerId,
          reviewedAt: submission.reviewedAt,
          adminNotes: submission.adminNotes,
          submittedAt: submission.submittedAt
        }
      });

      console.log(`  ✅ Migrated submission: ${submission.id} → Request ${request.id}`);

      // Migrate ProposedPersons for this submission
      await migrateProposedPersons(submission.id, request.id);
    }

    // ==================== PHASE 5: Archive Old Completed Submissions ====================
    console.log('\n📋 Phase 5: Archiving completed DataSubmissions...');

    const completedSubmissions = await prisma.$queryRaw<OldDataSubmission[]>`
      SELECT * FROM "DataSubmission"
      WHERE status NOT IN ('waiting', 'in_review')
    `;

    // Export to JSON for archival
    const archiveData = {
      exportDate: new Date().toISOString(),
      totalRecords: completedSubmissions.length,
      submissions: completedSubmissions
    };

    const fs = require('fs');
    const archivePath = 'prisma/archives/data-submissions-archive.json';
    fs.mkdirSync('prisma/archives', { recursive: true });
    fs.writeFileSync(archivePath, JSON.stringify(archiveData, null, 2));

    console.log(`  ✅ Archived ${completedSubmissions.length} completed submissions to ${archivePath}`);

    // ==================== SUMMARY ====================
    console.log('\n✨ Migration completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Migrated ${oldAdmins.length} Admin(s) to User with role=ADMIN`);
    console.log(`  - Migrated ${oldContributors.length} Contributor(s) to User with role=CONTRIBUTOR`);
    console.log(`  - Updated ${oldPersons.length} Person record(s)`);
    console.log(`  - Migrated ${activeSubmissions.length} active DataSubmission(s) to Request`);
    console.log(`  - Archived ${completedSubmissions.length} completed submission(s)`);
    console.log('\n⚠️  Next steps:');
    console.log('  1. Verify data integrity');
    console.log('  2. Test application functionality');
    console.log('  3. After verification, drop old tables:');
    console.log('     - DROP TABLE "Admin" CASCADE;');
    console.log('     - DROP TABLE "Contributor" CASCADE;');
    console.log('     - DROP TABLE "DataSubmission" CASCADE;');
    console.log('     - DROP TABLE "ProposedPerson" CASCADE;');
    console.log('     - ... and other unused tables');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateProposedPersons(submissionId: string, requestId: string) {
  const proposedPersons = await prisma.$queryRaw<OldProposedPerson[]>`
    SELECT * FROM "ProposedPerson"
    WHERE "dataSubmissionId" = ${submissionId}
  `;

  console.log(`    Migrating ${proposedPersons.length} ProposedPerson(s)...`);

  for (const pp of proposedPersons) {
    let operation: 'NEW' | 'EDIT' | 'DELETE' = 'NEW';
    let personId: string | null = null;
    let newData: any = null;
    let previousData: any = null;
    let changedFields: string[] = [];

    if (pp.originalPersonId) {
      // This was an EDIT
      operation = 'EDIT';
      personId = pp.originalPersonId;

      // Get original person to find differences
      const original = await prisma.person.findUnique({
        where: { id: pp.originalPersonId }
      });

      if (original) {
        // Find what changed
        const fields = ['name', 'generation', 'birthOrder', 'fatherId', 'description'];
        newData = {};
        previousData = {};

        for (const field of fields) {
          if (pp[field as keyof OldProposedPerson] !== original[field as keyof any]) {
            newData[field] = pp[field as keyof OldProposedPerson];
            previousData[field] = original[field as keyof any];
            changedFields.push(field);
          }
        }

        // Handle wife → motherName conversion
        if (pp.wife !== original.motherName) {
          newData.motherName = pp.wife;
          previousData.motherName = original.motherName;
          changedFields.push('motherName');
        }
      }
    } else {
      // This was a NEW
      operation = 'NEW';
      newData = {
        name: pp.name,
        generation: pp.generation,
        birthOrder: pp.birthOrder,
        fatherId: pp.fatherId,
        motherName: pp.wife,
        huta: null, // Old schema didn't have huta
        description: pp.description
      };
    }

    await prisma.personRequest.create({
      data: {
        requestId,
        operation: operation as any,
        personId,
        newData: newData as any,
        previousData: previousData as any,
        changedFields
      }
    });

    console.log(`      ✅ Migrated ProposedPerson: ${pp.name}`);
  }
}

// Run migration
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

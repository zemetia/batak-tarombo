-- Migration: Cleanup old tables and columns
-- ⚠️  WARNING: Only run this AFTER data-migration.ts has completed successfully!
-- This migration drops old tables and columns that have been replaced by the new schema

-- ==================== DROP OLD FOREIGN KEYS FROM PERSON ====================

-- Drop old foreign keys
ALTER TABLE "Person" DROP CONSTRAINT IF EXISTS "Person_contributorId_fkey";
ALTER TABLE "Person" DROP CONSTRAINT IF EXISTS "Person_branchId_fkey";
ALTER TABLE "Person" DROP CONSTRAINT IF EXISTS "Person_motherWifeId_fkey";

-- ==================== DROP OLD COLUMNS FROM PERSON ====================

-- Drop old columns that have been replaced
ALTER TABLE "Person" DROP COLUMN IF EXISTS "wife"; -- Replaced by motherName
ALTER TABLE "Person" DROP COLUMN IF EXISTS "contributorId"; -- Replaced by createdById
ALTER TABLE "Person" DROP COLUMN IF EXISTS "branchId"; -- Branch system removed
ALTER TABLE "Person" DROP COLUMN IF EXISTS "status"; -- Status moved to Request level
ALTER TABLE "Person" DROP COLUMN IF EXISTS "motherWifeId"; -- Wife system removed

-- ==================== DROP UNUSED TABLES ====================

-- Drop junction tables
DROP TABLE IF EXISTS "PersonWife" CASCADE;
DROP TABLE IF EXISTS "CommitPerson" CASCADE;

-- Drop git-like versioning tables (completely unused)
DROP TABLE IF EXISTS "MergeRequest" CASCADE;
DROP TABLE IF EXISTS "Commit" CASCADE;
DROP TABLE IF EXISTS "Branch" CASCADE;

-- Drop discussion/dispute tables (unused)
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Discussion" CASCADE;
DROP TABLE IF EXISTS "Evidence" CASCADE;
DROP TABLE IF EXISTS "Dispute" CASCADE;

-- Drop photo submission table (unused)
DROP TABLE IF EXISTS "SubmissionPhoto" CASCADE;

-- Drop wife table (replaced by motherName string)
DROP TABLE IF EXISTS "Wife" CASCADE;

-- Drop old submission tables (replaced by Request/PersonRequest)
DROP TABLE IF EXISTS "ProposedPerson" CASCADE;
DROP TABLE IF EXISTS "DataSubmission" CASCADE;

-- Drop old user tables (replaced by User)
DROP TABLE IF EXISTS "Contributor" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;

-- ==================== DROP UNUSED ENUMS ====================

DROP TYPE IF EXISTS "PersonStatus";
DROP TYPE IF EXISTS "BranchType";
DROP TYPE IF EXISTS "BranchStatus";
DROP TYPE IF EXISTS "ChangeType";
DROP TYPE IF EXISTS "MergeStatus";
DROP TYPE IF EXISTS "DiscussionType";
DROP TYPE IF EXISTS "DiscussionStatus";
DROP TYPE IF EXISTS "DisputeStatus";
DROP TYPE IF EXISTS "EvidenceType";
DROP TYPE IF EXISTS "SubmissionStatus";

-- Note: Keep UserRole enum as it's being used (was previously defined)
-- We may need to drop the old one if it exists
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- ==================== VERIFY CLEANUP ====================

-- At this point, the database should only have:
-- - User table
-- - Person table (with new columns)
-- - Request table
-- - PersonRequest table
-- - And their associated enums and indexes

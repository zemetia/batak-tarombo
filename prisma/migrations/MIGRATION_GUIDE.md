# Schema Migration Guide
## Simplified Version Control System for Batak Lineage

This guide explains how to safely migrate from the old complex git-like schema to the new simplified request-based system.

---

## ⚠️ CRITICAL: Read Before Starting

**Current Database State:**
- 10 Person records with wife information
- 1 Admin account
- 1 Contributor account
- Active DataSubmissions may exist

**This migration is IRREVERSIBLE without a database backup!**

---

## Pre-Migration Checklist

- [ ] **Create database backup**
  ```bash
  pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Verify backup works**
  ```bash
  # Test restore on a separate database
  psql -h <host> -U <user> -d <test_db> < backup_YYYYMMDD.sql
  ```

- [ ] **Install dependencies**
  ```bash
  npm install
  npm install -D ts-node @types/node
  ```

- [ ] **Stop application servers**
  - Stop Next.js development server
  - Stop any background workers
  - Ensure no one is accessing the database

---

## Migration Steps

### Step 1: Apply New Tables Migration

This creates new tables (User, Request, PersonRequest) WITHOUT dropping old tables.

```bash
# Apply the migration manually
psql -h <host> -U <user> -d <database> -f prisma/migrations/20250101000000_add_new_tables/migration.sql
```

**What this does:**
- ✅ Creates `User`, `Request`, `PersonRequest` tables
- ✅ Adds new columns to `Person` table (motherName, huta, createdById, lastUpdatedById)
- ✅ Creates all necessary enums (UserRole, AuthProvider, RequestStatus, OperationType)
- ✅ Sets up indexes and foreign keys
- ❌ Does NOT drop any old tables or data

**Verify:**
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('User', 'Request', 'PersonRequest');

-- Check Person has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Person'
AND column_name IN ('motherName', 'huta', 'createdById', 'lastUpdatedById');
```

---

### Step 2: Run Data Migration Script

This migrates data from old tables to new tables.

```bash
# Generate Prisma client with old schema temporarily
# (keep backup schema as reference)
npx prisma generate

# Run the data migration
npx ts-node prisma/migrations/data-migration.ts
```

**What this does:**
- ✅ Migrates all Admin records → User (role=ADMIN)
- ✅ Migrates all Contributor records → User (role=CONTRIBUTOR)
- ✅ Updates all Person records with new fields (motherName, createdById, lastUpdatedById)
- ✅ Migrates active DataSubmissions → Request
- ✅ Migrates ProposedPersons → PersonRequest
- ✅ Archives completed DataSubmissions to JSON file

**Expected Output:**
```
🚀 Starting safe data migration...

📋 Phase 1: Migrating Admin accounts to User...
  ✅ Migrated admin: admin@example.com → User abc-123

📋 Phase 2: Migrating Contributor accounts to User...
  ✅ Migrated contributor: user@example.com → User def-456

📋 Phase 3: Updating Person records...
  ✅ Updated person: John Sitorus
  ... (all 10 persons)

📋 Phase 4: Migrating active DataSubmissions to Requests...
  Found X active submissions
  ✅ Migrated submission: sub-789 → Request req-abc
    Migrating Y ProposedPerson(s)...
    ✅ Migrated ProposedPerson: Jane Sitorus

📋 Phase 5: Archiving completed DataSubmissions...
  ✅ Archived Z completed submissions to prisma/archives/data-submissions-archive.json

✨ Migration completed successfully!
```

**Verify:**
```sql
-- Check User count (should be Admin count + Contributor count)
SELECT role, COUNT(*) FROM "User" GROUP BY role;

-- Check Person has updated data
SELECT id, name, "motherName", "huta", "createdById" FROM "Person" LIMIT 5;

-- Check Request count (should equal active DataSubmissions)
SELECT status, COUNT(*) FROM "Request" GROUP BY status;

-- Check PersonRequest count
SELECT operation, COUNT(*) FROM "PersonRequest" GROUP BY operation;
```

---

### Step 3: Test Application with New Schema

**Update schema and regenerate Prisma client:**

```bash
# The schema.prisma has already been updated
# Regenerate Prisma client
npx prisma generate
```

**Start application and test:**

```bash
npm run dev
```

**Test these critical flows:**

1. **User Login**
   - [ ] Admin can login with password (temporary)
   - [ ] Contributor can login with password (temporary)

2. **View Lineage**
   - [ ] All 10 persons are visible
   - [ ] Family tree renders correctly
   - [ ] MotherName displays (previously in wife field)

3. **View Requests**
   - [ ] Admin can see all requests
   - [ ] Contributors can see their own requests
   - [ ] Request details show correctly

4. **Edit Person (if functionality exists)**
   - [ ] Can update person info
   - [ ] Changes track correctly

**If ANY test fails:**
1. ❌ DO NOT proceed to Step 4
2. ❌ DO NOT drop old tables
3. ✅ Restore from backup
4. ✅ Debug and fix issues
5. ✅ Re-run migration

---

### Step 4: Cleanup Old Tables (⚠️ POINT OF NO RETURN)

**Only run this if Step 3 tests passed 100%!**

This drops all old tables and columns that have been replaced.

```bash
# Apply cleanup migration
psql -h <host> -U <user> -d <database> -f prisma/migrations/20250101000001_cleanup_old_tables/migration.sql
```

**What this does:**
- ❌ Drops Admin table
- ❌ Drops Contributor table
- ❌ Drops DataSubmission table
- ❌ Drops ProposedPerson table
- ❌ Drops ALL unused tables (Branch, Commit, MergeRequest, Discussion, etc.)
- ❌ Drops old Person columns (wife, contributorId, branchId, status, motherWifeId)

**Verify:**
```sql
-- Check old tables are gone
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Admin', 'Contributor', 'DataSubmission', 'ProposedPerson');
-- Should return 0 rows

-- Check only new tables remain
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should only show: Person, PersonRequest, Request, User
```

---

### Step 5: Final Testing

**Run full application tests:**

```bash
# Run any automated tests
npm test

# Manual testing
npm run dev
```

**Test ALL features:**
- [ ] User authentication
- [ ] View family tree
- [ ] Search persons
- [ ] Admin panel
- [ ] Request submission
- [ ] Request approval workflow

**Performance check:**
```sql
-- Verify indexes are working
EXPLAIN ANALYZE SELECT * FROM "Person" WHERE "fatherId" = 'some-id';
EXPLAIN ANALYZE SELECT * FROM "Request" WHERE "submittedById" = 'some-id' AND status = 'PENDING';
```

---

## Rollback Plan

**If migration fails before Step 4:**

You can rollback by restoring the database backup:

```bash
# Drop current database
psql -h <host> -U <user> -c "DROP DATABASE <database>;"

# Create fresh database
psql -h <host> -U <user> -c "CREATE DATABASE <database>;"

# Restore from backup
psql -h <host> -U <user> -d <database> < backup_YYYYMMDD.sql

# Restore old schema
cp prisma/schema.prisma.backup prisma/schema.prisma

# Regenerate Prisma client
npx prisma generate
```

**If migration fails after Step 4:**

Rollback is more complex since old tables are dropped:

```bash
# Restore entire database from backup
psql -h <host> -U <user> -d <database> < backup_YYYYMMDD.sql

# Restore old schema
cp prisma/schema.prisma.backup prisma/schema.prisma
npx prisma generate
```

---

## Post-Migration Tasks

### Week 1-2: Firebase Integration

After migration is stable, integrate Firebase authentication:

1. Create Firebase project
2. Enable Google/Facebook auth providers
3. Implement Firebase auth in application
4. Test with new users
5. Send migration emails to existing users

See plan file for detailed Firebase integration steps.

### Week 3: Password Deprecation

After Firebase is working:

1. Send final warning to users still using password
2. Set deadline for Firebase migration (e.g., 30 days)
3. After deadline, disable password login
4. Remove password column:

```sql
ALTER TABLE "User" DROP COLUMN "password";
```

---

## Troubleshooting

### Error: "relation User already exists"

**Cause:** Step 1 migration was run twice.

**Solution:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_name = 'User';

-- If exists, skip Step 1 and proceed to Step 2
```

### Error: "column createdById does not exist"

**Cause:** Step 1 didn't complete successfully.

**Solution:**
```sql
-- Manually add missing columns
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "lastUpdatedById" TEXT;
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "motherName" TEXT;
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "huta" TEXT;
```

### Error: "Prisma client validation failed"

**Cause:** Prisma client not regenerated after schema change.

**Solution:**
```bash
npx prisma generate
```

### Error: Data migration script fails on User creation

**Cause:** Admin or Contributor email might already exist.

**Solution:** Check the error message for duplicate email, then:
```sql
-- Find duplicate
SELECT * FROM "User" WHERE email = 'duplicate@example.com';

-- Delete if it's from failed migration attempt
DELETE FROM "User" WHERE email = 'duplicate@example.com';

-- Re-run migration
npx ts-node prisma/migrations/data-migration.ts
```

---

## Migration Checklist

- [ ] Step 1: Apply new tables migration ✅
- [ ] Step 2: Run data migration script ✅
- [ ] Step 3: Test application thoroughly ✅
- [ ] Step 4: Cleanup old tables ⚠️
- [ ] Step 5: Final testing ✅
- [ ] Archive old schema backup
- [ ] Update documentation
- [ ] Deploy to production

---

## Support

If you encounter issues during migration:

1. **Check logs:** Review Prisma logs and database logs
2. **Verify data:** Run SQL queries to verify data integrity
3. **Don't panic:** You have a database backup
4. **Rollback if needed:** Better to rollback than lose data

---

## Summary

This migration transforms your database from a complex git-like versioning system to a simplified request-based system:

**Before:**
- 20+ models (many unused)
- Complex Branch/Commit/MergeRequest system
- Separate Admin & Contributor tables
- Wife/PersonWife junction tables

**After:**
- 4 core models (all used)
- Simple Request/PersonRequest system
- Unified User table with roles
- Simple motherName string field

**Benefits:**
- ✅ Simpler to understand
- ✅ Easier to maintain
- ✅ Better performance (fewer joins)
- ✅ Clear audit trail
- ✅ Firebase-ready for social login

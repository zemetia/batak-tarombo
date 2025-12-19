-- Migration: Add new tables for simplified version control system
-- This migration adds new tables without dropping old ones
-- Data migration script will run after this to move data from old to new tables

-- ==================== CREATE NEW ENUMS ====================

CREATE TYPE "UserRole" AS ENUM ('GENERAL', 'CONTRIBUTOR', 'ADMIN');
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'EMAIL', 'PHONE');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "OperationType" AS ENUM ('NEW', 'EDIT', 'DELETE');

-- ==================== CREATE NEW TABLES ====================

-- User table (replaces Admin + Contributor)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "uid" TEXT,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "photoURL" TEXT,
    "provider" "AuthProvider",
    "fullName" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'GENERAL',
    "marga" TEXT,
    "birthday" TIMESTAMP(3),
    "whatsapp" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Request table (replaces DataSubmission)
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "submittedById" TEXT NOT NULL,
    "taromboProveUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- PersonRequest table (replaces ProposedPerson)
CREATE TABLE "PersonRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "operation" "OperationType" NOT NULL,
    "personId" TEXT,
    "newData" JSONB,
    "previousData" JSONB,
    "changedFields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonRequest_pkey" PRIMARY KEY ("id")
);

-- ==================== UPDATE PERSON TABLE ====================

-- Add new columns to Person table (don't drop old ones yet)
ALTER TABLE "Person" ADD COLUMN "motherName" TEXT;
ALTER TABLE "Person" ADD COLUMN "huta" TEXT;
ALTER TABLE "Person" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Person" ADD COLUMN "lastUpdatedById" TEXT;

-- ==================== CREATE INDEXES ====================

-- User indexes
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_uid_idx" ON "User"("uid");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_marga_idx" ON "User"("marga");

-- Request indexes
CREATE INDEX "Request_submittedById_idx" ON "Request"("submittedById");
CREATE INDEX "Request_reviewedById_idx" ON "Request"("reviewedById");
CREATE INDEX "Request_status_idx" ON "Request"("status");
CREATE INDEX "Request_submittedById_status_idx" ON "Request"("submittedById", "status");

-- PersonRequest indexes
CREATE INDEX "PersonRequest_requestId_idx" ON "PersonRequest"("requestId");
CREATE INDEX "PersonRequest_personId_idx" ON "PersonRequest"("personId");
CREATE INDEX "PersonRequest_operation_idx" ON "PersonRequest"("operation");

-- Person new indexes
CREATE INDEX "Person_createdById_idx" ON "Person"("createdById");
CREATE INDEX "Person_lastUpdatedById_idx" ON "Person"("lastUpdatedById");

-- ==================== ADD FOREIGN KEYS ====================

-- Request foreign keys
ALTER TABLE "Request" ADD CONSTRAINT "Request_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Request" ADD CONSTRAINT "Request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PersonRequest foreign keys
ALTER TABLE "PersonRequest" ADD CONSTRAINT "PersonRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonRequest" ADD CONSTRAINT "PersonRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Person new foreign keys
ALTER TABLE "Person" ADD CONSTRAINT "Person_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Person" ADD CONSTRAINT "Person_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

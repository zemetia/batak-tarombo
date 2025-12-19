/**
 * Zod Schemas for PersonRequest Validation
 *
 * These schemas validate the JSON data stored in PersonRequest.newData and PersonRequest.previousData
 * Provides type safety for the flexible JSON-based change tracking system
 */

import { z } from 'zod';

// ==================== PERSON DATA SCHEMA ====================

/**
 * Schema for Person data
 * Used for NEW operations (full data) and EDIT operations (partial data)
 */
export const PersonBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  generation: z.number().int().positive('Generation must be a positive number').optional(),
  birthOrder: z.number().int().nonnegative('Birth order must be non-negative').default(0),
  birthYear: z.number().int().positive('Birth year must be valid').optional(),
  deathYear: z.number().int().positive('Death year must be valid').optional(),
  isAlive: z.boolean().default(true),
  huta: z.string().optional(), // Location/village
  description: z.string().optional(),
  fatherId: z.string().uuid('Invalid father ID').nullable().optional(),
  motherName: z.string().optional()
});

export const PersonDataSchema = PersonBaseSchema.refine(
  (data) => {
    // If deathYear is provided, it should be >= birthYear
    if (data.birthYear && data.deathYear) {
      return data.deathYear >= data.birthYear;
    }
    return true;
  },
  {
    message: 'Death year must be after birth year',
    path: ['deathYear']
  }
).refine(
  (data) => {
    // If person is not alive, deathYear should be provided
    if (data.isAlive === false && !data.deathYear) {
      return false;
    }
    return true;
  },
  {
    message: 'Death year is required for deceased persons',
    path: ['deathYear']
  }
);

export type PersonData = z.infer<typeof PersonDataSchema>;

// ==================== OPERATION-SPECIFIC SCHEMAS ====================

/**
 * Schema for NEW operation
 * Creates a new person with full data
 */
export const PersonRequestNewSchema = z.object({
  operation: z.literal('NEW'),
  personId: z.null(),
  newData: PersonDataSchema,
  previousData: z.null(),
  changedFields: z.array(z.string()).default([])
});

export type PersonRequestNew = z.infer<typeof PersonRequestNewSchema>;

/**
 * Schema for EDIT operation
 * Modifies existing person with partial data
 */
export const PersonRequestEditSchema = z.object({
  operation: z.literal('EDIT'),
  personId: z.string().uuid('Invalid person ID'),
  newData: PersonBaseSchema.partial(), // Only changed fields
  previousData: PersonBaseSchema.partial(), // Original values
  changedFields: z.array(z.string()).min(1, 'At least one field must be changed')
}).refine(
  (data) => {
    // Ensure changedFields matches the keys in newData
    const newDataKeys = Object.keys(data.newData);
    const changedFieldsSet = new Set(data.changedFields);

    return newDataKeys.every(key => changedFieldsSet.has(key));
  },
  {
    message: 'changedFields must include all fields in newData',
    path: ['changedFields']
  }
);

export type PersonRequestEdit = z.infer<typeof PersonRequestEditSchema>;

/**
 * Schema for DELETE operation
 * Removes a person and stores full snapshot for rollback
 */
export const PersonRequestDeleteSchema = z.object({
  operation: z.literal('DELETE'),
  personId: z.string().uuid('Invalid person ID'),
  newData: z.null(),
  previousData: PersonDataSchema, // Full snapshot for undo
  changedFields: z.array(z.string()).default([])
});

export type PersonRequestDelete = z.infer<typeof PersonRequestDeleteSchema>;

// ==================== DISCRIMINATED UNION ====================

/**
 * Main PersonRequest schema - discriminated union based on operation type
 * TypeScript will automatically narrow the type based on the operation field
 */
export const PersonRequestSchema = z.union([
  PersonRequestNewSchema,
  PersonRequestEditSchema,
  PersonRequestDeleteSchema
]);

export type PersonRequestData = z.infer<typeof PersonRequestSchema>;

// ==================== TYPE GUARDS ====================

/**
 * Type guard for NEW operation
 */
export function isNewOperation(data: PersonRequestData | undefined | null): data is PersonRequestNew {
  return data?.operation === 'NEW';
}

/**
 * Type guard for EDIT operation
 */
export function isEditOperation(data: PersonRequestData | undefined | null): data is PersonRequestEdit {
  return data?.operation === 'EDIT';
}

/**
 * Type guard for DELETE operation
 */
export function isDeleteOperation(data: PersonRequestData | undefined | null): data is PersonRequestDelete {
  return data?.operation === 'DELETE';
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validates PersonRequest data
 * Throws ZodError if validation fails
 */
export function validatePersonRequest(data: unknown): PersonRequestData {
  return PersonRequestSchema.parse(data);
}

/**
 * Safe validation that returns success/error
 */
export function safeValidatePersonRequest(data: unknown) {
  return PersonRequestSchema.safeParse(data);
}

/**
 * Create a NEW PersonRequest
 */
export function createNewPersonRequest(data: PersonData): PersonRequestNew {
  return PersonRequestNewSchema.parse({
    operation: 'NEW',
    personId: null,
    newData: data,
    previousData: null,
    changedFields: []
  });
}

/**
 * Create an EDIT PersonRequest
 */
export function createEditPersonRequest(
  personId: string,
  newData: Partial<PersonData>,
  previousData: Partial<PersonData>
): PersonRequestEdit {
  const changedFields = Object.keys(newData);

  return PersonRequestEditSchema.parse({
    operation: 'EDIT',
    personId,
    newData,
    previousData,
    changedFields
  });
}

/**
 * Create a DELETE PersonRequest
 */
export function createDeletePersonRequest(
  personId: string,
  previousData: PersonData
): PersonRequestDelete {
  return PersonRequestDeleteSchema.parse({
    operation: 'DELETE',
    personId,
    newData: null,
    previousData,
    changedFields: []
  });
}

/**
 * Calculate diff between two Person objects
 * Returns { newData, previousData, changedFields } for EDIT operation
 */
export function calculatePersonDiff(
  original: PersonData,
  updated: Partial<PersonData>
): {
  newData: Partial<PersonData>;
  previousData: Partial<PersonData>;
  changedFields: string[];
} {
  const newData: Partial<PersonData> = {};
  const previousData: Partial<PersonData> = {};
  const changedFields: string[] = [];

  for (const key of Object.keys(updated) as (keyof PersonData)[]) {
    if (updated[key] !== original[key]) {
      newData[key] = updated[key] as any;
      previousData[key] = original[key] as any;
      changedFields.push(key);
    }
  }

  return { newData, previousData, changedFields };
}

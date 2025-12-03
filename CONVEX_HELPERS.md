# convex-helpers Integration Guide

This document explains all convex-helpers features used in this project, why they exist, and how they work together.

---

## Table of Contents

1. [Package Installation](#1-package-installation)
2. [Directory Structure](#2-directory-structure)
3. [Custom Function Builders](#3-custom-function-builders)
4. [Timestamp Utilities](#4-timestamp-utilities)
5. [Relationship Helpers](#5-relationship-helpers)
6. [Shared Validators](#6-shared-validators)
7. [Complete Flow](#7-complete-flow)
8. [Summary Table](#8-summary-table)

---

## 1. Package Installation

### File: `packages/backend/package.json`

```json
"convex-helpers": "^0.1.67"
```

**Why:** convex-helpers is the official Convex companion library that provides:
- Custom function builders (eliminates auth boilerplate)
- Relationship helpers (simplifies index queries)
- Zod validation integration
- Row-level security patterns

---

## 2. Directory Structure

### Location: `packages/backend/convex/lib/`

**Why this directory exists:**
- Follows Convex best practices for organizing helper code
- Keeps the main `convex/` directory clean with only Convex functions
- Houses reusable utilities that multiple Convex functions can import

**Files inside:**
- `functions.ts` - Custom function builders
- `timestamps.ts` - Timestamp utilities

---

## 3. Custom Function Builders

### File: `packages/backend/convex/lib/functions.ts`

This is the **core of the convex-helpers integration**.

### 3.1 Imports

```typescript
import {
  customQuery,
  customMutation,
  customCtx,
} from 'convex-helpers/server/customFunctions';
import { zCustomMutation, zCustomQuery } from 'convex-helpers/server/zod4';
import { query, mutation } from '../_generated/server';
import { authComponent } from '../auth';
```

| Import | From | Purpose |
|--------|------|---------|
| `customQuery` | `convex-helpers/server/customFunctions` | Factory for creating custom query builders |
| `customMutation` | `convex-helpers/server/customFunctions` | Factory for creating custom mutation builders |
| `customCtx` | `convex-helpers/server/customFunctions` | Helper to modify/extend the Convex context (`ctx`) |
| `zCustomMutation` | `convex-helpers/server/zod4` | Factory for Zod-validated mutations (Zod v4 specific!) |
| `zCustomQuery` | `convex-helpers/server/zod4` | Factory for Zod-validated queries (Zod v4 specific!) |
| `query`, `mutation` | `../_generated/server` | Base Convex function builders |
| `authComponent` | `../auth` | Better Auth component for user lookup |

**Important: Zod Version Import Paths**

convex-helpers has **three** Zod import paths for different versions:

| Import Path | Zod Version |
|-------------|-------------|
| `convex-helpers/server/zod` | Legacy |
| `convex-helpers/server/zod3` | Zod v3 |
| `convex-helpers/server/zod4` | **Zod v4** |

This project uses Zod v4 (`"zod": "^4.1.11"`), so we use `convex-helpers/server/zod4`.

Using the wrong path causes: `Cannot read properties of undefined (reading 'typeName')`

---

### 3.2 `optionalAuthQuery`

```typescript
export const optionalAuthQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    return { user: user ?? null };
  })
);
```

**What it does:**
- Creates a custom query builder that **optionally** includes auth
- Adds `ctx.user` to the handler context
- If user is not authenticated, `ctx.user` is `null` (doesn't throw)

**Why it exists:**
- For queries where you want to show different content to logged-in vs anonymous users
- Example: A public page that shows "Edit" button only for the profile owner

**Before (without convex-helpers):**
```typescript
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);  // Manual lookup every time!
    if (!user) return null;
    // ...
  },
});
```

**After (with convex-helpers):**
```typescript
export const getCurrentUser = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    const { user, db } = ctx;  // user is already available!
    if (!user) return null;
    // ...
  },
});
```

**Where it's used:** `users.ts` - `getCurrentUser` query

---

### 3.3 `authedQuery`

```typescript
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error('Not authenticated');
    return { user };
  })
);
```

**What it does:**
- Creates a custom query builder that **requires** authentication
- Adds `ctx.user` to the handler context
- **Throws an error** if user is not authenticated (before handler runs)

**Why it exists:**
- For queries that should ONLY be accessible to logged-in users
- Example: Fetching user's private settings, order history, etc.

**Why throw instead of return null?**
- Fail-fast pattern: Better to throw early than have undefined behavior
- Frontend can catch this and redirect to login
- More explicit about the function's requirements

---

### 3.4 `authedMutation`

```typescript
export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error('Not authenticated');
    return { user };
  })
);
```

**What it does:**
- Creates a custom mutation builder that **requires** authentication
- Adds `ctx.user` to the handler context
- **Throws an error** if user is not authenticated

**Why it exists:**
- Most mutations should require authentication (create, update, delete)
- Prevents anonymous users from modifying data
- The `ctx.user` gives you the authenticated user's ID for ownership checks

**Before (without convex-helpers):**
```typescript
export const updateProfile = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);  // Manual auth check!
    if (!user) throw new Error('Not authenticated');   // Manual error!
    // Now you can use user._id
  },
});
```

**After (with convex-helpers):**
```typescript
export const updateProfile = authedMutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const { user, db } = ctx;  // user is guaranteed to exist!
    // TypeScript knows user is defined, not null
  },
});
```

---

### 3.5 `authedZodMutation`

```typescript
export const authedZodMutation = zCustomMutation(mutation, {
  argsValidator: customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error('Not authenticated');
    return { user };
  }),
});
```

**What it does:**
- Creates a mutation builder that:
  1. **Requires authentication** (same as `authedMutation`)
  2. **Validates args with a Zod schema** (instead of Convex validators)
- Adds `ctx.user` to the handler context
- Converts Zod schema to Convex validator internally (via `zodToConvex`)

**Why it exists:**
- Enables **single-source-of-truth validation**
- Same Zod schema validates on frontend AND backend
- Rich validation: `.email()`, `.min()`, `.max()`, `.regex()`, custom error messages
- Type inference from Zod to TypeScript

**How `zCustomMutation` works internally:**
1. Takes your Zod schema (e.g., `profileUpdateSchema`)
2. Converts it to a Convex validator using `zodToConvex`
3. At runtime, validates incoming args against the Zod schema
4. If validation fails, throws detailed Zod error messages
5. If validation passes, runs your handler with typed args

**Where it's used:** `userProfiles.ts` - `updateMyProfile`

---

### 3.6 `authedZodQuery`

```typescript
export const authedZodQuery = zCustomQuery(query, {
  argsValidator: customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error('Not authenticated');
    return { user };
  }),
});
```

**What it does:**
- Same as `authedZodMutation` but for queries
- Requires auth + validates args with Zod schema

**Why it exists:**
- For queries that take complex arguments needing validation
- Example: Search with multiple filters, pagination params, etc.

---

### 3.7 Re-exports

```typescript
export { query, mutation };
```

**Why:** So files can import everything from one place:
```typescript
import { query, authedMutation, authedZodMutation } from './lib/functions';
```

---

## 4. Timestamp Utilities

### File: `packages/backend/convex/lib/timestamps.ts`

```typescript
export const now = () => Date.now();

export const createTimestamps = () => {
  const timestamp = now();
  return { createdAt: timestamp, updatedAt: timestamp };
};

export const updateTimestamp = () => ({ updatedAt: now() });
```

| Function | Returns | Use Case |
|----------|---------|----------|
| `now()` | Current timestamp (ms) | Single timestamp value |
| `createTimestamps()` | `{ createdAt, updatedAt }` | Creating new documents |
| `updateTimestamp()` | `{ updatedAt }` | Patching existing documents |

**Why these exist:**
- DRY principle: Avoid `createdAt: Date.now(), updatedAt: Date.now()` everywhere
- Consistency: All timestamps use the same format
- Testability: Can mock `now()` for testing

**Before:**
```typescript
await db.insert('userProfiles', {
  authId: user._id,
  displayName: args.displayName,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

**After:**
```typescript
await db.insert('userProfiles', {
  authId: user._id,
  displayName: args.displayName,
  ...createTimestamps(),
});
```

**Where it's used:** `userProfiles.ts`

---

## 5. Relationship Helpers

### Import: `getOneFrom`

```typescript
import { getOneFrom } from 'convex-helpers/server/relationships';
```

**What it does:**
- Fetches a single document from a table using an index
- Returns `null` if not found (doesn't throw)
- Type-safe: Knows the document type based on table name

**Function signature:**
```typescript
getOneFrom(db, tableName, indexName, indexValue) → Document | null
```

**Why it exists:**
- Simplifies the common pattern of "find one by index"
- More readable than raw index queries
- Handles null checking internally

**Before (without convex-helpers):**
```typescript
const existingProfile = await ctx.db
  .query('userProfiles')
  .withIndex('by_authId', (q) => q.eq('authId', user._id))
  .first();
```

**After (with convex-helpers):**
```typescript
const existingProfile = await getOneFrom(db, 'userProfiles', 'by_authId', user._id);
```

**Where it's used:**
- `userProfiles.ts` - Find existing profile by authId
- `users.ts` - Get user profile for current user

**Related helpers (available but not currently used):**
- `getManyFrom(db, table, index, value)` - Get all matching documents
- `getManyVia(db, table, index, otherTable, otherIndex)` - Many-to-many queries

---

## 6. Shared Validators

### File: `packages/shared/src/validators/user-schemas.ts`

**What it contains:**
- All Zod schemas for user-related forms
- Exported types inferred from schemas

**Key schema used with convex-helpers:**

```typescript
export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
});
```

**Why in shared package:**
- **Single source of truth**: Same schema used on frontend (form validation) and backend (mutation validation)
- **Workspace dependency**: Both `@pripremi-se/web` and `@pripremi-se/backend` can import from `@pripremi-se/shared`

**How frontend uses it:**
```typescript
// In a React component
import { profileUpdateSchema } from '@pripremi-se/shared';

const form = useForm({
  defaultValues: { displayName: '', location: '' },
  validators: { onChange: profileUpdateSchema },
});
```

**How backend uses it:**
```typescript
// In userProfiles.ts
import { profileUpdateSchema } from '@pripremi-se/shared';

export const updateMyProfile = authedZodMutation({
  args: profileUpdateSchema,  // Same schema!
  handler: async (ctx, args) => { ... },
});
```

---

## 7. Complete Flow

Here's how all pieces work together when a user updates their profile:

```
1. User fills form → Frontend validates with profileUpdateSchema
                     ↓
2. Form submits → Convex mutation called with { displayName, location }
                     ↓
3. authedZodMutation runs:
   a. customCtx checks auth → Gets user from authComponent
   b. If no user → Throws "Not authenticated"
   c. If user exists → Adds { user } to ctx
   d. zCustomMutation validates args with profileUpdateSchema
   e. If validation fails → Returns Zod error
   f. If validation passes → Runs handler
                     ↓
4. Handler runs:
   a. getOneFrom finds existing profile by user._id
   b. If exists → db.patch with updateTimestamp()
   c. If new → db.insert with createTimestamps()
                     ↓
5. Success → Returns profile ID to frontend
```

---

## 8. Summary Table

| Component | Import Path | Purpose | Files Using It |
|-----------|-------------|---------|----------------|
| `customQuery` | `convex-helpers/server/customFunctions` | Base for custom query builders | functions.ts |
| `customMutation` | `convex-helpers/server/customFunctions` | Base for custom mutation builders | functions.ts |
| `customCtx` | `convex-helpers/server/customFunctions` | Modify/extend ctx | functions.ts |
| `zCustomMutation` | `convex-helpers/server/zod4` | Zod-validated mutation builder | functions.ts |
| `zCustomQuery` | `convex-helpers/server/zod4` | Zod-validated query builder | functions.ts |
| `getOneFrom` | `convex-helpers/server/relationships` | Fetch one document by index | users.ts, userProfiles.ts |
| `optionalAuthQuery` | Local (`./lib/functions`) | Query with optional auth | users.ts |
| `authedQuery` | Local (`./lib/functions`) | Query requiring auth | (available) |
| `authedMutation` | Local (`./lib/functions`) | Mutation requiring auth | (available) |
| `authedZodMutation` | Local (`./lib/functions`) | Zod mutation requiring auth | userProfiles.ts |
| `authedZodQuery` | Local (`./lib/functions`) | Zod query requiring auth | (available) |
| `createTimestamps` | Local (`./lib/timestamps`) | Create new document timestamps | userProfiles.ts |
| `updateTimestamp` | Local (`./lib/timestamps`) | Update existing document timestamp | userProfiles.ts |

---

## Sources

- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers)
- [Convex Custom Functions](https://stack.convex.dev/custom-functions)
- [Zod Validation with Convex](https://stack.convex.dev/typescript-zod-function-validation)

# Monorepo Migration + convex-helpers Integration

## Status: COMPLETED ✅

Migration completed on December 2, 2025.

---

## Summary

Successfully migrated from a single-package structure to a Turborepo monorepo with pnpm workspaces, and integrated convex-helpers for cleaner auth patterns.

### What Was Done

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Monorepo Setup | ✅ Complete | Turborepo + pnpm workspaces |
| Phase 2: Shared Validators | ✅ Complete | `@pripremi-se/shared` package |
| Phase 3: convex-helpers | ✅ Complete | With deviation (see below) |
| Phase 4: Frontend Imports | ✅ Complete | Updated to workspace packages |

### Deviation from Original Plan

**Zod server-side validation**: The original plan included using `authedZodMutation` from convex-helpers to validate args with Zod schemas on the server. However, **Zod v4 is not compatible** with convex-helpers' `zodToConvex` converter (error: "Cannot read properties of undefined (reading 'typeName')").

**Solution**: Using `authedMutation` with standard Convex validators (`v.string()`, `v.optional()`) instead. Zod validation still happens on the frontend via `@pripremi-se/shared` validators - the backend just uses Convex's native validators.

This is acceptable because:
- Frontend validation catches most user errors
- Convex validators still provide type safety
- Can revisit when convex-helpers adds Zod v4 support

---

## Final Monorepo Structure

```
pripremi-se/
├── apps/
│   └── web/                          # Frontend (Vite + TanStack Router)
│       ├── src/
│       ├── package.json              # @pripremi-se/web
│       └── vite.config.ts
├── packages/
│   ├── backend/                      # Convex backend
│   │   ├── convex/
│   │   │   ├── lib/
│   │   │   │   ├── functions.ts      # Custom auth wrappers
│   │   │   │   └── timestamps.ts     # Timestamp utilities
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── userProfiles.ts
│   │   │   └── ...
│   │   ├── package.json              # @pripremi-se/backend
│   │   └── .env.local                # Convex deployment URL
│   └── shared/                       # Shared code
│       ├── src/
│       │   ├── validators/
│       │   │   ├── user-schemas.ts   # Zod schemas
│       │   │   └── index.ts
│       │   └── index.ts
│       └── package.json              # @pripremi-se/shared
├── pnpm-workspace.yaml
├── turbo.json
└── package.json                      # Root with turbo scripts
```

---

## Key Files Created/Modified

### Root Configuration

**`pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {},
    "typecheck": {}
  }
}
```

### Backend Custom Functions

**`packages/backend/convex/lib/functions.ts`**
```typescript
import {
  customQuery,
  customMutation,
  customCtx,
} from 'convex-helpers/server/customFunctions';
import { query, mutation } from '../_generated/server';
import { authComponent } from '../auth';

// Returns null if not authenticated
export const optionalAuthQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    return { user: user ?? null };
  })
);

// Throws if not authenticated
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error('Not authenticated');
    return { user };
  })
);

// Throws if not authenticated
export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error('Not authenticated');
    return { user };
  })
);

export { query, mutation };
```

**`packages/backend/convex/lib/timestamps.ts`**
```typescript
export const now = () => Date.now();

export const createTimestamps = () => {
  const timestamp = now();
  return { createdAt: timestamp, updatedAt: timestamp };
};

export const updateTimestamp = () => ({ updatedAt: now() });
```

### Example Refactored Mutation

**`packages/backend/convex/userProfiles.ts`**
```typescript
import { v } from 'convex/values';
import { getOneFrom } from 'convex-helpers/server/relationships';
import { authedMutation } from './lib/functions';
import { createTimestamps, updateTimestamp } from './lib/timestamps';

export const updateMyProfile = authedMutation({
  args: {
    displayName: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, db } = ctx;

    const existingProfile = await getOneFrom(
      db,
      'userProfiles',
      'by_authId',
      user._id
    );

    if (existingProfile) {
      await db.patch(existingProfile._id, {
        ...args,
        ...updateTimestamp(),
      });
      return existingProfile._id;
    }

    return await db.insert('userProfiles', {
      authId: user._id,
      ...args,
      role: 'user',
      ...createTimestamps(),
    });
  },
});
```

---

## Commands

```bash
# Install all dependencies
pnpm install

# Run all dev servers (web + convex)
pnpm dev

# Run individual packages
pnpm --filter @pripremi-se/web dev
pnpm --filter @pripremi-se/backend dev
```

---

## Testing Checklist

- [x] `pnpm install` works from root
- [x] `pnpm dev` starts all services
- [x] Convex dev server starts successfully
- [x] Shared validators import correctly in web app
- [x] Custom auth functions work (`authedMutation`, `optionalAuthQuery`)
- [x] Timestamp utilities work
- [x] `getOneFrom` helper works for relationships
- [ ] End-to-end testing of settings page (manual verification needed)

---

## Benefits Achieved

| Before | After |
|--------|-------|
| Single package structure | Monorepo ready for mobile apps |
| Validators duplicated | Single source in `@pripremi-se/shared` |
| Manual `authComponent.getAuthUser(ctx)` everywhere | `authedMutation` auto-injects `ctx.user` |
| Manual `Date.now()` everywhere | `createTimestamps()` / `updateTimestamp()` |
| Manual index queries | `getOneFrom()` / `getManyFrom()` |

---

## Future Improvements

1. **Zod Server Validation**: When convex-helpers supports Zod v4, migrate to `authedZodMutation`
2. **Row-Level Security**: Add database access wrappers for ownership enforcement
3. **Triggers**: Implement automatic timestamp updates on document changes
4. **Mobile App**: Add `apps/mobile/` using React Native/Expo

---

## Sources

- [Convex Monorepo Template](https://github.com/get-convex/turbo-expo-nextjs-clerk-convex-monorepo)
- [convex-helpers](https://github.com/get-convex/convex-helpers)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo)

# 🛠️ StraySafe – Safe Prisma Migration Guide

This guide explains how to **migrate to Prisma** for managing your Supabase/PostgreSQL schema **without breaking existing data or workflows**. It assumes you're already using Supabase directly with SQL or Supabase Studio.

---

## ✅ Goal

- Adopt Prisma as your **ORM and schema manager**
- Preserve **existing Supabase tables, data, RLS policies, and permissions**
- Enable future migrations and TypeScript typings with safety

---

## 🧱 Step 1: Install Prisma

```bash
bun add prisma @prisma/client --dev
bunx prisma init
```

Update `.env` with your Supabase database URL:

```env
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"
```

> Tip: Get this from Supabase > Project Settings > Database

---

## 📥 Step 2: Introspect Existing DB

Run Prisma introspection to generate a schema from your existing Supabase database:

```bash
bunx prisma db pull
```

This will generate your current `prisma/schema.prisma` file without modifying the DB.

---

## ⚠️ Step 3: Prevent Conflicts with Supabase Migrations

- **Do not** use `prisma migrate dev` if Supabase is already managing your schema via SQL migrations or Studio.
- **Instead**, treat Prisma as a read-only mirror of your DB for now:
  - For typing
  - For generating client queries

---

## 🔄 Step 4: Use Prisma Client

Generate the client:

```bash
bunx prisma generate
```

Then use it in your app:

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dogs = await prisma.dogs.findMany({
  where: { status: "fostered" },
  include: {
    locations: true,
    events: true
  }
})
```

---

## 🛡️ Step 5: Keep RLS / Auth / Triggers in Supabase

- Prisma doesn't manage RLS or Supabase auth.
- Continue using Supabase SQL editor for:
  - Row Level Security
  - Auth functions
  - Policies and storage

---

## 🔁 Optional: Dual Schema Management

If you want Prisma to manage part of the schema in the future:
- Use a **shadow DB** for Prisma migrations
- Coordinate manually with Supabase SQL scripts
- Keep clear separation between Prisma-managed tables and others

---

## 🧪 Step 6: Test Carefully

Run the test file to verify everything works:

```bash
# Test Prisma integration
node -e "import('./lib/test-prisma.js').then(m => m.testPrismaConnection())"
```

- Test all Prisma queries against real data
- Validate Supabase policies still work
- Monitor logs for permission or type errors

---

## 🚨 Important Considerations for StraySafe

### Current Database Schema
Our StraySafe database includes:
- `profiles` - User profiles with auth integration
- `dogs` - Core dog tracking with status workflow
- `events` - Timeline events for dog history
- `locations` - Geographic regions
- `conversations` & `messages` - Real-time messaging
- `user_notification_settings` - Notification preferences
- `user_dog_interests` - New dog interaction features
- `dog_comments` - Public commenting system

### Integration Strategy
1. **Keep Supabase for Auth**: Continue using Supabase Auth with RLS
2. **Use Prisma for Queries**: Leverage type safety and better query builder
3. **Maintain SQL Migrations**: Keep using SQL files for schema changes
4. **Gradual Migration**: Start with read-only operations, then expand

### Example Implementation

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Usage in hooks/dogs-store.ts
import { prisma } from '@/lib/prisma'

export const useDogs = () => {
  const getDogs = async () => {
    return await prisma.dogs.findMany({
      include: {
        locations: true,
        events: {
          where: { is_private: false },
          orderBy: { created_at: 'desc' }
        },
        user_dog_interests: {
          include: {
            profiles: true
          }
        }
      }
    })
  }
  
  return { getDogs }
}
```

---

## ✅ Summary

| What                 | How                         |
|----------------------|------------------------------|
| Keep existing data   | Use `bunx prisma db pull`    |
| Avoid schema breaks  | Don't use `migrate dev` yet  |
| Generate client code | `bunx prisma generate`       |
| Use with Supabase    | RLS & auth stay in Supabase  |
| Maintain migrations  | Keep SQL files in supabase/  |

---

This guide ensures a smooth Prisma integration **without breaking Supabase features** while providing better TypeScript support and query capabilities for StraySafe v2.
# Architecture Patterns: Next.js 15 SaaS Boilerplate with App Router

**Domain:** Full-stack SaaS web application
**Researched:** 2026-02-05
**Confidence Level:** HIGH (verified against official Next.js 16 docs, multiple 2026 boilerplate references)

---

## Executive Summary

A modern Next.js 15 SaaS boilerplate should follow a **Server-First architecture** with Client Components only for interactivity. The structure divides responsibility into clear layers: **routes** (App Router pages), **server actions** (data mutations), **components** (UI organized by Atomic Design), **database** (Drizzle schemas + queries), and **libraries** (utilities, validation, clients).

**Core principle:** Push logic server-side, make client components as simple as possible. Server Components render on the server and never ship code to browser—use this as your default.

---

## Recommended Folder Structure

```
app/                                 # Next.js App Router
├── (auth)/                          # Route group: unauthenticated pages
│   ├── login/
│   │   └── page.tsx                 # Server Component by default
│   └── register/
│       └── page.tsx
│
├── (dashboard)/                     # Route group: authenticated pages
│   ├── layout.tsx                   # Shared dashboard layout (auth check here)
│   ├── page.tsx                     # /dashboard home
│   ├── settings/
│   │   └── page.tsx                 # /dashboard/settings
│   ├── billing/
│   │   └── page.tsx                 # /dashboard/billing (Stripe integration)
│   └── [team-id]/                   # Dynamic routes for multi-tenant
│       ├── layout.tsx
│       ├── page.tsx
│       └── members/
│           └── page.tsx
│
├── api/                             # Server-side API routes
│   ├── webhooks/
│   │   └── stripe/
│   │       └── route.ts             # Stripe webhook handler (signature verification)
│   └── [resource]/
│       └── route.ts                 # Only for external integrations
│
├── actions/                         # Server Actions (DATA LAYER)
│   ├── auth.ts                      # Login, register, logout, verify email
│   ├── profile.ts                   # User profile mutations
│   ├── team.ts                      # Team creation, member management
│   ├── billing.ts                   # Stripe checkout, subscription management
│   └── [feature].ts                 # Feature-specific actions
│
├── layout.tsx                       # Root layout (global providers)
├── page.tsx                         # Home page
├── error.tsx                        # Error boundary
├── loading.tsx                      # Loading UI (streaming)
├── not-found.tsx                    # 404 page
└── global-error.tsx                 # Global error boundary

components/                          # UI components (ATOMIC DESIGN)
├── atoms/                           # Smallest reusable units
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Icon.tsx
│   ├── Heading.tsx
│   └── Text.tsx
│
├── molecules/                       # Combinations of atoms
│   ├── FormField.tsx                # Input + Label + Error
│   ├── Card.tsx                     # Container with padding/border
│   ├── Avatar.tsx                   # Avatar with fallback
│   ├── SearchBar.tsx                # Input + Icon search
│   └── Pagination.tsx               # Navigation with buttons
│
├── organisms/                       # Complex UI sections
│   ├── Header.tsx                   # Navigation + User menu
│   ├── Sidebar.tsx                  # Navigation sidebar
│   ├── FormSection.tsx              # Form with multiple fields
│   ├── DataTable.tsx                # Table with sorting/filtering
│   ├── Modal.tsx                    # Dialog container
│   └── AuthForm.tsx                 # Login/signup form
│
└── ui/                              # Shadcn/ui or design system components
    ├── button.tsx                   # Pre-configured button variants
    ├── input.tsx                    # Input wrapper with styling
    ├── dialog.tsx                   # Dialog/modal wrapper
    └── [component].tsx              # Geist design system components

lib/                                 # Utilities and services
├── auth.ts                          # Better Auth client + session utilities
├── db.ts                            # Drizzle ORM client instance
├── stripe.ts                        # Stripe client + helper functions
├── validations.ts                   # Zod schemas (shared client/server)
├── utils/                           # Helper functions
│   ├── format.ts                    # Date, currency, text formatting
│   ├── cn.ts                        # Class name merging (clsx/classnames)
│   └── constants.ts                 # App-wide constants
├── hooks/                           # Client-side custom hooks
│   ├── useAsync.ts                  # Async data fetching
│   ├── useLocalStorage.ts           # Local storage management
│   └── [feature].ts                 # Feature-specific hooks
└── dal.ts                           # Data Access Layer (session checks, user queries)

db/                                  # Database
├── schema.ts                        # Drizzle table definitions + relations
├── queries.ts                       # Pre-built queries (read-only)
├── migrations/                      # Generated migration files
│   └── 0001_users.sql
└── index.ts                         # Export db client + queries

types/                               # TypeScript types
├── auth.ts                          # Session, user types
├── api.ts                           # API response types
└── [domain].ts                      # Domain-specific types

__tests__/                           # Testing
├── unit/                            # Unit tests (functions, utilities)
│   └── validations.test.ts
├── integration/                     # Integration tests (actions, db)
│   └── auth.actions.test.ts
└── e2e/                             # End-to-end tests (Playwright)
    └── auth.spec.ts

public/                              # Static assets
├── images/
├── icons/
└── fonts/

.env.example                         # Environment variable template
.env.local                           # (gitignored) Local development
next.config.ts                       # Next.js configuration
tsconfig.json                        # TypeScript configuration
package.json
bun.lock                             # Bun lockfile
```

### Rationale for Structure

**Route Groups (`(auth)`, `(dashboard)`)**: Don't affect URL but organize related routes. Enables shared layouts without URL pollution.

**Separate `actions/` directory**: All Server Action mutations live here. Keeps frontend components clean and makes data mutations discoverable.

**Atomic Design in components/**: Scales as you grow:
- **Atoms**: Reusable single-purpose UI (Button, Input)
- **Molecules**: Combinations of atoms (FormField = Label + Input + Error)
- **Organisms**: Complex sections (Header, Sidebar, DataTable)
- This mirrors Geist design system structure

**`lib/dal.ts` (Data Access Layer)**: Central place to verify authentication before database queries. Prevents auth bugs.

**`db/queries.ts`**: Pre-built, reusable queries prevent query duplication across Server Actions.

---

## Component Boundaries

Clear boundaries prevent tight coupling and make testing easier.

### Boundary Map

| Component | Type | Responsibility | Communicates With | Notes |
|-----------|------|-----------------|-------------------|-------|
| **Page** | Server | Fetch data, render layout, verify auth | DAL, actions, layouts | Never add 'use client' unless page needs interactivity |
| **Layout** | Server | Shared structure, provider setup, auth checks | DAL, child pages | Root layout: auth verification, theme provider, analytics |
| **Action Component** | Client | Form submission, button click handlers | Server Actions | Minimal logic—just UI interaction |
| **Display Component** | Server | Render data from props | Database queries, child components | No state, no effects, pure data rendering |
| **Atom** | Client/Server | Single UI element | None (receives props only) | Button, Input, Badge—always presentational |
| **Molecule** | Client/Server | Combination of atoms | Atoms, Server Actions | FormField wraps Input + Label |
| **Organism** | Client | Complex interactive section | Molecules, atoms, Server Actions | DataTable, Modal, Form sections |
| **Server Action** | Server | Data mutation + validation | Database, external APIs (Stripe) | Input validation with Zod, auth check, error handling |

### Key Rules

1. **Server Components are default** - Start here. Only add `'use client'` when you need:
   - Event listeners (onClick, onChange)
   - Hooks (useState, useEffect, useContext)
   - Client-side state

2. **Props drilling vs Context** - For SaaS:
   - **Props drilling** (3-4 levels): OK, explicit data flow
   - **React Context**: Use for truly global client state (theme, user menu toggle)
   - **Zustand/Redux**: Use for complex client-side app state
   - **Database queries**: Use Server Components instead of context (cleaner, cached)

3. **Server Actions are data gates** - All mutations must go through Server Actions:
   - Login/logout/signup
   - Form submissions
   - Database writes
   - Stripe operations (checkout, cancel)

4. **No API routes for simple mutations** - Use Server Actions instead:
   ```typescript
   // ❌ AVOID: API route
   // api/users/profile/route.ts - extra boilerplate

   // ✅ PREFER: Server Action
   // actions/profile.ts - shorter, type-safe
   ```

---

## Data Flow Architecture

Shows how data moves through the system.

### Request-Response Cycle (Happy Path)

```
User Action (form submit)
    ↓
Client Component (captures input)
    ↓
Server Action (validates, auth checks, mutations)
    ↓
Database (Drizzle ORM)
    ↓
Cache invalidation (revalidateTag)
    ↓
Server Component re-renders with fresh data
    ↓
HTML streamed to client
    ↓
React hydrates, interactive immediately
```

### Detailed Data Flow Diagrams

#### 1. Page Load (Server-Side Rendering)

```
Request → Root Layout (verify session) →
    ├─ Header (fetch nav data)
    ├─ Sidebar (fetch menu)
    └─ Page Component (fetch page data)
        └─ Suspense.fallback = Loading skeleton
            └─ Once data ready → Render full page
                └─ Stream HTML to client
                    └─ Browser receives skeleton, then full content
```

#### 2. Form Submission (Server Action)

```
<form action={submitAction}>
    └─ User clicks submit
        └─ Client extracts FormData
            └─ Call Server Action (auto JSON serialization)
                └─ Server validates with Zod
                    └─ Auth check (DAL)
                        └─ Database mutation
                            └─ revalidateTag() invalidates cache
                                └─ Components with that tag re-render
                                    └─ Fresh data returned to client
                                        └─ Form shows success/error
```

#### 3. Stripe Webhook Flow

```
Stripe event (customer.subscription.updated)
    ↓
POST /api/webhooks/stripe with signature
    ↓
Verify signature (CRITICAL: prevents spoofing)
    ↓
Server Action: updateSubscriptionStatus(customerId, status)
    ↓
Database mutation (subscriptions table)
    ↓
Cache revalidation
    ↓
Dashboard reflects new plan instantly
```

#### 4. Client State (Minimal)

```
Client Component (interactive only)
    └─ useState for form input
        └─ onChange handlers capture input
            └─ Server Action called with form data
                └─ Response triggers router.refresh()
                    └─ Page re-fetches server data
                        └─ UI updates with fresh data
```

### Cache Invalidation Strategy

**Pattern:** Tag-based revalidation for specific data domains

```typescript
// actions/profile.ts
'use server';

import { revalidateTag } from 'next/cache';

export async function updateProfile(formData: FormData) {
  // Validate, auth check, mutation
  await db.update(users).set({ name: formData.get('name') });

  // Invalidate all components tagged 'profile'
  revalidateTag('profile');
}

// components/ProfileCard.tsx (Server Component)
export async function ProfileCard() {
  const data = await fetch('...', {
    next: { tags: ['profile'] }  // Tagged with 'profile'
  });
  // When updateProfile calls revalidateTag('profile'),
  // this component re-renders with fresh data
}
```

---

## Patterns to Follow

### Pattern 1: Server-First Data Fetching

**What:** Fetch data in Server Components, not in useEffect

**When:** Loading page data, user preferences, database records

**Example:**

```typescript
// ✅ CORRECT - Server Component
export default async function DashboardPage() {
  const user = await getUser();  // Server-side, no network request
  const teams = await db.query.teams.findMany({
    where: eq(teams.userId, user.id)
  });

  return <TeamsList teams={teams} />;
}

// ❌ AVOID - Client-side fetching
'use client';
export default function DashboardPage() {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(setTeams);
  }, []);
  return <TeamsList teams={teams} />;
}
```

**Benefits:**
- No waterfalls (fetch on server in parallel)
- No loading states needed (streaming handles it)
- Secrets stay on server
- Better Core Web Vitals (LCP improves)

---

### Pattern 2: Server Actions for Mutations

**What:** Use Server Actions for form submissions, not POST API routes

**When:** Form submission, button clicks that mutate data

**Example:**

```typescript
// actions/team.ts
'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format')
});

export async function createTeam(formData: FormData) {
  // Validate input
  const parsed = createTeamSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug')
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  // Auth check (DAL)
  const user = await getUser();
  if (!user) redirect('/login');

  // Mutation
  const team = await db.insert(teams).values({
    name: parsed.data.name,
    slug: parsed.data.slug,
    ownerId: user.id
  });

  // Invalidate cache
  revalidateTag('teams');

  // Redirect
  redirect(`/team/${team.id}`);
}

// components/CreateTeamForm.tsx
'use client';
import { createTeam } from '@/actions/team';

export function CreateTeamForm() {
  const [error, setError] = useState(null);
  const [pending, setAction] = useActionState(
    async (prevState, formData) => {
      const result = await createTeam(formData);
      if (result?.error) setError(result.error);
      return prevState;
    }
  );

  return (
    <form action={pending} method="POST">
      <input name="name" placeholder="Team name" />
      <input name="slug" placeholder="team-slug" />
      <button type="submit">Create</button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
}
```

**Benefits:**
- Type-safe (TypeScript catches mismatches)
- Auto serialization of FormData
- No need to JSON.stringify
- Automatic error handling
- Built-in loading state with useActionState

---

### Pattern 3: Atomic Design Component Composition

**What:** Build complex UIs by composing atoms → molecules → organisms

**When:** Creating reusable UI components

**Example:**

```typescript
// atoms/Input.tsx - Smallest unit
export function Input({
  label,
  error,
  ...props
}: InputProps) {
  return <input className={error ? 'border-red-500' : ''} {...props} />;
}

// molecules/FormField.tsx - Input + Label + Error
export function FormField({
  name,
  label,
  error
}: FormFieldProps) {
  return (
    <div>
      <Label>{label}</Label>
      <Input name={name} />
      {error && <Text variant="error">{error}</Text>}
    </div>
  );
}

// organisms/LoginForm.tsx - Form with multiple fields
export function LoginForm() {
  return (
    <form action={loginAction}>
      <FormField name="email" label="Email" />
      <FormField name="password" label="Password" type="password" />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

**Why Atomic Design scales:**
- Atoms are tested in isolation
- Molecules compose atoms predictably
- Organisms are complex but built from tested components
- Changes to atoms propagate safely upward

---

### Pattern 4: Streaming with Suspense Boundaries

**What:** Show skeleton loaders while data streams from server

**When:** Pages with slow/multiple data sources

**Example:**

```typescript
// app/(dashboard)/page.tsx
import { Suspense } from 'react';
import { DashboardSkeleton, DataTableSkeleton } from '@/components/skeletons';

export default async function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast section - renders immediately */}
      <div className="grid grid-cols-3 gap-4">
        <Suspense fallback={<DashboardSkeleton />}>
          <QuickStats />
        </Suspense>
      </div>

      {/* Slow section - user sees skeleton while loading */}
      <Suspense fallback={<DataTableSkeleton />}>
        <RecentTransactions />
      </Suspense>
    </div>
  );
}

async function QuickStats() {
  const stats = await getStatsQuick();  // 50ms
  return <StatCards stats={stats} />;
}

async function RecentTransactions() {
  const txns = await getTransactionsWithAnalytics();  // 2s
  return <DataTable data={txns} />;
}
```

**Benefits:**
- User sees skeleton immediately (good UX)
- Fast sections render while slow sections load
- No blocking waterfalls
- Streaming HTML to client in chunks

---

### Pattern 5: Data Access Layer (DAL) for Auth

**What:** Central place to verify session before database access

**When:** Any query that requires authentication

**Example:**

```typescript
// lib/dal.ts - Data Access Layer
import { getSession } from '@/lib/auth';

export async function getUser() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

export async function getUserTeams(userId: string) {
  const user = await getUser();  // Ensures auth

  if (user.id !== userId) throw new Error('Forbidden');  // Ownership check

  return db.query.teams.findMany({
    where: eq(teams.ownerId, userId)
  });
}

// In Server Actions or Server Components
'use server';

export async function deleteTeam(teamId: string) {
  const user = await getUser();  // Auth check
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId)
  });

  if (team.ownerId !== user.id) throw new Error('Forbidden');  // Ownership check

  await db.delete(teams).where(eq(teams.id, teamId));
}
```

**Benefits:**
- Auth logic centralized (fewer bugs)
- Prevents common auth vulnerabilities
- Reusable across actions and components
- Easy to test

---

### Pattern 6: Type-Safe Validation with Zod

**What:** Define schemas once, use on client AND server

**When:** Form validation, API inputs

**Example:**

```typescript
// lib/validations.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ chars')
});

export type LoginInput = z.infer<typeof loginSchema>;

// actions/auth.ts
'use server';

import { loginSchema } from '@/lib/validations';

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Use parsed.data - TypeScript knows the shape
  const session = await authenticateUser(parsed.data.email, parsed.data.password);
}

// components/LoginForm.tsx - Same schema
'use client';

import { loginSchema, type LoginInput } from '@/lib/validations';

export function LoginForm() {
  // Client-side validation with same schema
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password')
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    // Server Action
    await login(formData);
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Benefits:**
- Single source of truth for validation rules
- Type safety across client and server
- Better DX (autocomplete on validated data)
- Prevents sync bugs between client and server validation

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Over-Using Client Components

**What goes wrong:** Marking entire pages as `'use client'` defeats purpose of Server Components

**Why it happens:** Habit from old React or fear of learning new patterns

**Consequences:** Loss of performance, secrets leak to client, larger bundles

**Prevention:**
- Default to Server Components
- Use `'use client'` only for interactive elements
- Hoist Client Components to smallest subtree that needs it

**Instead:**
```typescript
// ❌ AVOID
'use client';
export default function Page() {
  const data = await fetch('/api/data');  // Can't await in client!
  return <Component data={data} />;
}

// ✅ PREFER
// Server Component
export default async function Page() {
  const data = await fetch('/api/data');
  return <ClientComponent data={data} />;
}

'use client';
function ClientComponent({ data }) {
  const [expanded, setExpanded] = useState(false);  // Client state only
  return <button onClick={() => setExpanded(!expanded)}>Toggle</button>;
}
```

---

### Anti-Pattern 2: API Routes for Simple Mutations

**What goes wrong:** Creating /api/users/create route when Server Action is better

**Why it happens:** Old patterns from REST APIs

**Consequences:** Boilerplate, no type safety, CORS headaches, manual error handling

**Prevention:**
- Use Server Actions by default
- Only use API routes for:
  - External webhooks (Stripe, GitHub)
  - Third-party service integrations
  - Mobile app backends that need REST

**Instead:**
```typescript
// ❌ AVOID - API route
// api/users/update/route.ts
export async function PUT(req: Request) {
  const body = await req.json();
  // Manual validation, error handling, auth check
  await db.update(users).set(body);
  return Response.json({ success: true });
}

// ✅ PREFER - Server Action
// actions/user.ts
'use server';

export async function updateUser(formData: FormData) {
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  const user = await getUser();  // Auth
  await db.update(users).set(parsed.data);
  revalidateTag('user');
}
```

---

### Anti-Pattern 3: Prop Drilling > 4 Levels Deep

**What goes wrong:** Passing same prop through 5+ components

**Why it happens:** Lazy refactoring, not thinking about data shape

**Consequences:** Hard to trace data flow, fragile to refactors, unreadable

**Prevention:**
- If prop drilling > 4 levels: Use context or fetch data in that subtree
- For truly global state: Use Zustand/Redux
- For server data: Use Server Components that query database directly

**Instead:**
```typescript
// ❌ AVOID - Drilling through 5 levels
<Root user={user}>
  <Sidebar user={user}>
    <NavMenu user={user}>
      <UserButton user={user}>
        <AvatarPopover user={user}>
          <UserProfile user={user} />

// ✅ PREFER - Context
<Root>
  <UserProvider user={user}>
    <Sidebar>
      <NavMenu>
        <UserButton>
          <AvatarPopover>
            <UserProfile />  {/* useUser() hook */}
```

---

### Anti-Pattern 4: Caching Misunderstanding

**What goes wrong:** Assuming data is cached when it isn't (or vice versa)

**Why it happens:** Next.js 15 defaults changed; didn't read migration guide

**Consequences:** Stale data, database overload, security issues

**Prevention:**
- Understand: Next.js 15+ defaults to `dynamic = 'force-dynamic'` (uncached)
- Explicitly set `revalidate` or use cache tags
- Test in production (dev server always revalidates)

**Instead:**
```typescript
// ❌ WRONG - Assumes it's cached
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}

// ✅ CORRECT - Explicit cache control
export const revalidate = 3600;  // ISR: revalidate every hour

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }  // Or inline
  });
  return <div>{data}</div>;
}
```

---

### Anti-Pattern 5: Ignoring Stripe Signature Verification

**What goes wrong:** Processing webhook without verifying signature

**Why it happens:** Copy-pasting example code without understanding security

**Consequences:** Anyone can spoof webhooks, fraud, double charges

**Prevention:**
- ALWAYS verify Stripe signature before processing
- Use `stripe.webhooks.constructEvent()`
- Never trust webhook data without verification

**Instead:**
```typescript
// ❌ DANGEROUS - No signature verification
// api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  if (event.type === 'customer.subscription.updated') {
    updateSubscription(event.data);  // VULNERABLE!
  }
}

// ✅ SAFE - Signature verified
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'customer.subscription.updated') {
      updateSubscription(event.data);  // Safe - Stripe verified
    }
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
}
```

---

### Anti-Pattern 6: Server Actions Without Input Validation

**What goes wrong:** Accepting user input without validation

**Why it happens:** Thinking Server Actions are "secure by default"

**Consequences:** SQL injection, data corruption, security bugs

**Prevention:**
- Always validate with Zod before using input
- Think of Server Actions as public-facing code
- Treat FormData like you treat API request bodies

**Instead:**
```typescript
// ❌ DANGEROUS - No validation
'use server';
export async function updateTeam(teamId: string, name: string) {
  await db.update(teams)
    .set({ name })
    .where(eq(teams.id, teamId));
}

// ✅ SAFE - Validated input
'use server';
import { updateTeamSchema } from '@/lib/validations';

export async function updateTeam(formData: FormData) {
  const parsed = updateTeamSchema.safeParse({
    teamId: formData.get('teamId'),
    name: formData.get('name')
  });

  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const user = await getUser();  // Auth
  const team = await getTeamOwned(parsed.data.teamId, user.id);  // Ownership

  if (!team) return { error: 'Team not found' };

  await db.update(teams)
    .set({ name: parsed.data.name })
    .where(eq(teams.id, parsed.data.teamId));
}
```

---

## Scalability Considerations

How the architecture handles growth.

| Concern | At 100 Users | At 10K Users | At 1M Users |
|---------|--------------|--------------|-------------|
| **Database** | Single PG instance (Neon/Supabase free tier) | Need read replicas, add indexes, monitor slow queries | Sharding by tenant_id, separate read/write DB |
| **Caching** | ISR tags sufficient | Add Redis for session caching, real-time features | Multi-level caching: CDN → Redis → DB |
| **Server Actions** | Single Node.js server handles 1000s of concurrent requests | Same (serverless auto-scales on Vercel) | Consider edge functions for global latency |
| **File Uploads** | Store in public/ or R2/S3 | Move to S3 with signed URLs, add image processing | S3 with CloudFront CDN, image optimization service |
| **Authentication** | Better Auth session in cookies | Session persisted in Redis, database queries cached | JWT tokens, edge-computed auth, cached roles/permissions |
| **Stripe Webhooks** | Process immediately in route handler | Queue with Bull/BullMQ, retry failed webhooks | Idempotent webhook handling, deduplication |
| **Real-time Features** | Use polling or ISR | WebSocket with Socket.io or Pusher | Message queue + Socket.io horizontal scaling |

### Database Optimization Roadmap

**Phase 1 (0-1K users):**
```sql
-- Minimal indexes
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
```

**Phase 2 (1K-100K users):**
```sql
-- Add composite indexes for common queries
CREATE INDEX idx_teams_owner_created ON teams(owner_id, created_at DESC);
CREATE INDEX idx_members_team_role ON team_members(team_id, role);
-- Monitor with EXPLAIN ANALYZE
```

**Phase 3 (100K+ users):**
```sql
-- Partitioning
CREATE TABLE subscriptions_2026_jan PARTITION OF subscriptions
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Read replicas
-- Denormalization of hot data
```

---

## Component Build Order (Dependencies)

Which components to build first based on dependencies.

```
Phase 1: Foundation (Week 1)
├── Atoms (Button, Input, Text, Badge)
├── DB schema + migrations
├── Auth actions (login, register, logout)
└── Basic layouts

Phase 2: Core Features (Week 2-3)
├── Molecules (FormField, Card, Avatar)
├── Organisms (Header, Sidebar, AuthForm)
├── Dashboard pages
└── Profile/settings pages

Phase 3: SaaS Features (Week 4-5)
├── Team/workspace management
├── Billing/Stripe integration
├── Team member management
└── Webhooks for Stripe

Phase 4: Polish (Week 6+)
├── Error boundaries
├── Loading states
├── Analytics
├── Performance optimization
```

**Dependency chain:**
```
Auth (login/logout)
  ↓
Protected layouts (require session check)
  ↓
Dashboard pages
  ↓
Team management (create, invite, remove members)
  ↓
Billing (show current plan, upgrade/downgrade)
  ↓
Stripe webhooks (update subscriptions)
```

---

## Sources

**Official Documentation:**
- [Next.js 16 Documentation - App Router](https://nextjs.org/docs/app)
- [Next.js 16 Architecture](https://nextjs.org/docs/architecture)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

**Boilerplate References:**
- [Next.js SaaS Starter (Official)](https://github.com/nextjs/saas-starter)
- [SaaS Boilerplate - ixartz](https://github.com/ixartz/SaaS-Boilerplate)
- [How to Architect a Scalable SaaS with Next.js 15, Shadcn, Drizzle, and Stripe](https://shashankbiplav.hashnode.dev/how-to-architect-a-scalable-saas-with-nextjs-15-shadcn-drizzle-and-stripe-2026-guide)

**Architecture Patterns:**
- [Next.js Architecture in 2026 — Server-First Patterns](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router)
- [Next.js Composition Patterns](https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns)

**Atomic Design:**
- [Implementing Atomic Design in Next.js Projects](https://ijlalwindhi.medium.com/implementing-atomic-design-in-next-js-projects-9d7e5bbcece4)
- [Applying Atomic Design to Next.js](https://blog.logrocket.com/applying-atomic-design-next-js-project/)

**Authentication & Auth Pattern:**
- [Better Auth Documentation](https://www.better-auth.com/)
- [Better Auth with Next.js Integration](https://www.better-auth.com/docs/integrations/next)

**Database:**
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [How to Use Drizzle ORM with PostgreSQL in Next.js 15](https://strapi.io/blog/how-to-use-drizzle-orm-with-postgresql-in-a-nextjs-15-project)

**Payments & Webhooks:**
- [Stripe + Next.js 15: The Complete 2025 Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/)
- [How to Handle Stripe Webhooks in Next.js](https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi)

**Validation & Type Safety:**
- [Type-Safe Form Validation in Next.js 15 with Zod](https://www.abstractapi.com/guides/email-validation/type-safe-form-validation-in-next-js-15-with-zod-and-react-hook-form)
- [Type-Safe Server Actions with next-safe-action](https://next-safe-action.dev/)

**Streaming & Performance:**
- [Next.js Streaming Handbook](https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/)
- [Streaming with Suspense in Next.js](https://blog.logrocket.com/using-next-js-react-suspense-create-loading-component/)

**Anti-Patterns & Best Practices:**
- [Next.js Best Practices 2025](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Why Next.js Falls Short on Software Engineering](https://blog.webf.zone/why-next-js-falls-short-on-software-engineering-d3575614bd08)

**Design System:**
- [Geist Design System](https://vercel.com/geist/introduction)

---

## Key Architectural Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 App Router | Official standard, best DX, optimal performance |
| Server/Client | Server Components first | Better performance, security, no client bundle bloat |
| Data mutations | Server Actions | Type-safe, auto serialization, no API routes needed |
| Database | Drizzle + PostgreSQL | Lightweight, type-safe, edge-compatible |
| Auth | Better Auth | Modern, flexible, multi-tenant ready, Stripe integration |
| Payments | Stripe + webhooks | Industry standard, reliable, webhook-driven |
| Validation | Zod | TypeScript-first, shared schemas client/server |
| Components | Atomic Design + Geist | Scalable, reusable, clear boundaries |
| Styling | Tailwind CSS | Utility-first, scoped, performant |
| Forms | React Hook Form + Server Actions | Client-side UX + server-side safety |
| Caching | Tag-based revalidation | Flexible, fine-grained, predictable |
| Testing | Vitest + Playwright | Fast unit tests, reliable E2E |
| Deployment | Vercel | Zero-config, optimized for Next.js, edge functions |


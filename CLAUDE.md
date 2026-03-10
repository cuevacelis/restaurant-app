# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build + type check
pnpm lint         # ESLint

pnpm run db:setup # Create DB + run schema.sql (fresh install)
pnpm run db:seed  # Insert default users, tables, menu, payment methods

bash infrastructure/setup-aws.sh  # Provision all AWS resources (one-shot)
```

There are no automated tests.

## Architecture

### Overview
Restaurant management SaaS. Staff (admin/waiter/chef) use a dashboard; customers use unauthenticated pages accessed via QR codes. Real-time updates flow from PostgreSQL → Lambda → API Gateway WebSocket → browser.

### Route Groups
- `app/(auth)/dashboard/` — all staff pages; protected by `middleware.ts` (redirects to `/login` if no valid JWT cookie)
- `app/(not-auth)/mesa/[tableId]/` — customer ordering page for a specific table
- `app/(not-auth)/menu/` — general ordering page (no table required)
- `app/(not-auth)/pantalla/` — customer-facing status display board
- `app/api/` — all API routes; no Next.js middleware auth (routes call `requireSession()` / `requireRole()` directly)

The middleware only protects `/dashboard/**`; all other routes (including `/api/**`, `/mesa/**`, `/menu`, `/pantalla`) are public.

### Database Access Pattern
Always use the helpers in `lib/db/index.ts`:
- `query<T>(sql, params)` → `T[]`
- `queryOne<T>(sql, params)` → `T | null`
- `withTransaction(fn)` → wraps `fn(client)` in BEGIN/COMMIT/ROLLBACK

All domain queries live in `lib/db/queries/` (orders, auth, menu, tables, payments). Import from there, never write raw pg calls in route handlers.

### Auth Pattern
**Server side** (`lib/auth.ts`): `getSession()` reads the `session` httpOnly cookie (7-day JWT). `requireSession()` throws if missing. `requireRole(['admin'])` throws if wrong role.

**Client side**: `useSession()` in `app/(auth)/dashboard/orders/services/useOrders.ts` fetches `/api/auth/me` to get the current user's role for conditional UI.

### Form Schemas (Zod)
Zod schemas for forms live in a co-located `schema/` folder next to the page that uses them, named `<feature>-schema.ts`. Example:
- `app/(not-auth)/login/schema/login-schema.ts` — exports `loginSchema` and `LoginFormData`

Always export both the schema and the inferred type (`z.infer<typeof schema>`) from this file.

### Forms — Field Components
Every form must use the Field components from `components/ui/field.tsx` together with React Hook Form's `Controller`. Never render bare inputs without wrapping them in these components.

Structure:
```tsx
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const { control, handleSubmit } = useForm<MyFormData>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});

<form onSubmit={handleSubmit(onSubmit)}>
  <FieldGroup>
    <Controller
      name="fieldName"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="fieldName">Label</FieldLabel>
          <Input id="fieldName" aria-invalid={fieldState.invalid} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  </FieldGroup>
</form>
```

Available exports: `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `FieldDescription`, `FieldSet`, `FieldLegend`, `FieldSeparator`, `FieldContent`, `FieldTitle`.

Key rules:
- `FieldGroup` wraps all fields in the form
- `Field` receives `data-invalid={fieldState.invalid}` — this drives destructive color styling
- `FieldError` takes `errors={[fieldState.error]}` (single error) or an array for multiple; it renders nothing when there are no errors
- `FieldDescription` is used for helper/hint text below the input (optional)

### Client Data Fetching
All client data fetching uses **TanStack Query v5**. Each feature area has a co-located `services/` folder with custom hooks (e.g. `dashboard/orders/services/useOrders.ts`). The customer pages share services from `mesa/[tableId]/services/`.

Pattern: fetch functions are defined outside hooks, hooks wrap them with `useQuery`/`useMutation`, mutations call `qc.invalidateQueries` on success.

### Real-Time Notifications
`NEXT_PUBLIC_WEBSOCKET_URL` must be set in `.env.local`. The `useWebSocket` hook (`hooks/useWebSocket.ts`) connects with query params (`role`, `tableId`, `orderId`) and auto-reconnects every 3s on disconnect. If `NEXT_PUBLIC_WEBSOCKET_URL` is unset, it silently no-ops — polling fallback is used instead.

The WebSocket pipeline: PostgreSQL trigger (on INSERT/UPDATE to `orders`) → `aws_lambda` extension → `restaurant-db-trigger` Lambda → broadcasts via `restaurant-ws-broadcast` Lambda → API Gateway WebSocket → clients.

### Order Status Machine
```
pending → in_preparation → ready_to_deliver → completed → paid
                                    ↓ (any state before paid)
                                 cancelled
```

`completed` = delivered by waiter. `paid` = payment confirmed (either staff manually or MercadoPago webhook).

### Payment Methods
Stored in the `payment_methods` table. Type `manual` shows `display_text` instructions to the customer. Type `mercadopago` stores an `access_token` in the `config` JSONB field (never exposed to clients via `GET /api/payment-methods`).

MercadoPago flow: customer clicks pay → `POST /api/orders/[id]/payment/mp-preference` → redirect to `init_point` → MP redirects back to `/mesa/[tableId]?mp=success|failure|pending` or `/menu?mp=...` → webhook at `/api/webhooks/mercadopago` marks the order as `paid`.

### Customer Session Persistence
Browser cookies (not URL params) track the customer session:
- Mesa: `mesa_{tableId}` cookie (3h TTL)
- Menu: `menu_session` cookie (3h TTL)

Cookies are cleared when the order reaches `paid` status or after a review is submitted.

### Page Component Decomposition Pattern
Large customer-facing pages split their UI into subcomponents inside a co-located `_components/` folder, with pure utility functions in `_lib/` and complex state logic in `_hooks/`. Example: `app/(not-auth)/menu/`.

Rules:
- `_lib/<module>.ts` — pure functions (no React, no hooks); e.g. cookie helpers
- `_hooks/use<Feature>.ts` — custom hooks for cohesive state logic; import from `_lib/` and `_components/_types`
- `_components/_types.ts` — shared types used by multiple subcomponents (e.g. `CartItem`, `MenuStep`)
- `_components/<step>/` — subfolders group components by view step (`shared/`, `name-step/`, `menu-step/`, `tracking-step/`)
- Subcomponents are **pure presentational**: they receive props and call callbacks, no data-fetching hooks
- All data-fetching hooks, handlers, and page-level state stay in `page.tsx`
- Use **ternary** (`condition ? <A /> : null`) instead of `&&` for JSX conditionals (Vercel rule `rendering-conditional-render`)
- Use `React.SyntheticEvent` for form submit prop types to avoid React 19 `FormEvent` deprecation
- Derive state from data during render instead of `useEffect` + `setState` when possible (Vercel rule `rerender-derived-state-no-effect`)

Example structure:
```
app/(not-auth)/menu/
  page.tsx              # data-fetching hooks + handlers + JSX routing
  _lib/
    session.ts          # pure cookie functions (no hooks)
  _hooks/
    useMenuSession.ts   # session init effect + step/name/orderId state
    useCart.ts          # cart items, orderType, notes, totals
  _components/
    _types.ts           # CartItem, MenuStep, etc.
    shared/
      LoadingSpinner.tsx
    name-step/
      NameStep.tsx
    menu-step/
      MenuHeader.tsx
      CategoryTabs.tsx
      MenuItemCard.tsx
      CartSheet.tsx
      CartFab.tsx
    tracking-step/
      StatusTracker.tsx
      OrderDetails.tsx
      MpBanners.tsx
      PaymentSection.tsx
      ReviewSection.tsx
```

### UI Components
Hand-crafted shadcn-style components in `components/ui/`. The package `@base-ui-components/react` is installed but components are built on top of it rather than using Radix UI. Do not swap to Radix primitives.

`lib/utils.ts` contains shared label/color maps: `ORDER_STATUS_LABELS`, `ORDER_STATUS_COLORS`, `ROLE_LABELS`, `formatCurrency`, `formatRelativeTime`.

### Environment Variables
```
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME  # PostgreSQL (defaults to hardcoded RDS)
BETTER_AUTH_SECRET                                            # Cookie signing key
NEXT_PUBLIC_WEBSOCKET_URL                             # API Gateway WebSocket endpoint
NEXT_PUBLIC_APP_URL                                   # Full origin URL (used for MP callbacks)
```

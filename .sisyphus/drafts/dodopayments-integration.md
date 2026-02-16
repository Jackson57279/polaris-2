# Draft: DodoPayments Integration Research

## Current Stack Analysis

### Technology Stack
- **Framework**: Next.js 16.1.1 with App Router
- **Authentication**: Clerk (@clerk/nextjs v6.36.5)
- **Database**: Convex (v1.31.2)
- **State Management**: Convex with Clerk integration
- **Package Manager**: Bun v1.2.0
- **Testing**: bun test

### Current Clerk Setup
- ClerkProvider wraps the entire app in `src/components/providers.tsx`
- ConvexProviderWithClerk integrates Clerk auth with Convex
- Middleware uses `clerkMiddleware()` in `src/proxy.ts`
- Auth config in `convex/auth.config.ts` with JWT issuer domain
- Clerk themes installed (@clerk/themes)

### Current Convex Setup
- Schema defines: projects, files, conversations, messages tables
- Convex HTTP client in `src/lib/convex-client.ts`
- Generated API files in `convex/_generated/`
- Uses Convex React hooks for queries/mutations

### Project Structure
```
src/
├── app/api/           # API routes
├── components/        # Shared components
├── features/          # Feature modules
│   ├── auth/         # Auth components
│   ├── conversations/# Chat system
│   ├── editor/       # CodeMirror
│   ├── preview/      # WebContainer
│   └── projects/     # Project management
├── lib/              # Utilities
└── inngest/          # Background jobs

convex/
├── schema.ts         # Database schema
├── projects.ts       # Project queries/mutations
├── files.ts          # File operations
├── conversations.ts  # Conversation operations
└── system.ts         # Internal API for Inngest
```

---

## DodoPayments Integration Research

### Two Integration Approaches

DodoPayments offers TWO different integration paths:

#### Option 1: `@dodopayments/convex` (RECOMMENDED for this stack)
**Best for**: Convex-first applications with Clerk auth

**Pros**:
- Native Convex component integration
- Webhook handling built-in
- Customer identification via Convex auth context
- All payment logic stays in Convex backend
- Type-safe with Convex generated types

**Cons**:
- Requires Convex dashboard environment variables (not .env)
- Need to create customer mapping in Convex

#### Option 2: `@dodopayments/nextjs`
**Best for**: Next.js-first applications

**Pros**:
- Simple route handlers in Next.js
- Works with standard .env files
- Three checkout types: static, dynamic, session

**Cons**:
- Less integration with Convex (manual webhook handling)
- Requires separate customer ID management

---

## Recommended Approach: `@dodopayments/convex`

### Why This Approach?

1. **Stack Alignment**: Your app is Convex-centric - all data lives in Convex
2. **Auth Integration**: Works seamlessly with existing Clerk + Convex auth
3. **Webhook Handling**: Built-in webhook handler with Convex context
4. **Type Safety**: Leverages Convex's generated types
5. **Customer Portal**: Easy customer portal integration

### Integration Components Needed

1. **Convex Config** (`convex/convex.config.ts`)
   - Add DodoPayments component
   
2. **Environment Variables** (Convex Dashboard)
   - `DODO_PAYMENTS_API_KEY`
   - `DODO_PAYMENTS_ENVIRONMENT` (test_mode/live_mode)
   - `DODO_PAYMENTS_WEBHOOK_SECRET`
   
3. **Schema Updates** (`convex/schema.ts`)
   - Add `customers` table with Clerk auth ID mapping
   - Add `subscriptions` table
   - Add `payments` table (optional, for history)
   
4. **Customer Lookup** (`convex/customers.ts`)
   - Internal query to map Clerk auth ID to Dodo customer
   
5. **Dodo Configuration** (`convex/dodo.ts`)
   - DodoPayments client setup
   - Identify function using Clerk auth context
   
6. **Payment Actions** (`convex/payments.ts`)
   - createCheckout action
   - getCustomerPortal action
   
7. **Webhook Handler** (`convex/http.ts`)
   - Handle payment succeeded
   - Handle subscription events
   - Update Convex database
   
8. **Frontend Components**
   - Checkout button component
   - Subscription management UI
   - Pricing page

---

## Key Integration Points

### 1. Customer Identification

The critical connection is mapping Clerk users to Dodo customers:

```typescript
// In convex/dodo.ts identify function
const identity = await ctx.auth.getUserIdentity();
if (!identity) return null;

// identity.subject = Clerk user ID
const customer = await ctx.runQuery(internal.customers.getByAuthId, {
  authId: identity.subject,
});
```

### 2. Webhook Events to Handle

**Payment Events**:
- `payment.succeeded` - Update user subscription status
- `payment.failed` - Log failed payment, notify user
- `payment.cancelled` - Handle cancelled payments

**Subscription Events**:
- `subscription.active` - Grant access
- `subscription.cancelled` - Revoke access
- `subscription.renewed` - Update expiration
- `subscription.expired` - Handle expiration

**Dispute Events**:
- `dispute.opened` - Handle disputes
- `dispute.won/lost` - Update records

### 3. Schema Design

**customers table**:
- authId: string (Clerk user ID)
- dodoCustomerId: string (Dodo customer ID)
- email: string
- createdAt: number

**subscriptions table**:
- customerId: v.id("customers")
- subscriptionId: string (Dodo subscription ID)
- productId: string
- status: string (active, cancelled, expired)
- currentPeriodStart: number
- currentPeriodEnd: number
- createdAt: number

**payments table** (optional):
- customerId: v.id("customers")
- paymentId: string
- amount: number
- currency: string
- status: string
- createdAt: number

---

## User Decisions (Confirmed)

### 1. Payment Model
✅ **Subscriptions** (monthly/yearly recurring)

### 2. Pricing Tiers
✅ **Pro Tier** - Primary paid tier
✅ **Enterprise Tier** - Higher-tier plan

### 3. Features That Unlock
✅ **Unlimited AI messages** (currently probably limited for free users)
✅ **Unlimited projects** (currently probably limited for free users)  
✅ **Priority AI models** (better/faster AI responses)

### 4. Customer Portal
✅ **YES** - Allow users to manage subscriptions
   - Cancel subscriptions
   - Upgrade/downgrade between Pro/Enterprise
   - Update payment methods

### 5. Existing Users
⚠️ **Not specified** - Will assume handle existing users gracefully
   - Existing users = free tier by default
   - Can upgrade anytime
   - No forced migration needed

---

## Plan Requirements Summary

**Scope**: Full subscription payment system with Clerk + Convex + DodoPayments

**Core Components**:
1. Subscription schema (customers, subscriptions tables)
2. Checkout flow (Pro/Enterprise selection)
3. Webhook handling (payment/subscription events)
4. Feature gating (AI limits, project limits, model priority)
5. Customer portal integration
6. Pricing page
7. Subscription status UI

**Tech Approach**: @dodopayments/convex (Convex-first integration)

**Key Integration Points**:
- Clerk auth ID → Convex customer → Dodo customer
- Webhook events → Convex mutations → Feature access updates
- Real-time subscription status in UI

---

## Environment Variables Needed

### Convex Dashboard (backend)
```
DODO_PAYMENTS_API_KEY=dp_test_... or dp_live_...
DODO_PAYMENTS_ENVIRONMENT=test_mode or live_mode
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...
```

### Next.js .env.local (frontend - minimal)
```
# Only if needed for client-side product IDs
NEXT_PUBLIC_DODO_ENVIRONMENT=test_mode
```

---

## Files to Create/Modify

### New Files:
1. `convex/convex.config.ts` - Add DodoPayments component
2. `convex/customers.ts` - Customer lookup queries
3. `convex/dodo.ts` - DodoPayments client setup
4. `convex/payments.ts` - Payment actions
5. `convex/http.ts` - Webhook handler
6. `convex/subscriptions.ts` - Subscription management
7. `src/features/payments/components/checkout-button.tsx`
8. `src/features/payments/components/subscription-status.tsx`
9. `src/app/pricing/page.tsx` - Pricing page
10. `src/features/payments/hooks/use-subscription.ts`

### Modified Files:
1. `convex/schema.ts` - Add customers, subscriptions tables
2. `package.json` - Add @dodopayments/convex
3. `convex/_generated/*` - Regenerate after component install

---

## Implementation Order

1. Install package + setup Convex config
2. Update schema with customers/subscriptions
3. Set up environment variables
4. Create customer lookup queries
5. Configure DodoPayments client
6. Create checkout action
7. Create webhook handler
8. Build frontend components
9. Test end-to-end flow
10. Switch to live_mode

---

## Reference URLs

- DodoPayments Convex Component: https://www.convex.dev/components/dodopayments
- DodoPayments Next.js Adaptor: https://docs.dodopayments.com/developer-resources/nextjs-adaptor
- DodoPayments Docs: https://docs.dodopayments.com/
- Clerk + Convex Auth: https://docs.convex.dev/auth/clerk

---

## Risk Considerations

1. **Webhook Security**: Must verify webhook signatures
2. **Idempotency**: Handle duplicate webhook events
3. **Auth Mapping**: Clerk user ID → Dodo customer ID must be reliable
4. **Environment Variables**: Must be set in Convex dashboard, not .env
5. **Testing**: Use test_mode extensively before going live

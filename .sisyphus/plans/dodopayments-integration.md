# DodoPayments Integration Plan

## TL;DR

> **Quick Summary**: Integrate DodoPayments subscription system with Clerk authentication and Convex database. Enable Pro/Enterprise tiers with unlimited AI messages, unlimited projects, and priority AI models. Includes checkout flow, webhook handling, customer portal, and feature gating.
>
> **Deliverables**:
> - DodoPayments Convex component setup
> - Subscription schema (customers, subscriptions tables)
> - Checkout actions and webhook handlers
> - Pricing page with Pro/Enterprise tiers
> - Subscription status UI components
> - Feature gating for AI messages, projects, and model priority
> - Customer portal integration
>
> **Estimated Effort**: Medium-Large (8-10 tasks)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Schema → Dodo Config → Actions → Webhooks → Frontend

---

## Context

### Original Request
Add DodoPayments for subscription payments with Clerk + Convex integration. Research shows two approaches: `@dodopayments/convex` (Convex-first) and `@dodopayments/nextjs` (Next.js-first). Selected Convex-first approach for better stack alignment.

### Interview Summary
**Key Discussions**:
- Payment model: Subscriptions (recurring billing)
- Pricing tiers: Pro and Enterprise
- Unlock features: Unlimited AI messages, unlimited projects, priority AI models
- Customer portal: Yes (allow subscription management)
- Existing users: Handle gracefully (free tier by default)

### Research Findings
- DodoPayments Convex component: https://www.convex.dev/components/dodopayments
- Requires Convex dashboard environment variables (not .env)
- Clerk auth ID → Convex customer → Dodo customer mapping
- Webhook events: payment.succeeded, subscription.active/cancelled/renewed
- Customer portal for subscription management

---

## Work Objectives

### Core Objective
Implement complete subscription payment system allowing users to upgrade to Pro/Enterprise tiers, unlocking unlimited AI messages, unlimited projects, and priority AI model access.

### Concrete Deliverables
1. `convex/convex.config.ts` - DodoPayments component registration
2. `convex/schema.ts` - Updated with customers, subscriptions tables
3. `convex/customers.ts` - Customer lookup queries
4. `convex/dodo.ts` - DodoPayments client configuration
5. `convex/payments.ts` - Checkout and portal actions
6. `convex/http.ts` - Webhook handler
7. `convex/subscriptions.ts` - Subscription management queries/mutations
8. `src/app/pricing/page.tsx` - Pricing page component
9. `src/features/payments/components/checkout-button.tsx` - Checkout button
10. `src/features/payments/components/subscription-status.tsx` - Status display
11. `src/features/payments/hooks/use-subscription.ts` - Subscription hook
12. `src/lib/subscription-guards.ts` - Feature gating utilities

### Definition of Done
- [ ] User can view pricing page with Pro/Enterprise options
- [ ] User can initiate checkout and complete payment
- [ ] Webhook successfully updates subscription status in Convex
- [ ] Free tier users see upgrade prompts when hitting limits
- [ ] Paid users have unlimited AI messages and projects
- [ ] Paid users get priority AI models
- [ ] User can access customer portal to manage subscription
- [ ] Subscription status displays correctly in UI

### Must Have
- Subscription checkout flow (Pro/Enterprise)
- Webhook handling for payment/subscription events
- Customer portal access
- Feature gating: AI message limits
- Feature gating: Project limits
- Feature gating: Model priority
- Real-time subscription status in UI

### Must NOT Have (Guardrails)
- One-time payment products (subscriptions only)
- Complex pricing tiers beyond Pro/Enterprise
- Usage-based billing
- Team/organization billing
- Coupon/discount code UI
- Custom billing logic
- Invoice generation
- Tax calculation (handled by DodoPayments)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks MUST be verifiable WITHOUT any human action.
> ALL verification is executed by the agent using tools.

### Test Decision
- **Infrastructure exists**: YES (bun test available)
- **Automated tests**: NO - Integration testing via QA scenarios
- **Framework**: bun test (available but not required for this integration)

### Agent-Executed QA Scenarios (MANDATORY)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Frontend/UI** | Playwright | Navigate, interact, assert DOM, screenshot |
| **API/Backend** | Bash (curl/httpie) | Send requests, parse responses, assert fields |
| **Database** | Convex dashboard | Query tables, verify data |

**Each Scenario Format:**

```
Scenario: [Descriptive name]
  Tool: [Playwright / Bash]
  Preconditions: [What must be true before]
  Steps:
    1. [Exact action with selectors/data]
    2. [Next action]
    3. [Assertion with expected value]
  Expected Result: [Concrete outcome]
  Evidence: [Screenshot path / output]
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Sequential):
├── Task 1: Install DodoPayments package
├── Task 2: Update Convex schema
└── Task 3: Configure DodoPayments component

Wave 2 (Backend - Sequential):
├── Task 4: Create customer lookup queries
├── Task 5: Configure DodoPayments client
├── Task 6: Create payment actions
└── Task 7: Create webhook handler

Wave 3 (Frontend - Parallel):
├── Task 8: Create pricing page
├── Task 9: Create subscription UI components
├── Task 10: Implement feature gating
└── Task 11: Add subscription status to navbar

Wave 4 (Integration):
└── Task 12: End-to-end testing & verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None |
| 2 | 1 | 4 | None |
| 3 | 1, 2 | 4, 5 | None |
| 4 | 3 | 5 | None |
| 5 | 3, 4 | 6, 7 | None |
| 6 | 5 | 8, 9 | 7 |
| 7 | 5 | 12 | 6 |
| 8 | 6 | 12 | 9, 10, 11 |
| 9 | 6 | 12 | 8, 10, 11 |
| 10 | 6 | 12 | 8, 9, 11 |
| 11 | 6 | 12 | 8, 9, 10 |
| 12 | 7, 8, 9, 10, 11 | None | None |

---

## TODOs

- [ ] 1. Install @dodopayments/convex package

  **What to do**:
  - Install package: `bun add @dodopayments/convex`
  - Verify installation in package.json
  - Run `bun install` to update lockfile

  **Must NOT do**:
  - Install @dodopayments/nextjs (wrong package)
  - Modify any code yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Skills Evaluated but Omitted**: N/A (simple package install)

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete before Wave 1)
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:
  - Package: https://www.npmjs.com/package/@dodopayments/convex
  - Docs: https://docs.dodopayments.com/developer-resources/convex-component

  **Acceptance Criteria**:
  - [ ] `bun add @dodopayments/convex` completes successfully
  - [ ] package.json contains `@dodopayments/convex` dependency
  - [ ] bun.lockb updated

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Package installed correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. cat package.json | grep "@dodopayments/convex"
      2. Assert: Output contains "@dodopayments/convex"
    Expected Result: Package is in dependencies
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `chore(deps): add @dodopayments/convex package`
  - Files: `package.json`, `bun.lockb`

---

- [ ] 2. Update Convex schema with customers and subscriptions tables

  **What to do**:
  - Add `customers` table with fields: authId (string, indexed), dodoCustomerId (string), email (string), name (string), createdAt (number)
  - Add `subscriptions` table with fields: customerId (v.id("customers")), subscriptionId (string), productId (string), status (string), currentPeriodStart (number), currentPeriodEnd (number), createdAt (number)
  - Add index on customers: "by_auth_id" on ["authId"]
  - Add index on subscriptions: "by_customer" on ["customerId"]
  - Run `npx convex dev` to regenerate types

  **Must NOT do**:
  - Remove existing tables (projects, files, conversations, messages)
  - Change existing field types
  - Add complex relationships beyond simple indexes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:
  - Current schema: `convex/schema.ts` (lines 1-68)
  - Pattern: Follow existing table definitions
  - Convex docs: https://docs.convex.dev/database/schemas

  **Acceptance Criteria**:
  - [ ] customers table defined with all required fields
  - [ ] subscriptions table defined with all required fields
  - [ ] Index "by_auth_id" on customers.authId
  - [ ] Index "by_customer" on subscriptions.customerId
  - [ ] `npx convex dev` regenerates types without errors
  - [ ] `convex/_generated/dataModel.d.ts` updated

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Schema compiles and types generated
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Run: npx convex dev
      2. Wait for: "Generated" message
      3. Assert: Exit code 0
      4. Check: convex/_generated/dataModel.d.ts contains "customers" and "subscriptions"
    Expected Result: Schema valid, types regenerated
    Evidence: Terminal output, generated file timestamps
  ```

  **Commit**: YES
  - Message: `feat(db): add customers and subscriptions tables`
  - Files: `convex/schema.ts`, `convex/_generated/*`

---

- [ ] 3. Configure DodoPayments Convex component

  **What to do**:
  - Create `convex/convex.config.ts` (if not exists) or update existing
  - Import dodopayments from `@dodopayments/convex/convex.config`
  - Add `app.use(dodopayments)` to register component
  - Run `npx convex dev` to regenerate component types

  **Must NOT do**:
  - Configure API keys here (done in dodo.ts)
  - Skip type regeneration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 2)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2

  **References**:
  - Docs: https://www.convex.dev/components/dodopayments
  - Example: See "1. Add Component to Convex Config" in docs

  **Acceptance Criteria**:
  - [ ] `convex/convex.config.ts` created/updated
  - [ ] Component imported and registered
  - [ ] `npx convex dev` regenerates types
  - [ ] `convex/_generated/api.d.ts` includes dodopayments component

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Component registered successfully
    Tool: Bash
    Preconditions: Task 2 complete
    Steps:
      1. cat convex/convex.config.ts
      2. Assert: Contains "@dodopayments/convex/convex.config"
      3. Assert: Contains "app.use(dodopayments)"
      4. Run: npx convex dev
      5. Assert: No errors
    Expected Result: Component registered, types generated
    Evidence: Config file contents, terminal output
  ```

  **Commit**: YES
  - Message: `feat(payments): register DodoPayments component`
  - Files: `convex/convex.config.ts`, `convex/_generated/*`

---

- [ ] 4. Create customer lookup queries

  **What to do**:
  - Create `convex/customers.ts`
  - Add `getByAuthId` internalQuery that takes authId and returns customer
  - Add `getOrCreate` action that creates customer if not exists
  - Add `createCustomer` internalMutation

  **Must NOT do**:
  - Call DodoPayments API directly here
  - Handle payments (just customer records)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 3)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:
  - Pattern: See `convex/projects.ts`, `convex/files.ts`
  - Convex internal queries: https://docs.convex.dev/functions/query-functions

  **Acceptance Criteria**:
  - [ ] `convex/customers.ts` created
  - [ ] `getByAuthId` internalQuery implemented
  - [ ] `getOrCreate` action implemented
  - [ ] `createCustomer` internalMutation implemented
  - [ ] All functions exported

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Customer queries are valid
    Tool: Bash
    Preconditions: Task 3 complete
    Steps:
      1. bun run convex dev
      2. Wait for compilation
      3. Assert: No TypeScript errors in convex/customers.ts
    Expected Result: Valid Convex functions
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(payments): add customer lookup queries`
  - Files: `convex/customers.ts`

---

- [ ] 5. Configure DodoPayments client

  **What to do**:
  - Create `convex/dodo.ts`
  - Import DodoPayments, DodoPaymentsClientConfig from `@dodopayments/convex`
  - Configure with:
    - identify function: Get Clerk auth identity, lookup customer by authId
    - apiKey: process.env.DODO_PAYMENTS_API_KEY
    - environment: process.env.DODO_PAYMENTS_ENVIRONMENT
  - Export checkout and customerPortal from dodo.api()

  **Must NOT do**:
  - Hardcode API keys
  - Skip error handling in identify function
  - Forget to handle null identity (not logged in)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 3, 4)
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Tasks 3, 4

  **References**:
  - Docs: https://www.convex.dev/components/dodopayments (Step 4)
  - Clerk auth in Convex: https://docs.convex.dev/auth/clerk
  - Current auth: `src/components/providers.tsx` (ClerkProvider + ConvexProviderWithClerk)

  **Acceptance Criteria**:
  - [ ] `convex/dodo.ts` created
  - [ ] DodoPayments client configured with identify function
  - [ ] identify uses ctx.auth.getUserIdentity()
  - [ ] identify calls internal.customers.getByAuthId
  - [ ] checkout and customerPortal exported
  - [ ] Environment variables referenced correctly

  **Agent-Executed QA Scenario**:
  ```
  Scenario: DodoPayments client configured correctly
    Tool: Bash
    Preconditions: Task 4 complete
    Steps:
      1. cat convex/dodo.ts
      2. Assert: Contains "DodoPayments" import
      3. Assert: Contains "ctx.auth.getUserIdentity"
      4. Assert: Contains "internal.customers.getByAuthId"
      5. Assert: Contains "checkout" and "customerPortal" exports
      6. Run: npx convex dev
      7. Assert: No errors
    Expected Result: Valid configuration
    Evidence: File contents, terminal output
  ```

  **Commit**: YES
  - Message: `feat(payments): configure DodoPayments client`
  - Files: `convex/dodo.ts`

---

- [ ] 6. Create payment actions (checkout and portal)

  **What to do**:
  - Create `convex/payments.ts`
  - Add `createCheckout` action:
    - Args: productId (string), returnUrl (optional string)
    - Calls checkout from dodo.ts with product_cart
    - Returns checkout_url
  - Add `getCustomerPortal` action:
    - Calls customerPortal from dodo.ts
    - Returns portal_url
  - Add `getCurrentSubscription` query:
    - Gets current user's subscription status

  **Must NOT do**:
  - Handle raw DodoPayments API calls
  - Skip authentication checks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 9, 10, 11
  - **Blocked By**: Task 5

  **References**:
  - Current actions pattern: `convex/projects.ts`, `convex/system.ts`
  - DodoPayments checkout: https://docs.dodopayments.com/developer-resources/checkout-session

  **Acceptance Criteria**:
  - [ ] `convex/payments.ts` created
  - [ ] `createCheckout` action implemented
  - [ ] `getCustomerPortal` action implemented
  - [ ] `getCurrentSubscription` query implemented
  - [ ] All use proper Convex argument validation (v.string(), etc.)

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Payment actions are valid
    Tool: Bash
    Preconditions: Task 5 complete
    Steps:
      1. cat convex/payments.ts
      2. Assert: Contains "createCheckout" action
      3. Assert: Contains "getCustomerPortal" action
      4. Run: npx convex dev
      5. Assert: No errors
    Expected Result: Valid payment actions
    Evidence: File contents, terminal output
  ```

  **Commit**: YES
  - Message: `feat(payments): add checkout and portal actions`
  - Files: `convex/payments.ts`

---

- [ ] 7. Create webhook handler

  **What to do**:
  - Create `convex/http.ts`
  - Import createDodoWebhookHandler from `@dodopayments/convex`
  - Import httpRouter from `convex/server`
  - Create handler for `/dodopayments-webhook` path
  - Implement event handlers:
    - onPaymentSucceeded: Create payment record
    - onSubscriptionActive: Create/update subscription record
    - onSubscriptionCancelled: Update subscription status
    - onSubscriptionRenewed: Update period dates
  - Create internal mutations:
    - `webhooks/createPayment`
    - `webhooks/createSubscription`
    - `webhooks/updateSubscription`

  **Must NOT do**:
  - Skip webhook signature verification (handled by library)
  - Forget idempotency (check if record exists first)
  - Log sensitive data

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6, in Wave 2)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 12
  - **Blocked By**: Task 5

  **References**:
  - Docs: https://www.convex.dev/components/dodopayments (Step 7)
  - Webhook events: https://docs.dodopayments.com/developer-resources/webhooks
  - Convex http actions: https://docs.convex.dev/functions/http-actions

  **Acceptance Criteria**:
  - [ ] `convex/http.ts` created
  - [ ] Webhook route at `/dodopayments-webhook`
  - [ ] onPaymentSucceeded handler implemented
  - [ ] onSubscriptionActive handler implemented
  - [ ] onSubscriptionCancelled handler implemented
  - [ ] onSubscriptionRenewed handler implemented
  - [ ] Internal mutations for webhook data persistence
  - [ ] Returns proper HTTP status codes

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Webhook handler is valid
    Tool: Bash
    Preconditions: Task 5 complete
    Steps:
      1. cat convex/http.ts
      2. Assert: Contains "createDodoWebhookHandler"
      3. Assert: Contains "/dodopayments-webhook"
      4. Run: npx convex dev
      5. Assert: No errors
    Expected Result: Valid webhook handler
    Evidence: File contents, terminal output
  ```

  **Commit**: YES
  - Message: `feat(payments): add DodoPayments webhook handler`
  - Files: `convex/http.ts`

---

- [ ] 8. Create pricing page

  **What to do**:
  - Create `src/app/pricing/page.tsx`
  - Design pricing cards for 3 tiers:
    - Free: Current limits, no price
    - Pro: Unlimited AI messages, unlimited projects, priority models - $X/month
    - Enterprise: Everything in Pro + ??? - $Y/month
  - Add CTA buttons that call createCheckout action
  - Show loading states during checkout
  - Redirect to DodoPayments checkout_url on click

  **Must NOT do**:
  - Hardcode prices (use constants/config)
  - Skip authentication check before checkout

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - **Reason**: UI design and styling

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 6

  **References**:
  - Current pages: `src/app/projects/[projectId]/page.tsx`
  - Current components: `src/components/ui/` (shadcn/ui)
  - Pattern: Use Card, Button components from shadcn

  **Acceptance Criteria**:
  - [ ] `src/app/pricing/page.tsx` created
  - [ ] 3 pricing tiers displayed (Free, Pro, Enterprise)
  - [ ] Features listed for each tier
  - [ ] CTA buttons functional
  - [ ] Checkout flow working (redirects to DodoPayments)
  - [ ] Responsive design

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Pricing page loads and displays tiers
    Tool: Playwright
    Preconditions: Tasks 6 complete, dev server running
    Steps:
      1. Navigate to: http://localhost:3000/pricing
      2. Wait for: page load
      3. Assert: Contains "Free", "Pro", "Enterprise" text
      4. Assert: Contains pricing amounts
      5. Assert: CTA buttons visible
      6. Screenshot: .sisyphus/evidence/task-8-pricing-page.png
    Expected Result: Pricing page displays all tiers
    Evidence: Screenshot
  ```

  **Commit**: YES
  - Message: `feat(payments): add pricing page`
  - Files: `src/app/pricing/page.tsx`

---

- [ ] 9. Create subscription UI components

  **What to do**:
  - Create `src/features/payments/components/checkout-button.tsx`:
    - Accepts productId prop
    - Calls createCheckout action
    - Handles loading state
    - Redirects to checkout_url
  - Create `src/features/payments/components/subscription-status.tsx`:
    - Displays current subscription tier
    - Shows expiration date
    - Shows "Manage Subscription" button linking to customer portal
  - Create `src/features/payments/components/upgrade-banner.tsx`:
    - Shows when user hits limits
    - Links to pricing page
  - Create `src/features/payments/hooks/use-subscription.ts`:
    - Hook to get current subscription status
    - Uses useQuery from convex/react

  **Must NOT do**:
  - Mix payment logic with UI (use hooks/actions)
  - Skip error handling

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 10, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 6

  **References**:
  - Current hooks pattern: `src/features/projects/hooks/use-projects.ts`
  - Current components: `src/features/projects/components/`
  - Convex hooks: https://docs.convex.dev/react/react-hooks

  **Acceptance Criteria**:
  - [ ] `checkout-button.tsx` created and functional
  - [ ] `subscription-status.tsx` created and functional
  - [ ] `upgrade-banner.tsx` created
  - [ ] `use-subscription.ts` hook created
  - [ ] All components use proper TypeScript types
  - [ ] Components exported from index file

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Subscription components render correctly
    Tool: Playwright
    Preconditions: Task 6 complete, dev server running
    Steps:
      1. Import components in test page
      2. Navigate to test page
      3. Assert: Checkout button renders
      4. Assert: Subscription status component renders
      5. Screenshot: .sisyphus/evidence/task-9-components.png
    Expected Result: Components render without errors
    Evidence: Screenshot
  ```

  **Commit**: YES
  - Message: `feat(payments): add subscription UI components`
  - Files: `src/features/payments/components/*`, `src/features/payments/hooks/*`

---

- [ ] 10. Implement feature gating

  **What to do**:
  - Create `src/lib/subscription-guards.ts`:
    - `canSendAIMessage(userId)` - Check if user can send AI message
    - `canCreateProject(userId)` - Check if user can create project
    - `getAIModelPriority(userId)` - Get AI model priority (standard/priority)
    - `getSubscriptionTier(userId)` - Get current tier (free/pro/enterprise)
  - Add limits constants:
    - FREE_AI_MESSAGE_LIMIT = 50
    - FREE_PROJECT_LIMIT = 3
  - Create `src/lib/subscription-context.tsx`:
    - React context for subscription state
    - Provider component
    - Hook to use subscription context
  - Add checks in existing components:
    - Message sending (conversations)
    - Project creation
    - AI model selection

  **Must NOT do**:
  - Block paid users (unlimited)
  - Hardcode limits in multiple places

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 6

  **References**:
  - Current convex queries: `src/features/conversations/hooks/use-conversations.ts`
  - Message sending: `src/features/conversations/components/conversation-sidebar.tsx`
  - Project creation: `src/features/projects/components/new-project-dialog.tsx`

  **Acceptance Criteria**:
  - [ ] `subscription-guards.ts` created with all guard functions
  - [ ] `subscription-context.tsx` created
  - [ ] AI message limits enforced (free users limited)
  - [ ] Project limits enforced (free users limited)
  - [ ] Priority models used for paid users
  - [ ] Upgrade prompts shown when limits hit

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Feature gating works correctly
    Tool: Playwright
    Preconditions: Task 6 complete, dev server running
    Steps:
      1. Login as free user
      2. Try to create 4th project
      3. Assert: Upgrade banner/prompt shown
      4. Check AI model selection
      5. Assert: Free tier uses standard models
    Expected Result: Limits enforced for free users
    Evidence: Screenshots, console logs
  ```

  **Commit**: YES
  - Message: `feat(payments): add subscription feature gating`
  - Files: `src/lib/subscription-guards.ts`, `src/lib/subscription-context.tsx`

---

- [ ] 11. Add subscription status to navbar

  **What to do**:
  - Modify `src/features/projects/components/navbar.tsx`:
    - Add SubscriptionStatus component
    - Show current tier badge
    - Add link to pricing page
    - Add "Manage Subscription" button for paid users
  - Ensure navbar updates when subscription changes

  **Must NOT do**:
  - Block UI while loading subscription
  - Show sensitive payment info

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 6

  **References**:
  - Current navbar: `src/features/projects/components/navbar.tsx`
  - Current user button: Uses Clerk UserButton

  **Acceptance Criteria**:
  - [ ] Navbar shows subscription status
  - [ ] Tier badge visible (Free/Pro/Enterprise)
  - [ ] Manage subscription button for paid users
  - [ ] Upgrade button for free users
  - [ ] Responsive design maintained

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Navbar shows subscription status
    Tool: Playwright
    Preconditions: Task 6 complete, dev server running
    Steps:
      1. Navigate to any project page
      2. Wait for navbar to load
      3. Assert: Subscription tier badge visible
      4. Assert: Manage subscription or upgrade button visible
      5. Screenshot: .sisyphus/evidence/task-11-navbar.png
    Expected Result: Navbar displays subscription info
    Evidence: Screenshot
  ```

  **Commit**: YES
  - Message: `feat(payments): add subscription status to navbar`
  - Files: `src/features/projects/components/navbar.tsx`

---

- [ ] 12. End-to-end testing and verification

  **What to do**:
  - Test complete flow:
    1. Free user hits AI message limit
    2. User clicks upgrade, goes to pricing page
    3. User selects Pro tier, redirected to DodoPayments
    4. Complete test payment (test_mode)
    5. Webhook updates subscription in Convex
    6. User redirected back, sees Pro status
    7. User can now send unlimited messages
  - Test customer portal access
  - Test subscription cancellation
  - Verify webhook signature verification
  - Test edge cases:
    - Duplicate webhook events
    - Network failures
    - Invalid payloads

  **Must NOT do**:
  - Skip webhook testing
  - Use live_mode for testing

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (final integration test)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 8, 9, 10, 11

  **References**:
  - DodoPayments test mode: https://docs.dodopayments.com/developer-resources/test-mode
  - Webhook testing: https://docs.dodopayments.com/developer-resources/webhooks

  **Acceptance Criteria**:
  - [ ] Free user sees upgrade prompt at limit
  - [ ] Pricing page loads correctly
  - [ ] Checkout redirects to DodoPayments
  - [ ] Webhook updates subscription status
  - [ ] Paid user sees Pro/Enterprise status
  - [ ] Paid user has unlimited AI messages
  - [ ] Paid user has unlimited projects
  - [ ] Paid user gets priority AI models
  - [ ] Customer portal accessible
  - [ ] Subscription cancellation works

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Complete subscription flow
    Tool: Playwright + Bash
    Preconditions: All tasks complete, DODO_PAYMENTS_ENVIRONMENT=test_mode
    Steps:
      1. Create test user in Clerk
      2. Login as test user
      3. Hit AI message limit (send 50 messages)
      4. Assert: Upgrade banner shown
      5. Click upgrade, navigate to /pricing
      6. Click Pro tier checkout button
      7. Assert: Redirected to DodoPayments checkout
      8. Complete test payment
      9. Wait for webhook (simulate or real)
      10. Navigate back to app
      11. Assert: Subscription status shows "Pro"
      12. Send 51st message
      13. Assert: Message sent successfully
      14. Screenshot: .sisyphus/evidence/task-12-complete-flow.png
    Expected Result: Full subscription flow works
    Evidence: Screenshots, Convex dashboard queries

  Scenario: Customer portal access
    Tool: Playwright
    Preconditions: User has active subscription
    Steps:
      1. Login as paid user
      2. Click "Manage Subscription"
      3. Assert: Redirected to DodoPayments customer portal
      4. Screenshot: .sisyphus/evidence/task-12-portal.png
    Expected Result: Customer portal accessible
    Evidence: Screenshot

  Scenario: Webhook handling
    Tool: Bash (curl)
    Preconditions: Webhook endpoint deployed
    Steps:
      1. Create test webhook payload
      2. POST to /dodopayments-webhook
      3. Assert: Returns 200
      4. Query Convex: Check subscription updated
      5. Assert: Subscription record created
    Expected Result: Webhook processed correctly
    Evidence: HTTP response, Convex query results
  ```

  **Commit**: NO (testing only, no code changes)

---

## Environment Variables Setup

### Convex Dashboard (Critical - Set BEFORE deployment)

Visit https://dashboard.convex.dev or run `npx convex dashboard`

**Required Variables:**
```
DODO_PAYMENTS_API_KEY=dp_test_... (or dp_live_... for production)
DODO_PAYMENTS_ENVIRONMENT=test_mode (or live_mode for production)
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...
```

### Next.js .env.local (Minimal)

```
# Only if client-side needs to know environment
NEXT_PUBLIC_DODO_ENVIRONMENT=test_mode
```

### Clerk Dashboard

1. Create JWT template for Convex (if not exists)
2. Note: Already configured in `convex/auth.config.ts`

### DodoPayments Dashboard

1. Create account at https://dodopayments.com
2. Create two products:
   - Pro Tier (subscription)
   - Enterprise Tier (subscription)
3. Get API keys from dashboard
4. Configure webhook endpoint: `https://<your-convex-url>/dodopayments-webhook`
5. Subscribe to events:
   - payment.succeeded
   - subscription.active
   - subscription.cancelled
   - subscription.renewed

---

## Success Criteria

### Verification Commands

```bash
# 1. Verify package installed
$ cat package.json | grep "@dodopayments/convex"
# Expected: Shows package with version

# 2. Verify schema updated
$ cat convex/schema.ts | grep -A 5 "customers"
# Expected: Shows customers table definition

# 3. Verify Convex dev runs
$ npx convex dev
# Expected: Compiles without errors

# 4. Verify components exist
$ ls src/features/payments/components/
# Expected: checkout-button.tsx, subscription-status.tsx, etc.

# 5. Verify pricing page
$ ls src/app/pricing/page.tsx
# Expected: File exists

# 6. Build succeeds
$ bun run build
# Expected: Build completes without errors
```

### Final Checklist

- [ ] All "Must Have" present
  - [ ] Subscription checkout flow (Pro/Enterprise)
  - [ ] Webhook handling for payment/subscription events
  - [ ] Customer portal access
  - [ ] Feature gating: AI message limits
  - [ ] Feature gating: Project limits
  - [ ] Feature gating: Model priority
  - [ ] Real-time subscription status in UI
- [ ] All "Must NOT Have" absent
  - [ ] No one-time payment products
  - [ ] No complex tiers beyond Pro/Enterprise
  - [ ] No usage-based billing
- [ ] Environment variables set in Convex dashboard
- [ ] DodoPayments products created
- [ ] Webhook endpoint configured
- [ ] Test payments succeed in test_mode
- [ ] Build passes without errors

---

## Notes

### Architecture Decisions

1. **Convex-first approach**: Using `@dodopayments/convex` instead of `@dodopayments/nextjs` because:
   - Better integration with existing Clerk + Convex auth
   - Webhook handling in Convex (not Next.js API routes)
   - All payment state in Convex database
   - Type safety with Convex generated types

2. **Customer mapping**: Clerk auth ID (subject) → Convex customer → Dodo customer
   - Allows looking up Dodo customer from Clerk session
   - Maintains referential integrity in Convex

3. **Feature gating**: Guards in lib/ check subscription tier before allowing actions
   - Free: 50 AI messages, 3 projects, standard models
   - Pro/Enterprise: Unlimited, priority models

### Testing Strategy

- **Phase 1**: Use DodoPayments test_mode
- **Phase 2**: Create test products with $0.01 price
- **Phase 3**: Test with real card in live_mode
- **Webhook testing**: Use DodoPayments dashboard to send test events

### Post-Deployment

1. Monitor webhook delivery in DodoPayments dashboard
2. Check Convex logs for webhook processing errors
3. Verify subscription status updates correctly
4. Monitor payment success rates

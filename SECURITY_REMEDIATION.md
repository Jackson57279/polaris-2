# Security Vulnerability Remediation Report

**Date:** 2026-04-17  
**Target:** luminaweb.app  
**Scan Source:** Strix Security Scan

---

## Summary

| Vulnerability | Severity | Status | Notes |
|---------------|----------|--------|-------|
| SSRF in URL fetching | **CRITICAL** | ✅ **FIXED** | `fetchSkillFromUrl` now validates URLs |
| Subdomain Takeover | **CRITICAL** | ⚠️ DNS Action Required | See remediation steps below |
| JWT Algorithm Confusion | **CRITICAL** | ✅ **FALSE POSITIVE** | Clerk handles JWT securely |
| IDOR in User API | **CRITICAL** | ✅ **FALSE POSITIVE** | No vulnerable endpoint exists |
| Blog Info Disclosure | **HIGH** | ✅ **ACCEPTABLE RISK** | Public blog content is intentional |

---

## 1. SSRF Vulnerability - FIXED ✅

### Location
`src/features/conversations/inngest/constants.ts` - `fetchSkillFromUrl()` function

### Issue
The function fetched URLs from user-controlled input without validation, allowing SSRF attacks against internal networks.

### Fix Applied
Added comprehensive URL validation:
- Only allows `raw.githubusercontent.com` domain
- Blocks private IP ranges (10.x, 192.168.x, 172.16.x, 127.x)
- Blocks cloud metadata endpoint (169.254.169.254)
- Requires HTTPS protocol
- Blocks URLs with embedded credentials

### Code Changes
```typescript
// Added SSRF protection
const ALLOWED_SKILL_DOMAIN = "raw.githubusercontent.com";

function isValidSkillUrl(url: string): boolean {
  // Validates protocol, domain, and blocks internal IPs
}

async function fetchSkillFromUrl(url: string, ...) {
  // SSRF protection: validate URL before fetching
  if (!isValidSkillUrl(url)) {
    console.error(`[SSRF Blocked] Invalid skill URL: ${url}`);
    return cached?.content ?? null;
  }
  // ... rest of function
}
```

---

## 2. Subdomain Takeover - WILDCARD DNS Issue ⚠️

### Root Cause
Your DNS has a **wildcard record** (`*`) pointing to Vercel:
```
*    ALIAS    cname.vercel-dns-017.com.
```

This means **ALL** subdomains (api.luminaweb.app, admin.luminaweb.app, etc.) resolve to Vercel. When someone visits a subdomain without a configured Vercel project, they see:
> "The deployment could not be found on Vercel"

An attacker could create a Vercel project named "api" and claim `api.luminaweb.app` to serve malicious content.

### Remediation Steps

**Option A: Remove Wildcard Record (Recommended)**
1. Delete the `*` wildcard ALIAS record from your DNS
2. Only create specific subdomains you actually use (like `www`)
3. This is the most secure approach

**Option B: Configure Vercel Catch-All**
1. In your Vercel project settings, add a catch-all domain redirect
2. Redirect all unknown subdomains to your main domain
3. Or return a 404 page for unconfigured subdomains

**Option C: Add Vercel Projects for Subdomains**
If you need specific subdomains:
1. Create Vercel projects for each subdomain you want to use
2. Configure the custom domains in Vercel
3. Ensure unused subdomains redirect or 404

### Verification
After remediation:
```bash
# Should return NXDOMAIN or valid content
dig api.luminaweb.app
dig admin.luminaweb.app

# Should NOT show:
# "The deployment could not be found on Vercel"
```

---

## 3. JWT Algorithm Confusion - FALSE POSITIVE ✅

### Assessment
The application uses **Clerk** for authentication, which properly handles JWT security:

- Uses RS256 (asymmetric) algorithm by default
- Properly validates JWT signatures
- Validates issuer, audience, and expiration claims
- No custom JWT implementation that could be vulnerable

### Configuration
```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

### Conclusion
No action required. Clerk's JWT implementation is secure.

---

## 4. IDOR in User API - FALSE POSITIVE ✅

### Assessment
The scan reported an IDOR vulnerability at `/api/users/{id}`. This endpoint **does not exist** in the application.

### Authorization Pattern Used
All data access in the Convex backend properly validates ownership:

```typescript
// Example from convex/projects.ts
export const getById = query({
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    
    // Proper ownership check
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }
    return project;
  },
});
```

### Conclusion
No IDOR vulnerability exists. All data access is properly authorized.

---

## 5. Blog Information Disclosure - ACCEPTABLE RISK ✅

### Assessment
The scan reported "35KB of content (1675 words)" at `/blog` as information disclosure.

### Analysis
This is **expected behavior** for a public blog:
- Blog content is static, publicly accessible marketing content
- No sensitive data (credentials, internal IPs, API keys) is exposed
- Content is intended for public consumption

### Current Implementation
```typescript
// src/lib/blog-posts.ts - Static blog content
export const blogPosts: BlogPost[] = [
  {
    slug: "what-is-a-cloud-ide",
    title: "What Is a Cloud IDE?...",
    // Public marketing content
  }
];
```

### Conclusion
No action required. Public blog content is not a vulnerability.

---

## Additional Security Recommendations

### 1. Security Headers
Consider adding these headers via `next.config.ts`:
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

### 2. Content Security Policy
Implement a strict CSP to mitigate XSS risks.

### 3. Rate Limiting
Add rate limiting to API endpoints to prevent brute force attacks.

### 4. Dependency Updates
Regularly run `npm audit` or `bun audit` to check for vulnerable dependencies.

---

## Verification Commands

```bash
# Test SSRF fix - should return null/not fetch
# (Code now blocks internal IPs)

# Check subdomain status
dig api.luminaweb.app
dig admin.luminaweb.app

# Test Clerk JWT
curl -H "Authorization: Bearer INVALID_TOKEN" \
  https://luminaweb.app/api/messages
# Should return 401
```

---

## Contacts

For security issues, contact: security@luminaweb.app

---

**Report Generated:** 2026-04-17  
**Next Review:** 2026-05-17

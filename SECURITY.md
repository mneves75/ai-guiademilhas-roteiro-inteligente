# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **marcusneves2004@yahoo.com.br**

In production deployments, set `SECURITY_CONTACT_EMAIL` (or `SECURITY_CONTACT_URL`) so
`/.well-known/security.txt` publishes a real contact channel (RFC 9116).

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Assessment**: We'll assess the severity and impact
3. **Fix**: We'll work on a fix for confirmed vulnerabilities
4. **Disclosure**: We'll coordinate disclosure timing with you

### Security Best Practices for Users

When using this boilerplate:

1. **Environment Variables**
   - Never commit `.env.local` or secrets
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Dashboard (anon key is safe for client exposure).
   - Rotate API keys periodically

2. **Dependencies**
   - Run `pnpm audit` regularly
   - Keep dependencies updated
   - Review dependency changes in PRs

3. **Authentication**
   - Enable MFA for admin accounts
   - Use secure session settings
   - Implement rate limiting (use a shared store for hard guarantees in serverless)

4. **Database**
   - Use parameterized queries (Drizzle handles this)
   - Apply principle of least privilege
   - Encrypt sensitive data at rest

5. **Deployment**
   - Enable HTTPS everywhere
   - Set secure HTTP headers
   - Use Vercel's security features

## Security Features

This boilerplate includes:

- [x] TypeScript strict mode (prevents common bugs)
- [x] ESLint security rules
- [x] Pre-commit hooks (prevents accidental secret commits)
- [x] Dependency auditing in CI
- [x] CSRF mitigation for state-changing API routes (Origin + Fetch Metadata checks)
- [x] Rate limiting for auth endpoints (edge-memory by default; optional Upstash Redis REST for hard multi-instance guarantees)
- [x] Input validation for API routes (strict runtime checks)
- [x] Secure headers baseline via `next.config.ts` (works on Vercel + self-host)
- [x] `/.well-known/security.txt` (RFC 9116) endpoint for vulnerability disclosure metadata (configure via `SECURITY_CONTACT_EMAIL`, etc.)

## Acknowledgments

We appreciate security researchers who help keep this project safe. Contributors who report valid vulnerabilities will be acknowledged here (with permission).

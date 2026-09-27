# Changelog

All notable changes to the **Dog Food Hackathon Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-27 (T1 & Core Architecture Release)

### Added
- **Infrastructure**:
  - Offline-first SQLite database schema defined in `prisma/schema.prisma` covering Users, Hackathons, Tracks, Prizes, Teams, Projects, Rubrics, Criteria, Evaluations, Votes, and AuditLogs.
  - Multi-stage Dockerfile with Alpine Linux optimized for Next.js standalone execution.
  - Hardened `docker-compose.yml` with persistent volume binding for `/app/prisma`.
  - Self-healing database initialization script `start.sh` applying automatic non-destructive schema pushes.
- **Frontend & 3D Visual Experience**:
  - Pure Vanilla CSS design engine in `src/app/globals.css` with dark mode glassmorphism and custom gradients.
  - Interactive 3D WebGL background using Three.js, `@react-three/fiber`, and `@react-three/drei` with procedural starfields and animated glowing distortion spheres.
  - Dynamic responsive landing page with micro-interactions via Framer Motion.
- **Authentication & RBAC (Tier 1)**:
  - Secure password hashing using `bcryptjs` with 10 salt rounds.
  - Stateless HMAC-SHA256 JWT session engine with `httpOnly`, `sameSite=lax` cookies in `src/lib/auth.ts`.
  - Registration endpoint `/api/auth/register` supporting roles (`PARTICIPANT`, `JUDGE`, `ORGANIZER`, `ADMIN`).
  - Login endpoint `/api/auth/login` and logout endpoint `/api/auth/logout`.
  - Sleek login view `/login` and registration view `/register` with role selectors.
  - Role-adaptive dashboard `/dashboard` dynamically rendering controls based on session permissions.

### Fixed
- Fixed corrupted `package-lock.json` peer dependency conflicts during automated package resolution.
- Added explicit `prisma` build tool to devDependencies to ensure offline CLI availability.
- Resolved Next.js hydration conflict with Three.js canvas using dynamic SSR disabling.

---

## [0.2.0] - 2026-09-27 (Scaffolding & Architecture Blueprint)

### Added
- Initialized Next.js 15 App router template with TypeScript support.
- Configured `next.config.ts` for standalone container distribution.
- Created root `README.md` defining hackathon tier ladder and offline execution guide.

---

## [0.1.0] - 2026-09-27 (Project Inception)
- Repository setup for Dog Food Hackathon 72-hour challenge.
- Requirements specification breakdown across Tiers T1 to T4.

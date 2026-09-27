# Changelog

All notable changes to the **Dog Food Hackathon Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-09-27 (Session Sign-Out Routing & Credential Reference)

### Fixed
- **Authentication & Sign-Out UX Flow**:
  - Updated `/api/auth/logout` to support browser form submissions and GET requests with an HTTP 303 See Other redirect to `/login`.
  - Preserved programmatic JSON responses (`{"success": true}`) for REST API / headless clients.
  - Eliminated raw JSON response rendering when signing out from the dashboard navigation bar.

### Added
- **Authentication & Role Documentation**:
  - Added comprehensive Seeded Credentials reference table (Organizer, Judges, Participants, master password `Dogfood2026!`, and automated test probe session cookies) to `README.md`.
  - Added detailed Role-Based Feature Matrix to `README.md` defining capabilities and constraints across Organizer, Judge, Participant, and Public roles.
  - Synchronized `TechSpec.md`, `Appflow.md`, and status trackers with current sign-out mechanics.

---

## [1.2.0] - 2026-09-27 (Tiers 2, 3, 4 Completion & Canonical Repo Layout)

### Added
- **Tier 2 Judging Subsystem**:
  - Rubric builder at `/dashboard/rubrics` and `/api/rubrics` enforcing strict 100% criteria weight sum ($\sum w_i = 1.0 \pm 0.001$).
  - Algorithmic round-robin judge assignment with Conflict of Interest (COI) isolation (`/api/judges/assign`).
  - Judge evaluation workspace with criteria inputs and progress tracking (`/dashboard/evaluations`).
  - Backend-enforced role isolation returning HTTP 403 on peer judge score access and participant requests.
  - Z-Score statistical variance normalization with dampening variance floor (`/api/evaluations/normalize`).
  - Streaming RFC-compliant CSV evaluation export (`/api/export.csv`).
- **Tier 3 Public Community Voting & Anti-Abuse**:
  - Community voting endpoint (`POST /api/votes`) with deterministic SHA-256 fingerprinting (`IP + User-Agent + Event Salt`).
  - Sliding-window IP rate limiter restricting clients to max 5 votes per hour (HTTP 429).
  - 1-vote-per-project per voter hash invariant (HTTP 409).
  - Results masking during active voting windows (`masked: true`).
  - Organizer voting control dashboard at `/dashboard/voting` and toggle route `/api/events/voting`.
  - Interactive voting and toast notifications integrated into public gallery.
- **Tier 4 Stretch Capabilities**:
  - Public REST API v1 (`/api/v1/projects`, `/api/v1/tracks`, `/api/v1/stats`) with filters and pagination.
  - Dynamic vectorized SVG Certificate of Participation generator with verification seal (`/api/certificates/[projectId]`).
  - Embeddable showcase widget for external iframe integration (`/embed/gallery`).
  - Webhook dispatch registry for submission and evaluation lifecycle events (`/api/webhooks`).
- **Repo Structure Realignment**:
  - Consolidated Next.js application into root `./src` directory matching canonical DOGFOOD layout.
  - Updated `docker-compose.yml` to build from root context `.`.
  - Automated unit and integration test harness expanded to 18/18 passing assertions (`tests/test_platform.py`).

---

## [1.1.0] - 2026-09-27 (Tier 1 Core Platform 100% Completion)

### Added
- **Event Creation Subsystem (Organizer)**:
  - API endpoint `GET /api/events` and `POST /api/events` with strict `ORGANIZER`/`ADMIN` role guard.
  - Interactive UI form at `/dashboard/events/create` with dynamic competition tracks and prize pool builders.
- **Team Formation Engine**:
  - API endpoints `POST /api/teams`, `POST /api/teams/join`, and `GET /api/teams/my-team`.
  - Cryptographic 6-character uppercase alphanumeric join code generator with collision prevention.
  - Non-bypassable business invariants: 1 active team per participant per hackathon, unique team names, 1 to 5 members roster capacity.
  - Interactive UI at `/dashboard/teams` with 1-click invite code copying and roster telemetry.
- **Project Submission Pipeline**:
  - API route `POST /api/projects` supporting iterative `DRAFT` status and immutable `SUBMITTED` lock.
  - Hard deadline enforcement validating server UTC timestamp against `hackathon.endDate` (HTTP 403 lock).
  - Submission draft editor at `/dashboard/projects/submit` with live Markdown preview and countdown clock.
  - Portfolio review view at `/dashboard/projects`.
- **Public Showcase & Gallery**:
  - API route `GET /api/projects/public` implementing the Fisher-Yates shuffle algorithm to eliminate positioning bias.
  - Public showcase view at `/gallery` with interactive track filter chips and search bar.
- **Database & Build Stabilization**:
  - Initialized SQLite embedded database `prisma/dev.db` and generated Prisma Client.
  - Fixed jsonwebtoken TypeScript declarations.
  - Successfully verified production build bundle with Next.js 16 standalone target.

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

# Project Milestone & Feature Tracker

## 1. Hackathon Development Timeline

| Milestone | Target Horizon | Status | Assignee / Engine |
| :--- | :---: | :---: | :--- |
| **M1: Core Architecture & Offline DB** | Hour 0 - 6 | ✅ COMPLETED | Docker, Prisma, SQLite, Next.js |
| **M2: Glassmorphic 3D Design System** | Hour 6 - 12 | ✅ COMPLETED | Three.js, R3F, Framer Motion, Vanilla CSS |
| **M3: Tier 1 Auth & Role Dashboards** | Hour 12 - 20 | ✅ COMPLETED | JWT, bcryptjs, RBAC Middleware |
| **M4: Event & Team Operations** | Hour 20 - 32 | 🟡 IN PROGRESS | Server Actions, SQLite Relations |
| **M5: Submission & Gallery Showcase** | Hour 32 - 44 | ⚪ QUEUED | Client Upload, Search Index |
| **M6: Tier 2 Judging & Normalization** | Hour 44 - 56 | ⚪ QUEUED | Z-Score Engine, CSV Exporter |
| **M7: Tier 3 Public Voting & Security** | Hour 56 - 64 | ⚪ QUEUED | Anti-Fraud Hash, Rate Limiter |
| **M8: Acceptance Suite Verification** | Hour 64 - 70 | ⚪ QUEUED | Automated Test Harness |
| **M9: Final Polish & Demo Production** | Hour 70 - 72 | ⚪ QUEUED | Documentation, Screen Recording |

---

## 2. Feature Work Breakdown Structure

### Tier 1: Core Submissions Platform
- `[DONE]` User Registration, Login, Logout endpoints.
- `[DONE]` HttpOnly JWT cookie session engine.
- `[DONE]` Role separation (`ADMIN`, `ORGANIZER`, `JUDGE`, `PARTICIPANT`).
- `[DONE]` 3D Landing Page with reactive WebGL canvas.
- `[DONE]` Adaptive Dashboard view responding to authenticated role.
- `[TODO]` Organizer Event Creation UI (`/dashboard/events/create`).
- `[TODO]` Team Creation & Join via 6-character alphanumeric code.
- `[TODO]` Project Submission Draft Editor with auto-save.
- `[TODO]` Hard deadline validation against UTC event end time.
- `[TODO]` Public Gallery with search bar and track chips.

### Tier 2: Judging Subsystem
- `[DONE]` Relational schema for Rubrics, Criteria, and Evaluations.
- `[TODO]` Rubric builder with percentage weight validator.
- `[TODO]` Algorithmic round-robin judge assignment.
- `[TODO]` Judge evaluation queue with criteria score inputs.
- `[TODO]` Z-Score variance normalization algorithm implementation.
- `[TODO]` Streaming CSV export of raw and normalized scores.

### Tier 3: Public Community Voting
- `[DONE]` Vote entity in database with voter hash tracking.
- `[TODO]` Public voting toggle controlled by organizer.
- `[TODO]` Fisher-Yates project shuffle algorithm.
- `[TODO]` Sliding-window IP rate limiter.
- `[TODO]` Results masking until event conclusion.
- `[DONE]` Immutable Audit Log ledger.

### Tier 4: Stretch Capabilities
- `[TODO]` REST API endpoints for external integrations.
- `[TODO]` Webhook dispatch engine for submission events.
- `[TODO]` SVG/PDF participation certificate generator.

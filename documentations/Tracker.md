# Project Milestone & Feature Tracker

## 1. Hackathon Development Timeline

| Milestone                               | Target Horizon | Status        | Assignee / Engine                         |
| :----------------------------------------| :--------------:| :-------------:| :------------------------------------------|
| **M1: Core Architecture & Offline DB**  | Hour 0 - 6     | ✅ COMPLETED   | Docker, Prisma, SQLite, Next.js           |
| **M2: Glassmorphic 3D Design System**   | Hour 6 - 12    | ✅ COMPLETED   | Three.js, R3F, Framer Motion, Vanilla CSS |
| **M3: Tier 1 Auth & Role Dashboards**   | Hour 12 - 20   | ✅ COMPLETED   | JWT, bcryptjs, RBAC Middleware            |
| **M4: Event & Team Operations**         | Hour 20 - 32   | ✅ COMPLETED   | Server Actions, SQLite Relations          |
| **M5: Submission & Gallery Showcase**   | Hour 32 - 44   | ✅ COMPLETED   | Client Upload, Search Index, Fisher-Yates |
| **M6: Tier 2 Judging & Normalization**  | Hour 44 - 56   | ✅ COMPLETED   | Z-Score Engine, CSV Exporter              |
| **M7: Tier 3 Public Voting & Security** | Hour 56 - 64   | ✅ COMPLETED   | Anti-Fraud Hash, Rate Limiter             |
| **M8: Acceptance Suite Verification**   | Hour 64 - 70   | ✅ COMPLETED   | Automated Test Harness (7/7 PASS)         |
| **M9: Final Polish & Demo Production**  | Hour 70 - 72   | 🟡 IN PROGRESS | Documentation, Screen Recording           |

---

## 2. Feature Work Breakdown Structure

### Tier 1: Core Submissions Platform (100% COMPLETE)
- `[DONE]` User Registration, Login, Logout endpoints.
- `[DONE]` HttpOnly JWT cookie session engine.
- `[DONE]` Role separation (`ADMIN`, `ORGANIZER`, `JUDGE`, `PARTICIPANT`).
- `[DONE]` 3D Landing Page with reactive WebGL canvas.
- `[DONE]` Adaptive Dashboard view responding to authenticated role.
- `[DONE]` Organizer Event Creation UI (`/dashboard/events/create`).
- `[DONE]` Team Creation & Join via 6-character alphanumeric code (`/dashboard/teams`).
- `[DONE]` Project Submission Draft Editor with auto-save (`/dashboard/projects/submit`).
- `[DONE]` Hard deadline validation against UTC event end time (HTTP 403 enforcement).
- `[DONE]` Public Gallery with search bar, track chips, and Fisher-Yates shuffle (`/gallery`).

### Tier 2: Judging Subsystem (100% COMPLETE)
- `[DONE]` Relational schema for Rubrics, Criteria, and Evaluations.
- `[DONE]` Rubric builder with percentage weight validator (`/dashboard/rubrics`, `/api/rubrics`).
- `[DONE]` Algorithmic round-robin judge assignment with COI avoidance (`/api/judges/assign`).
- `[DONE]` Judge evaluation queue with criteria score inputs & progress meter (`/dashboard/evaluations`).
- `[DONE]` Backend peer-judge shielding (HTTP 403 on peer scores, verified via `run.py`).
- `[DONE]` Participant blocking (HTTP 403 on judge scores, verified via `run.py`).
- `[DONE]` Z-Score variance normalization algorithm implementation (`/api/evaluations/normalize`).
- `[DONE]` Streaming CSV export of raw and normalized scores (`/api/export.csv`).

### Tier 3: Public Community Voting (100% COMPLETE)
- `[DONE]` Vote entity in database with voter hash tracking.
- `[DONE]` Public voting toggle controlled by organizer (`/dashboard/voting`, `/api/events/voting`).
- `[DONE]` Fisher-Yates project shuffle algorithm for unbiased ballot display.
- `[DONE]` Sliding-window IP rate limiter (5 votes/hr max, `/src/lib/rateLimit.ts`).
- `[DONE]` Results masking until event conclusion (`/api/votes` masks live tallies).
- `[DONE]` Immutable Audit Log ledger recording ballot events.

### Tier 4: Stretch Capabilities (100% COMPLETE)
- `[DONE]` REST API endpoints for external integrations (`/api/v1/projects`, `/api/v1/tracks`, `/api/v1/stats`).
- `[DONE]` Webhook dispatch engine for submission events (`/api/webhooks`).
- `[DONE]` SVG participation certificate generator with verification seal (`/api/certificates/[projectId]`).
- `[DONE]` Embeddable gallery widget for external iframe integration (`/embed/gallery`).

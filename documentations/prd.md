# Product Requirements Document (PRD)

## 1. Executive Summary & Vision

The **Dog Food Hackathon Platform** is an open-source, self-hostable, offline-first web platform engineered to govern the complete lifecycle of competitive hackathons. It eliminates dependency on cloud providers (Firebase, Supabase, Auth0, AWS) by running entirely on a local machine via `docker compose up`.

---

## 2. Target Personas & User Stories

### Persona 1: Hackathon Organizer ("Sarah")
- **As an Organizer**, I need to create a hackathon with strict start/end dates, custom tracks, and prize descriptions so that participants understand the challenge parameters.
- **As an Organizer**, I need to define scoring rubrics with weighted criteria totaling 100% so that projects are evaluated objectively.
- **As an Organizer**, I need to assign judges in balanced batches and normalize their scores so that harsh or generous judges do not skew the winners.
- **As an Organizer**, I need to export all data to CSV for final reporting and sponsor audits.

### Persona 2: Participant ("Dev Dave")
- **As a Participant**, I need to register, create a team, and generate a 6-character invite code so my teammates can join.
- **As a Participant**, I need to draft my project submission, update repository and demo links, and submit before the UTC deadline locks.
- **As a Participant**, I need to browse the public gallery to explore competitor projects.

### Persona 3: Judge ("Prof. Elena")
- **As a Judge**, I need a dedicated evaluation dashboard showing my assigned project queue and progress.
- **As a Judge**, I need to review project details and input scores (1-10) against weighted rubric criteria with optional feedback.

### Persona 4: Community Voter ("Public Visitor")
- **As a Community Member**, I want to browse submitted projects in randomized order and vote for my favorites without seeing active tallies that could bias my vote.

---

## 3. Tiered Requirements Breakdown

### Tier 1: Core (Baseline Mandatory)
1. **Authentication & Sessions**: Registration, login, logout, password hashing, and cookie session persistence.
2. **Roles & RBAC**: Participant, Judge, Organizer, Admin with role-based route protection.
3. **Event Creation**: Date range configuration, parallel track creation, prize pool definitions.
4. **Team Formation**: Team creation, invite links/codes, member join flows.
5. **Project Submission**: Multi-field submission drafts, live edits, final submission, and deadline locking.
6. **Public Gallery**: Public project cards, real-time search, and track filter chips.

### Tier 2: Judging Workflow
1. **Judge Management**: Judge account provisioning and pool management.
2. **Judge Assignment**: Batch and round-robin algorithmic assignment.
3. **Configurable Rubrics**: Weighted criteria totaling 100% with score ranges.
4. **Role Isolation**: Server-enforced permissions preventing cross-role privilege escalation.
5. **Judge Progress**: Real-time evaluation progress indicators.
6. **Score Normalization**: Z-Score statistical variance normalization across judges.
7. **CSV Export**: Data export for raw scores, normalized rankings, and project rosters.

### Tier 3: Public Participation & Anti-Fraud
1. **Community Voting**: Configurable public upvoting toggle.
2. **Hidden Results**: Live tally masking until event conclusion.
3. **Randomized Project Ordering**: Fisher-Yates shuffle algorithm to eliminate position bias.
4. **Rate Limiting**: Sliding window IP rate limiting.
5. **Duplicate Detection**: Client IP + User-Agent fingerprinting to prevent Sybil attacks.
6. **Audit Trails**: Immutable ledger tracking all critical administrative and scoring actions.

### Tier 4: Stretch Capabilities
1. **REST API & Webhooks**: REST endpoints for external tooling and HMAC-signed webhook dispatches.
2. **Certificate Generation**: Automated SVG/PDF achievement and participation certificates.
3. **Signed Participation Records**: Cryptographically verifiable judge participation records.
4. **Embeddable Gallery Widget**: Lightweight JavaScript snippet to embed project cards on external sites.
5. **Bulk Import/Export**: JSON and CSV ingestion for participants, judges, and teams.

---

## 4. Non-Functional Requirements (NFRs)

- **Air-Gap Capable**: 100% offline functionality with zero external internet dependencies.
- **Deterministic Deployment**: Must boot into a working state via `docker compose up` with seed data.
- **Performance**: Sub-100ms API response times for local SQLite queries.
- **Aesthetics**: Modern dark-mode glassmorphic interface with interactive 3D WebGL visuals.

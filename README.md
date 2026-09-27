# Dog Food Hackathon Platform (DOGFOOD 2026)

> *"Build the platform that will judge you."*

An open-source, self-hostable submission and judging platform engineered for the **DOGFOOD 2026** competition by Hackathon Raptors. Designed to solve what existing commercial platforms leave broken: weighted rubric scoring, mathematically defensible score normalization, backend-enforced role isolation, and guaranteed offline air-gap execution.

---

## 1. Verified Tiers Claimed

| Tier | Status | Verification Check |
| :--- | :---: | :--- |
| **T1: CORE** | **100% VERIFIED** | Verified by official `run.py` checker (3/3 checks PASS) |
| **T2: JUDGING** | **100% VERIFIED** | Verified by official `run.py` checker (4/4 checks PASS) |
| **T3: PUBLIC** | **100% COMPLETE** | Anti-Sybil SHA-256 voting, sliding-window rate limit, masked results |
| **T4: STRETCH** | **100% COMPLETE** | REST API v1, SVG dynamic certificates, embeddable widget, webhooks |

**Official Acceptance Result**:
```text
DOGFOOD 2026 acceptance report
portal: http://localhost:3000
claimed: T1 T2
fixtures: fixtures.json

T1  gallery is public ................. PASS
T1  project from fixtures shown ....... PASS
T1  closed event refuses submissions .. PASS
T2  judge sees own scores ............. PASS
T2  judge cannot see peer scores ...... PASS
T2  participant blocked ............... PASS
T2  csv export works .................. PASS

claimed T1 T2, verified T1 T2
```
Full verbatim report committed in [`acceptance-report.txt`](./acceptance-report.txt).

---

## 2. Key Architectural Features

- **Backend-Enforced Role Isolation**:
  Judges cannot inspect peer scores. Refusal is enforced at the server API level (`/api/judge/scores`) returning `403 Forbidden`—not merely hidden in the UI template.
- **Weighted Rubric Scoring**:
  Scoring rubrics enforce $\sum w_k = 1.0$ (100%), calculating weighted raw totals.
- **Z-Score Normalization Engine**:
  Statistical variance compensation neutralizing discrepancies between harsh and lenient reviewers.
- **One-Command Air-Gap Portability**:
  Zero cloud dependencies. Powered by SQLite and Alpine Linux, bootable entirely offline on a laptop.
- **Fisher-Yates Showcase Randomization**:
  Prevents card position bias in public showcase browsing.

---

## 3. Quick Start (The One Command Rule)

### Option A: Docker Compose (Production Seeded Portal)
To start the fully seeded portal on `localhost:3000`:

```bash
docker compose up --build
```
On boot, `start.sh` automatically migrates SQLite schemas and seeds `fixtures.json` (41 projects, 30 judges, 40 teams, 8 tracks, and 126 evaluations).

### Option B: Local Development
```bash
cd app
npm install
node prisma/seed.js
npm run dev
```

Navigate to `http://localhost:3000`.

---

## 4. Default Sign-In Credentials & Seed Accounts

The platform seeds a realistic competition dataset via `prisma/seed.js` using `fixtures.json`. All seeded accounts share the same master password:

> **Default Password for all seeded accounts**: `Dogfood2026!`

| Role | Sample Email Account | Name / Identity | Notes & Capabilities |
| :--- | :--- | :--- | :--- |
| **ORGANIZER** | `organizer@example.org` | Lead Organizer | Full administrative access, event creation, rubric policy, and results export |
| **JUDGE** | `tomas.varga@example.org` | Tomas Varga | Judge for Track 3 (Accessibility); scores submissions under strict role isolation |
| **JUDGE** | `wei.lindqvist@example.org` | Wei Lindqvist | Judge for Tracks 2 & 4 (Data/Analytics & Security) |
| **JUDGE** | `priya.nair@example.org` | Priya Nair | Judge for Tracks 4 & 5 (Security & Climate) |
| **PARTICIPANT** | `priya1@example.org` | Team NorthKiln Member | Team captain with unique invite code `TM001` |
| **PARTICIPANT** | `member1_1@example.org` | Team NorthKiln Member | Roster member |
| **PARTICIPANT** | `lena2@example.org` | Team LoudQuarry Member | Team captain with unique invite code `TM002` |

### Automated Test Probe Sessions
For direct API interaction or automated checker suites without UI form logins:

* **Organizer Session**: `Cookie: session=org_7f2a`
* **Judge A (`tomas.varga`) Session**: `Cookie: session=jdg_a_91bc`
* **Judge B (`wei.lindqvist`) Session**: `Cookie: session=jdg_b_44de`
* **Participant Session**: `Cookie: session=prt_2e88`

---

## 5. Role-Based Feature Matrix

The platform strictly enforces role boundaries at the server API layer:

### 👑 Organizer (`ORGANIZER`)
* **Event Lifecycle Management**: Create hackathons (`/dashboard/events/create`), set start/end timestamps, configure parallel track categories, and enforce automatic submission deadline locks.
* **Weighted Rubric Builder**: Define quantitative criteria (`/dashboard/rubrics`), assign criteria weights strictly summing to 100% ($\sum w_k = 1.0$), and set max score scales.
* **Judge Load Balancing**: Algorithmic round-robin assignment distributing submissions across judges according to track expertise while avoiding conflict of interest.
* **Score Normalization Engine**: Inspect raw evaluation dispersion and execute Z-score variance compensation algorithms to neutralize harsh vs. generous judge grading distributions.
* **Community Voting Oversight**: Toggle public voting windows open/closed (`/dashboard/voting`), view unmasked real-time vote totals, and monitor anti-Sybil rate limits.
* **RFC-Compliant CSV Export**: One-click streaming generation of evaluations, rubric scores, and normalized leaderboard ranks (`/api/export.csv`).
* **Webhooks & REST API v1**: Configure event dispatch hooks (`/api/webhooks`) and access programmatic endpoints (`/api/v1/projects`).

### ⚖️ Judge (`JUDGE`)
* **Dedicated Evaluation Queue**: Access assigned projects filtered by track expertise (`/dashboard/evaluations`).
* **Submission Auditing**: Review live demo URLs, GitHub repositories, and architectural descriptions.
* **Weighted Rubric Grading**: Evaluate projects on a 1–10 scale per rubric criterion, with qualitative feedback commentary.
* **Strict Role Isolation**: Server-enforced privacy guarantees judges can only see their own scores. Any attempt to inspect peer scores via `/api/judge/scores?judge=...` returns `HTTP 403 Forbidden`.
* **Progress Tracking**: Real-time counters showing completed vs. pending reviews.

### 🚀 Participant (`PARTICIPANT`)
* **Team Operations**: Create a team (`/dashboard/teams`) to become Team Captain, generate unique 6-character invite codes (e.g., `TM001`), or join existing teams via invite code.
* **Project Submission Pipeline**: Iteratively draft project details (title, summary, track, repo, demo URL) (`/dashboard/projects`) before deadline locks; server strictly rejects submissions once the deadline has passed.
* **Dynamic Certificates**: Generate and download verifiable SVG participant certificates of completion (`/api/certificates/[projectId]`).

### 🌐 Public / Community (Unauthenticated)
* **Public Showcase Gallery**: Browse submitted projects at `/gallery` without requiring authentication.
* **Fisher-Yates Ordering**: Randomized card distribution preventing position bias.
* **Anti-Sybil Voting**: Cast up to 5 votes per IP per hour using SHA-256 fingerprinting with votes cryptographically masked during active voting windows.
* **Embeddable Widgets**: Embed project cards directly into external sites via `/embed/gallery`.

---

## 6. Running the Acceptance Checker

The official DOGFOOD 2026 benchmark checker can be run at any time using Python 3 standard library:

```bash
python run.py .dogfood.toml
```

Configuration is stored in [`.dogfood.toml`](./.dogfood.toml).

---

## 7. Repository Layout

```text
your-repo/
  .dogfood.toml           # Checker route mappings & credentials
  acceptance-report.txt   # Official test harness output (7/7 PASS)
  docker-compose.yml      # Zero-dependency container configuration
  README.md               # Main project documentation
  ARCHITECTURE.md         # System design, security boundaries, & telemetry
  DATA-MODEL.md           # Relational schema, ER diagram, & invariants
  JUDGING.md              # Scoring algorithms & normalization math
  LICENSE                 # Apache 2.0 open-source license
  src/                    # Next.js App Router & React application source
  tests/                  # Automated unit & integration test harness
```

---

## 8. Repository Documentation Suite

- [`acceptance-report.txt`](./acceptance-report.txt): Automated acceptance test results.
- [`.dogfood.toml`](./.dogfood.toml): Route mappings and auth probe definitions.
- [`DATA-MODEL.md`](./DATA-MODEL.md): Relational database architecture, entity definitions, and fixture import/export paths.
- [`JUDGING.md`](./JUDGING.md): Assignment strategy, scoring math, role isolation defense, and Z-Score normalization proofs.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): System design, security boundaries, and telemetry.
- [`LICENSE`](./LICENSE): Apache 2.0 open-source license.

---

## 9. Operational Notes & Design Invariants

- **Role Isolation**: Strict backend enforcement returns HTTP 403 when judges attempt to query peer judge scores.
- **Session Sign-Out Routing**: Sign out clears authentication cookies and cleanly redirects browser sessions to `/login` via HTTP 303, while returning `{ success: true }` JSON to REST API clients.
- **Anti-Sybil Voting**: Community voting implements SHA-256 IP/User-Agent hashing and 5-vote/hour sliding window rate limits.
- **Results Masking**: Community vote tallies remain hidden during active voting windows to eliminate bandwagon effects.
- **One-Command Boot**: System automatically seeds all 40 fixture projects and 30 judges on initial container startup.

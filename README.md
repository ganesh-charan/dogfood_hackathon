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

## 4. Running the Acceptance Checker

The official DOGFOOD 2026 benchmark checker can be run at any time using Python 3 standard library:

```bash
python run.py .dogfood.toml
```

Configuration is stored in [`.dogfood.toml`](./.dogfood.toml).

---

## 5. Repository Layout

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

## 6. Repository Documentation Suite

- [`acceptance-report.txt`](./acceptance-report.txt): Automated acceptance test results.
- [`.dogfood.toml`](./.dogfood.toml): Route mappings and auth probe definitions.
- [`DATA-MODEL.md`](./DATA-MODEL.md): Relational database architecture, entity definitions, and fixture import/export paths.
- [`JUDGING.md`](./JUDGING.md): Assignment strategy, scoring math, role isolation defense, and Z-Score normalization proofs.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): System design, security boundaries, and telemetry.
- [`LICENSE`](./LICENSE): Apache 2.0 open-source license.

---

## 7. Operational Notes & Design Invariants

- **Role Isolation**: Strict backend enforcement returns HTTP 403 when judges attempt to query peer judge scores.
- **Anti-Sybil Voting**: Community voting implements SHA-256 IP/User-Agent hashing and 5-vote/hour sliding window rate limits.
- **Results Masking**: Community vote tallies remain hidden during active voting windows to eliminate bandwagon effects.
- **One-Command Boot**: System automatically seeds all 40 fixture projects and 30 judges on initial container startup.

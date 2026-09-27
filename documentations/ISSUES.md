# Known Issues, Edge Cases & Troubleshooting Guide

## 1. Resolved Historical Issues

### Issue #001: Docker Daemon Pipe Connection Failure
- **Symptom**:
  ```text
  failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine:
  The system cannot find the file specified.
  ```
- **Root Cause**: Docker Desktop was not running on the Windows host machine when `docker compose up` was executed.
- **Resolution**:
  1. Boot Docker Desktop from Windows Start Menu and ensure daemon reaches "Engine running" state.
  2. For local dev mode, fallback to native Node.js process (`npm run dev`) which bypasses the Docker engine while developing.

---

### Issue #002: npm Cache Lock File Compromise (`ECOMPROMISED`)
- **Symptom**:
  ```text
  npm error code ECOMPROMISED
  npm error Lock compromised
  ```
- **Root Cause**: Desynchronization between `package.json` dependencies and `package-lock.json` caused by interrupted chained PowerShell commands (`&&` vs `;`).
- **Resolution**:
  ```powershell
  Remove-Item package-lock.json -ErrorAction SilentlyContinue
  npm install
  ```

---

### Issue #003: Three.js WebGL SSR Hydration Incompatibility
- **Symptom**: `window is not defined` or HTML markup divergence warnings when Next.js attempts to pre-render WebGL canvas on Node.js server.
- **Root Cause**: Three.js and `@react-three/fiber` require browser DOM APIs (`HTMLCanvasElement`, `WebGLRenderingContext`).
- **Resolution**: Implemented dynamic client-side loading in `src/app/page.tsx`:
  ```tsx
  const ThreeScene = dynamic(() => import('../components/ThreeScene'), { ssr: false });
  ```

---

## 2. Anticipated Edge Cases & Mitigation Strategies

### Edge Case A: SQLite File Concurrency & Database Locks
- **Scenario**: High volume of concurrent write operations (e.g., hundreds of community votes submitted simultaneously).
- **Risk**: SQLite raises `SQLITE_BUSY: database is locked`.
- **Mitigation**:
  1. Set SQLite journal mode to WAL (Write-Ahead Logging):
     ```sql
     PRAGMA journal_mode = WAL;
     PRAGMA busy_timeout = 5000;
     ```
  2. Maintain a single shared PrismaClient instance via `src/lib/db.ts` to avoid file descriptor starvation.

---

### Edge Case B: Submission Deadline Clock Skew
- **Scenario**: Participant submits at the exact second of deadline expiration; local client machine clock differs from server time.
- **Mitigation**:
  - All deadline checks (`new Date() > hackathon.endDate`) are calculated strictly server-side using UTC timestamps. Client countdown timers are purely cosmetic indicators.

---

### Edge Case C: Judge Scoring Bias with Low Sample Size
- **Scenario**: A judge only evaluates 1 or 2 projects; calculation of sample standard deviation ($\sigma$) produces zero division ($z = \frac{x - \mu}{0}$).
- **Mitigation**:
  - Implement minimum review threshold. If $\sigma < 0.001$, normalize score using a damped mean offset:
    $$z = \frac{x - \mu}{\max(\sigma, 1.0)}$$

---

### Edge Case D: Sybil Public Voting Abuse
- **Scenario**: Scripted bots attempt to manipulate public winner rankings.
- **Mitigation**:
  1. SHA-256 hash combining client IP and User-Agent headers.
  2. Enforce unique database constraint on `(projectId, voterHash)`.
  3. Sliding window in-memory rate limiting (max 5 votes per IP per hour).

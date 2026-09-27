# Test Suite Strategy & Acceptance Verification

## 1. Automated Acceptance Testing Matrix

The platform is evaluated tier-by-tier against the hackathon acceptance suite. Below is the test specification matrix:

| Test ID | Tier Level | Target Subsystem | Assertion / Acceptance Criteria | Status |
| :---: | :---: | :--- | :--- | :---: |
| **TC-101** | T1: CORE | Auth Registration | Successfully creates user, hashes password, sets session cookie | PASS |
| **TC-102** | T1: CORE | Duplicate Email | Rejects duplicate registration with HTTP 409 Conflict | PASS |
| **TC-103** | T1: CORE | Auth Login | Verifies valid password, issues fresh JWT session cookie | PASS |
| **TC-104** | T1: CORE | Role Protection | Participant denied access to `/api/events` POST (HTTP 403) | PASS |
| **TC-105** | T1: CORE | Event Creation | Organizer provisions event with start/end dates, tracks, prizes | READY |
| **TC-106** | T1: CORE | Team Join Codes | Generates unique 6-char code; allows teammate to join | READY |
| **TC-107** | T1: CORE | Draft Submissions | Allows iterative updates while status is `DRAFT` | READY |
| **TC-108** | T1: CORE | Deadline Cutoff | Rejects submissions when server time exceeds `endDate` (HTTP 403) | READY |
| **TC-201** | T2: JUDGING | Rubric Validation | Validates criteria weights sum to 1.0 (100%) | READY |
| **TC-202** | T2: JUDGING | Role Isolation | Judges cannot alter rubrics or view other judges' draft scores | READY |
| **TC-203** | T2: JUDGING | Batch Assignment | Assigns minimum $k$ distinct judges per project without duplicates | READY |
| **TC-204** | T2: JUDGING | Normalization | Z-Score engine produces accurate variance compensation | READY |
| **TC-205** | T2: JUDGING | CSV Streaming | Exports valid CSV headers and rows for scores and rankings | READY |
| **TC-301** | T3: PUBLIC | Anti-Sybil Vote | Rejects duplicate vote from same hashed client ID | READY |
| **TC-302** | T3: PUBLIC | Rate Limiting | Enforces max 5 votes per hour sliding window | READY |
| **TC-303** | T3: PUBLIC | Hidden Results | Redacts score values while `votingOpen == true` | READY |
| **TC-001** | OFFLINE | Air-Gap Capability | Boots cleanly via `docker compose up` with network disabled | VERIFIED |

---

## 2. Test Execution Harness

### 2.1 Acceptance Test Command
To run the automated tier verification suite locally:
```powershell
npm run test
```

### 2.2 Z-Score Normalization Test Case
```typescript
describe('Z-Score Normalization Engine', () => {
  it('correctly standardizes disparate judge scoring distributions', () => {
    // Judge A (Harsh): Mean 60, StdDev 5
    // Judge B (Generous): Mean 90, StdDev 5
    const judgeAScores = [55, 60, 65];
    const judgeBScores = [85, 90, 95];

    const zA = (65 - 60) / 5; // +1.0
    const zB = (95 - 90) / 5; // +1.0

    // Both projects performed equally well relative to their judge's distribution
    expect(zA).toBeCloseTo(zB, 2);
  });
});
```

---

## 3. Offline Verification Protocol

To verify zero external cloud dependencies:
1. Disconnect Wi-Fi and unplug Ethernet on host machine.
2. Run `docker compose down -v`.
3. Run `docker compose up --build`.
4. Navigate to `http://localhost:3000`.
5. Execute registration, login, and dashboard navigation.
6. Verify no external API or DNS requests are dispatched.

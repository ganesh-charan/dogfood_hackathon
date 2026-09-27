# Event Schedule, Timestamps & Deadline Enforcement

## 1. Global Time Policy & Standardization

The **Dog Food Hackathon Platform** maintains a zero-tolerance policy for client-side clock tampering and cross-timezone desynchronization:

- **Universal Standard**: All timestamps across the database, APIs, and business logic are formatted and persisted in **ISO 8601 UTC**:
  ```text
  YYYY-MM-DDTHH:mm:ss.sssZ (e.g. 2026-09-27T09:18:25.000Z)
  ```
- **Authoritative Clock**: The host machine / Docker container system clock is the sole source of truth. Client browser clocks are treated as unverified cosmetic inputs.

---

## 2. Hackathon 72-Hour Competition Timeline

```
[Hour 00:00] ─── Hackathon Inception & Config
      │           └── Organizers set Dates, Tracks, Rubrics
      ▼
[Hour 12:00] ─── Team Registration Closes
      │           └── Participant teams formed and locked
      ▼
[Hour 60:00] ─── Submission Deadline Lock
      │           └── Hard UTC cutoff; drafts auto-finalize or reject
      ▼
[Hour 68:00] ─── Judging & Normalization Concludes
      │           └── Z-scores computed; results calibrated
      ▼
[Hour 72:00] ─── Final Awards & Public Showcase
                  └── Winners announced; CSV reports exported
```

---

## 3. Deadline Enforcement Subsystem

### 3.1 Server-Side Validation Guard
Whenever a participant initiates or edits a project submission, the backend executes the following check inside a database transaction:

```typescript
export async function assertSubmissionAllowed(hackathonId: string) {
  const hackathon = await db.hackathon.findUnique({
    where: { id: hackathonId },
    select: { startDate: true, endDate: true }
  });

  if (!hackathon) {
    throw new Error('Hackathon not found');
  }

  const now = new Date();

  if (now < hackathon.startDate) {
    throw new Error('Submission window has not opened yet.');
  }

  if (now > hackathon.endDate) {
    throw new Error('Submission deadline has passed. Submissions are permanently locked.');
  }
}
```

### 3.2 Client-Side Synchronized Countdown
- The client countdown timer fetches the authoritative server time via a lightweight `HEAD /api/health` or `GET /api/time` ping on initial load.
- It computes a local clock offset:
  $$\Delta t = t_{\text{server}} - t_{\text{client}}$$
- All visual countdown displays adjust by $\Delta t$ to eliminate user confusion caused by drifted laptop clocks.

---

## 4. Date Formatting Conventions in UI

- **Human Readable (Short)**: `Sep 27, 2026, 2:30 PM UTC`
- **Countdown Display**: `02d : 14h : 22m : 05s`
- **Relative Badges**: `"Closes in 4 hours"` (amber badge), `"Closed"` (red badge), `"Upcoming"` (teal badge).

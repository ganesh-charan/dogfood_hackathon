# Hackathon Platform Business Rules & Invariants

## 1. Role Permission Matrix (RBAC Invariants)

Access control is strictly enforced on the server. The table below represents the non-bypassable permission matrix:

| Feature / Resource | Participant | Judge | Organizer | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Public Gallery** | ✅ | ✅ | ✅ | ✅ |
| **Cast Community Vote** | ✅ | ❌ | ❌ | ❌ |
| **Create & Join Teams** | ✅ | ❌ | ❌ | ❌ |
| **Submit / Edit Project Drafts** | ✅ | ❌ | ❌ | ❌ |
| **Lock Project for Judging** | ✅ | ❌ | ❌ | ❌ |
| **View Assigned Evaluation Queue** | ❌ | ✅ | ❌ | ❌ |
| **Submit Rubric Scores** | ❌ | ✅ | ❌ | ❌ |
| **Create Hackathons & Tracks** | ❌ | ❌ | ✅ | ✅ |
| **Configure Rubrics & Weights** | ❌ | ❌ | ✅ | ✅ |
| **Assign Judges to Projects** | ❌ | ❌ | ✅ | ✅ |
| **Execute Score Normalization** | ❌ | ❌ | ✅ | ✅ |
| **Publish Final Results** | ❌ | ❌ | ✅ | ✅ |
| **Export Data (CSV / JSON)** | ❌ | ❌ | ✅ | ✅ |
| **View Immutable Audit Logs** | ❌ | ❌ | ❌ | ✅ |

---

## 2. Event & Submission Invariants

### 2.1 Timeline Rules
- **Submission Window**: Projects can only transition from `DRAFT` to `SUBMITTED` while:
  $$\text{hackathon.startDate} \le \text{Current Server Time (UTC)} \le \text{hackathon.endDate}$$
- **Hard Deadline Lock**: As soon as the server clock exceeds `hackathon.endDate`, all submissions are irreversibly locked against edits or new submissions. Late submissions return `HTTP 403 Forbidden`.

### 2.2 Team Constraints
- A participant can belong to **at most one active team** per hackathon event.
- Team names must be unique within a hackathon.
- Join codes are cryptographically generated, 6 characters alphanumeric, and case-insensitive.
- Team size is constrained between 1 and 5 members.

### 2.3 Project Submission Invariants
- Each team can submit **at most one project**.
- Required fields for final submission:
  - Project Title (min 3 chars, max 80 chars)
  - Short Tagline (min 10 chars, max 160 chars)
  - Detailed Description (Markdown supported)
  - Repository URL (must be valid URL format)
  - Target Track ID (must match an existing track configured by the organizer)

---

## 3. Rubric & Judging Rules

### 3.1 Rubric Validation Constraints
- Rubric criteria weights must sum to exactly **100%**:
  $$\sum_{k=1}^m \text{weight}_k = 1.00 \quad (\pm 0.001)$$
- Each criteria score must strictly fall within $[0, \text{maxScore}]$.

### 3.2 Conflict of Interest (COI) Rule
- A judge cannot be assigned to any project submitted by a team that includes the judge as a member.
- Judges cannot evaluate projects if they share the same organization domain where prohibited.

---

## 4. Community Voting & Anti-Abuse Rules

### 4.1 Hidden Active Results
- While community voting is active (`votingOpen = true`), public tally endpoints return randomized rankings with scores redacted to prevent bandwagon voting bias.
- Final standings are visible only after an organizer explicitly flips the event state to `concluded`.

### 4.2 Rate Limiting & Fraud Prevention
- Maximum **1 vote per project per voter ID/hash**.
- Maximum **5 total votes per IP address per hour**.
- Suspect vote bursts from identical subnets are flagged in `AuditLog` with `action = "SUSPICIOUS_VOTE_BURST"`.

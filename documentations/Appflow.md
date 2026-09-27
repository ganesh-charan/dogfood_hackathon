# Application Flow & Lifecycle Guide

## 1. End-to-End Hackathon Lifecycle

The platform governs the entire competition lifecycle across six distinct chronological phases:

```mermaid
sequenceDiagram
    autonumber
    actor Org as Organizer
    actor Part as Participant
    actor Judge as Judge
    actor Public as Public Voter
    participant System as Platform Core

    Note over Org, System: Phase 1: Inception & Configuration
    Org->>System: Create Hackathon (Dates, Tracks, Prizes, Rules)
    Org->>System: Define Scoring Rubrics & Weighted Criteria
    
    Note over Part, System: Phase 2: Team Formation & Onboarding
    Part->>System: Register Account
    Part->>System: Create Team -> Generate Unique Invite Code
    Part->>System: Teammates join via invite code

    Note over Part, System: Phase 3: Build & Submission
    Part->>System: Save Project Draft (Repo, Demo, Track)
    Part->>System: Final Submission (Before Deadline Lock)

    Note over Org, Judge: Phase 4: Judging & Normalization
    Org->>System: Assign Judges (Batch / Algorithmic balanced load)
    Judge->>System: Evaluate assigned projects against criteria
    System->>System: Calculate Z-Scores & Normalized Project Rankings

    Note over Public, System: Phase 5: Community Showcase & Voting
    Public->>System: Browse Randomized Gallery
    Public->>System: Cast Public Vote (Rate-limited, anti-fraud)

    Note over Org, System: Phase 6: Awards & Export
    Org->>System: Reveal Final Results & Export CSV Reports
```

---

## 2. Participant Journey Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Register: Provide Name, Email, Password
    Register --> ParticipantDashboard: Auto-create JWT Session
    
    state ParticipantDashboard {
        [*] --> SelectAction
        SelectAction --> CreateTeam: Create new team
        SelectAction --> JoinTeam: Enter 6-char Invite Code
        
        CreateTeam --> TeamRoster: Becomes Team Captain
        JoinTeam --> TeamRoster: Joined existing team
        
        TeamRoster --> DraftSubmission: Initiate project draft
        DraftSubmission --> EditDraft: Update title, repo, demo URL, track
        EditDraft --> FinalSubmission: Check deadline validity
        FinalSubmission --> LockedProject: Project locked after deadline
    }
    
    ParticipantDashboard --> Unauthenticated: Sign Out (POST /api/auth/logout -> 303 Redirect)
```

---

## 3. Organizer Journey Flow

1. **Dashboard Entry**: Access high-level event telemetry and status metrics.
2. **Event Configurator**:
   - Set competition start and end timestamps (ISO 8601).
   - Configure parallel Tracks (e.g., "AI & Automation", "Decentralized Systems", "Developer Tools").
   - Define track prizes and sponsor bounties.
3. **Rubric Builder**:
   - Establish criteria definitions (e.g., "Technical Complexity", "UI/UX Polish", "Originality").
   - Assign percentage weights (summing to 100%) and max raw score ranges (e.g., 1-10).
4. **Judge Assignment**:
   - Review registered judges.
   - Execute **Algorithmic Assignment**: round-robin distribution ensuring each project receives at least $N$ independent reviews without conflict of interest.
5. **Results Calibration**:
   - Preview raw score dispersion.
   - Run Normalization Pipeline.
   - Toggle Public Voting visibility.
   - Stream one-click CSV dumps for judges, projects, and rankings.

---

## 4. Judge Journey Flow

```mermaid
flowchart TD
    JudgeLogin[Judge Logs In] --> Queue[View Assigned Projects Queue]
    Queue --> ProjectCard[Select Project to Review]
    ProjectCard --> RubricForm[Review Demo, Repo & Architecture]
    RubricForm --> ScoreInput[Score each criteria 1-10 + Optional Feedback]
    ScoreInput --> SaveDraft{Save as Draft?}
    SaveDraft -- Yes --> Queue
    SaveDraft -- No --> FinalizeScore[Submit Evaluation]
    FinalizeScore --> ProgressUpdate[Progress Dashboard Updates Completed Count]
    ProgressUpdate --> Queue
```

---

## 5. Public Community & Voting Flow

1. **Public Showcase**: Open access gallery displaying all submitted projects without requiring authentication.
2. **Fisher-Yates Ordering**: Project cards are served in randomized order to prevent position bias across voters.
3. **Anti-Sybil Voting Guard**:
   - Client fingerprinting + IP hashing.
   - Rate limiting enforced at 5 votes / IP / hour.
   - Real-time results remain cryptographically hidden while the voting window is active.

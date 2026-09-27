# Database Schema & Entity-Relationship Specification

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ TeamMember : "belongs to"
    User ||--o{ Evaluation : "judges"
    User ||--o{ AuditLog : "triggers"
    Hackathon ||--o{ Track : "contains"
    Hackathon ||--o{ Prize : "awards"
    Hackathon ||--o{ Team : "registers"
    Hackathon ||--o{ Rubric : "configures"
    Track ||--o{ Project : "categorizes"
    Track ||--o{ Prize : "designates"
    Team ||--o{ TeamMember : "consists of"
    Team ||--o{ Project : "submits"
    Rubric ||--o{ Criteria : "defines"
    Project ||--o{ Evaluation : "evaluated by"
    Project ||--o{ Vote : "receives"
    Evaluation ||--o{ EvaluationScore : "contains"
    Criteria ||--o{ EvaluationScore : "rated in"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string role
        datetime createdAt
        datetime updatedAt
    }

    Hackathon {
        string id PK
        string name
        string description
        datetime startDate
        datetime endDate
        boolean votingOpen
        datetime createdAt
    }

    Track {
        string id PK
        string name
        string description
        string hackathonId FK
    }

    Prize {
        string id PK
        string name
        string description
        string trackId FK
        string hackathonId FK
    }

    Team {
        string id PK
        string name
        string joinCode UK
        string hackathonId FK
    }

    TeamMember {
        string id PK
        string userId FK
        string teamId FK
        datetime joinedAt
    }

    Project {
        string id PK
        string name
        string description
        string repoUrl
        string demoUrl
        string status
        string teamId FK
        string trackId FK
    }

    Rubric {
        string id PK
        string name
        string hackathonId FK
    }

    Criteria {
        string id PK
        string name
        float weight
        float maxScore
        string rubricId FK
    }

    Evaluation {
        string id PK
        string judgeId FK
        string projectId FK
        float totalScore
        float normalizedScore
        boolean completed
    }

    EvaluationScore {
        string id PK
        string evaluationId FK
        string criteriaId FK
        float score
    }

    Vote {
        string id PK
        string projectId FK
        string voterIpOrId
        datetime createdAt
    }

    AuditLog {
        string id PK
        string action
        string userId FK
        string details
        datetime createdAt
    }
```

---

## 2. Table Definitions & Constraints

### 2.1 `User`
- `id`: Primary Key (UUIDv4 string).
- `email`: Unique string identifier used for credentials.
- `passwordHash`: Salted bcrypt string.
- `role`: Enum-like string constraint (`PARTICIPANT`, `JUDGE`, `ORGANIZER`, `ADMIN`).

### 2.2 `Hackathon`
- `startDate` / `endDate`: UTC timestamps defining the submission window.
- `votingOpen`: Boolean flag controlling public community voting availability.

### 2.3 `Team` & `TeamMember`
- `joinCode`: Unique 6-character alphanumeric string for invite links.
- Join constraint: A user can belong to only one team per hackathon.

### 2.4 `Project`
- `status`: String constraint (`DRAFT` or `SUBMITTED`).
- Relationships: Linked directly to `Team` (one-to-one or one-to-many) and optional `Track`.

### 2.5 `Rubric` & `Criteria`
- `weight`: Floating-point scalar representing percentage of total score (e.g. `0.25` for 25%).
- `maxScore`: Maximum point ceiling per criteria (e.g., `10.0`).

### 2.6 `Evaluation` & `EvaluationScore`
- `totalScore`: Computed weighted raw score sum.
- `normalizedScore`: Re-scaled Z-score computed across all submissions evaluated by the same judge.
- `completed`: Boolean indicating whether evaluation has been finalized.

### 2.7 `Vote`
- `voterIpOrId`: Cryptographic SHA-256 digest of client IP and User-Agent to enforce rate limits and duplicate prevention.

### 2.8 `AuditLog`
- `action`: Human-readable event code (e.g., `RUBRIC_CREATED`, `DEADLINE_MODIFIED`, `SCORE_SUBMITTED`).
- `details`: Serialized JSON payload capturing the before/after state diff.

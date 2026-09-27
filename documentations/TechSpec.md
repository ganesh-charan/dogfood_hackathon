# Technical Specification (TechSpec)

## 1. System Specifications & Stack Details

| Attribute | Specification |
| :--- | :--- |
| **Framework** | Next.js 15.x (React 19.x) using App Router |
| **Runtime** | Node.js v20.x Alpine Linux (`node:20-alpine`) |
| **Output Target** | Standalone bundle (`output: 'standalone'` in `next.config.ts`) |
| **Database** | SQLite 3 via Prisma ORM (`@prisma/client` + `prisma` CLI) |
| **Binary Targets** | `native`, `linux-musl-openssl-3.0.x` |
| **3D Rendering** | Three.js (`three`), `@react-three/fiber`, `@react-three/drei` |
| **Animation Engine** | Framer Motion v13.x |
| **Authentication** | JSON Web Tokens (HMAC-SHA256), `bcryptjs` for password hashing |
| **Styling Engine** | Vanilla CSS custom properties with Glassmorphism blur effects |
| **Container Engine** | Docker Compose v3.8+ with local volume mapping |

---

## 2. API Endpoint Specification

### 2.1 Authentication Subsystem

#### `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@domain.com",
    "password": "SecurePassword123!",
    "role": "PARTICIPANT" | "ORGANIZER" | "JUDGE"
  }
  ```
- **Responses**:
  - `200 OK`: Sets `auth_token` HTTP cookie. Returns user metadata without hash.
  - `400 Bad Request`: Validation failure on email/password.
  - `409 Conflict`: Email already in use.

#### `POST /api/auth/login`
- **Request Body**: `{"email": "...", "password": "..."}`
- **Responses**:
  - `200 OK`: Replaces `auth_token` cookie.
  - `401 Unauthorized`: Invalid credentials.

#### `POST /api/auth/logout` & `GET /api/auth/logout`
- **Behavior**: Invalidates and purges `auth_token` and `session` cookies.
- **Responses**:
  - `303 See Other`: Issued when requested by web browsers (`Accept: text/html` or GET requests), cleanly redirecting the client session to `/login`.
  - `200 OK`: `{"success": true}` returned for programmatic REST API and headless HTTP clients.

---

### 2.2 Hackathon & Track Management Subsystem

#### `GET /api/events`
- Fetches all public hackathon events with nested tracks and prizes.

#### `POST /api/events` (Organizer/Admin Only)
- **Request Body**:
  ```json
  {
    "name": "Global AI Hack 2026",
    "description": "Building autonomous agentic systems.",
    "startDate": "2026-10-01T00:00:00.000Z",
    "endDate": "2026-10-04T00:00:00.000Z",
    "tracks": [
      {"name": "Agentic Workflows", "description": "LLM tool use & agents"},
      {"name": "Zero-Knowledge Systems", "description": "Privacy preservation"}
    ],
    "prizes": [
      {"name": "1st Grand Prize", "description": "$10,000 Cash Pool"}
    ]
  }
  ```

---

### 2.3 Team & Submission Subsystem

#### `POST /api/teams` (Participant Only)
- Creates team and returns generated 6-character alphanumeric `joinCode`.

#### `POST /api/teams/join` (Participant Only)
- **Request Body**: `{"joinCode": "A9X2K1"}`
- Associates current user with team.

#### `POST /api/projects` (Participant Only)
- Upserts project draft or sets `status: "SUBMITTED"`.
- Validates deadline against `hackathon.endDate`.

---

### 2.4 Judging & Scoring Subsystem

#### `POST /api/rubrics` (Organizer Only)
- Creates criteria records and assigns normalized percentage weights.

#### `POST /api/evaluations` (Judge Only)
- Submits scores per criteria. Calculates raw total score.

#### `POST /api/evaluations/normalize` (Organizer Only)
- Triggers statistical Z-Score normalization algorithm across all evaluations.

---

## 3. Data Flow & Security Guards

```
[Browser Request]
     │
     ▼
[Next.js App Server]
     │
     ├── 1. Read 'auth_token' cookie
     ├── 2. Verify HMAC-SHA256 signature
     ├── 3. Match user ID against SQLite database
     ├── 4. Validate Role against route permissions
     │       └── If violation: return 403 Forbidden
     │
     └── 5. Execute Prisma query inside transaction
             └── Return JSON payload / Render Server Component
```

# Implementation Details & Codebase Architecture

## 1. Directory Structure

```text
DogFoodHackathon/
├── app/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma schema for SQLite
│   │   └── dev.db              # Local SQLite database file (created on init)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── auth/
│   │   │   │       ├── register/route.ts  # Registration endpoint
│   │   │   │       ├── login/route.ts     # Login endpoint
│   │   │   │       └── logout/route.ts    # Logout endpoint
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx               # Role-adaptive user dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx               # Glassmorphic Login view
│   │   │   ├── register/
│   │   │   │   └── page.tsx               # Glassmorphic Registration view
│   │   │   ├── globals.css                # Custom CSS design system
│   │   │   ├── layout.tsx                 # Root layout & SEO metadata
│   │   │   └── page.tsx                   # 3D landing page
│   │   ├── components/
│   │   │   └── ThreeScene.tsx             # React Three Fiber 3D Canvas
│   │   └── lib/
│   │       ├── auth.ts                    # JWT cookie session utilities
│   │       └── db.ts                      # Prisma client singleton
│   ├── Dockerfile                         # Production multi-stage Docker build
│   ├── next.config.ts                     # Standalone Next.js configuration
│   ├── package.json                       # Dependencies & scripts
│   ├── start.sh                           # Container startup script
│   └── tsconfig.json                      # TypeScript configuration
├── documentations/                        # Complete project documentation suite
├── docker-compose.yml                     # Offline Docker Compose orchestration
└── README.md                              # Main project entry point
```

---

## 2. Core Implementation Modules

### 2.1 Database Client Singleton (`src/lib/db.ts`)
To prevent exhausting database connection pools during Next.js hot-reloading:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### 2.2 JWT Session Manager (`src/lib/auth.ts`)
Creates tamper-proof, secure HTTP-only cookies containing user ID and role claims:
```typescript
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hackathon_key';

export async function createSession(userId: string, role: string) {
  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  (await cookies()).set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getUserSession() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    return await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true }
    });
  } catch {
    return null;
  }
}
```

---

## 3. Containerized Build & Execution Pipeline

1. **Multi-Stage Dockerfile (`app/Dockerfile`)**:
   - Stage 1 (`deps`): Installs dependencies with `libc6-compat` and `openssl`.
   - Stage 2 (`builder`): Compiles Next.js standalone bundle and runs `npx prisma generate`.
   - Stage 3 (`runner`): Minimal Alpine runtime executing as unprivileged user `nextjs`.
2. **Container Launch Script (`start.sh`)**:
   - Executes `npx prisma db push --accept-data-loss` to initialize the database tables on first launch.
   - Starts the Next.js production server using `node server.js`.

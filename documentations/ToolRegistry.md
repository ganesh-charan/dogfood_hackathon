# Platform Tool Registry & Script Directory

## 1. Internal Executables & Automation Scripts

### `start.sh`
- **Location**: `/app/start.sh` (inside container)
- **Permissions**: `+x` (executable shell script)
- **Role**: Container initialization harness.
- **Workflow**:
  1. Runs `npx prisma db push --accept-data-loss` to initialize the SQLite database table structure.
  2. Executes `node server.js` to launch the standalone Next.js server on `PORT 3000`.

---

## 2. CLI Command Registry

| Command | Working Directory | Purpose |
| :--- | :--- | :--- |
| `docker compose up --build` | Root (`/`) | Full automated build and launch of containerized platform |
| `docker compose down -v` | Root (`/`) | Stops containers and resets the SQLite database volume |
| `npm run dev` | `/app` | Launches Next.js local development server with hot-reload |
| `npm run build` | `/app` | Compiles Next.js application into production standalone bundle |
| `npx prisma generate` | `/app` | Generates TypeScript client types from `prisma/schema.prisma` |
| `npx prisma db push` | `/app` | Syncs Prisma schema directly with `prisma/dev.db` without migrations |
| `npx prisma studio` | `/app` | Launches visual browser GUI to inspect and manipulate local SQLite data |

---

## 3. Package & Dependency Inventory

### Core Production Dependencies (`dependencies`)
- `@prisma/client` (`^7.10.0` / `^5.10.0`): Type-safe database client for SQLite.
- `next` (`16.3.6` / Next.js 15): React full-stack framework with App Router.
- `react` / `react-dom` (`19.2.8`): Core UI rendering engine.
- `three` (`^0.186.1`): WebGL 3D rendering library.
- `@react-three/fiber` (`^9.8.1`): Declarative Three.js wrapper for React.
- `@react-three/drei` (`^10.7.9`): Reusable helper shaders, meshes, and controls for Three.js.
- `framer-motion` (`^13.4.4`): Declarative animation and gesture engine.
- `bcryptjs` (`^3.0.3`): Pure JavaScript implementation of bcrypt password hashing.
- `jsonwebtoken` (`^9.0.3`): JWT signing and verification utility.
- `lucide-react` (`^1.48.0`): Clean, modern SVG icon set for UI views.

### Developer Tooling (`devDependencies`)
- `prisma`: Command-line schema engine and database generator.
- `typescript` (`^5`): Static type-checking compiler.
- `@types/node`, `@types/react`, `@types/react-dom`, `@types/bcryptjs`, `@types/jsonwebtoken`: Full TypeScript type definitions.
- `eslint`, `eslint-config-next`: Code quality and linting engine.

---

## 4. Environment Variables Directory

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Node execution environment |
| `PORT` | `3000` | HTTP listener port |
| `HOSTNAME` | `0.0.0.0` | Bind host address |
| `DATABASE_URL` | `file:./dev.db` | Local SQLite database file URI |
| `JWT_SECRET` | `super_secret_hackathon_key` | Secret key for signing HMAC-SHA256 session tokens |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disables telemetry beacons for strict offline privacy |

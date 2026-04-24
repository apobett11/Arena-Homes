# Arena Homes Backend Server

## 📋 Overview

This is the mission-critical backend for Arena Homes. It manages identities, leases, billing, and the immutable ledger.
Reliability, auditability, and correctness are the primary metrics of success.

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (local installation or Docker)
- **Git**

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - REFRESH_TOKEN_SECRET (generate a different secret)
```

**Example .env:**
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arena_db
JWT_SECRET=your_generated_jwt_secret_here
REFRESH_TOKEN_SECRET=your_generated_refresh_token_secret_here
```

### 3. Initialize Database

```bash
# Push schema to database (creates tables)
npm run db:push

# Seed with test data
npm run seed:minimal
```

**What gets seeded:**
- 6 test users (admin, caretaker, accountant, IT support, 2 tenants)
- 1 property with 8 units
- 2 active leases
- Sample payments, issues, and announcements

**Test credentials:** See [SEEDING_QUICK_START.md](../SEEDING_QUICK_START.md)

### 4. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
🚀 Arena Homes Backend - Starting...
📍 Environment: development
🔌 Port: 4000
✅ Database pool initialized
✅ Database connection verified
✅ Database schema ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Arena Server is LIVE
📡 API: http://localhost:4000/api
🔍 Health: http://localhost:4000/api/system/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Verify Setup (Optional)

```bash
npm run dev:verify
```

This checks:
- ✅ Database connection
- ✅ Seed data exists
- ✅ Test users are created
- ✅ Backend health endpoint

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server (requires build) |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:push` | Push schema to database (development) |
| `npm run db:migrate` | Run migrations (production) |
| `npm run seed:minimal` | Seed minimal test data (~6 users, 1 property) |
| `npm run seed:demo` | Seed demo data (~20 users, 3 properties, charts) |
| `npm run dev:clean` | Reset DB schema + run minimal seed |
| `npm run dev:verify` | Verify development environment setup |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🔧 Common Development Tasks

### Reset Database and Reseed

```bash
npm run dev:clean
```

This will:
1. Push latest schema to database
2. Run minimal seed

### Add New Migration

```bash
# 1. Modify schema in src/infrastructure/orm/schema.ts
# 2. Generate migration
npm run db:generate
# 3. Apply migration
npm run db:push  # or db:migrate in production
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:4000/api/system/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arenahomes.test","password":"Admin#1234"}'
```

## 🏗️ Architecture

### Architectural Principles

- **Modularity**: Each folder in `modules/` represents a bounded context
- **Immutability**: Financial records (Ledger) and Audit logs are APPEND-ONLY
- **Layered Architecture**: Infrastructure → Modules → API (Dependency Inversion)

### Folder Structure

```
src/
├── modules/          # Business logic by domain
│   ├── auth/        # Authentication & sessions
│   ├── users/       # User management
│   ├── property/    # Property management
│   ├── lease/       # Lease management
│   ├── payment/     # Payment processing
│   ├── ledger/      # **CRITICAL** Double-entry accounting
│   └── audit/       # **CRITICAL** System-wide audit logs
├── infrastructure/   # Technical plumbing
│   ├── database/    # Connection pools
│   ├── orm/         # Drizzle ORM setup
│   ├── config/      # Environment validation
│   └── logger/      # Winston logging
├── core/            # Shared types, constants
└── scripts/         # Utility scripts (seeding, etc.)
```

## 🚨 Architectural Guardrails (STRICT)

The following actions are **FORBIDDEN**:

1. ❌ **Direct DB Access in Routes**: Controllers → Services → Repositories
2. ❌ **Cross-Module Imports**: Use shared configs or events
3. ❌ **Updating Ledger/Audit**: `UPDATE` or `DELETE` on `ledger_entries` or `audit_logs` is prohibited
4. ❌ **Monetary Floats**: Use integers (cents) or BigInt, never `number` or `float`
5. ❌ **Frontend Money Input**: API accepts "intent ID" or "invoice ID", not raw amounts

## 🐛 Troubleshooting

### "Database connection failed"

**Check:**
- PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- DATABASE_URL in `.env` is correct
- Database exists: `createdb arena_db`

### "Missing required environment variables"

**Fix:**
- Copy `.env.example` to `.env`
- Fill in all required values
- Restart server

### "Port 4000 already in use"

**Fix:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

Or change PORT in `.env`

### "Database schema may not be initialized"

**Fix:**
```bash
npm run db:push
npm run seed:minimal
```

### PowerShell execution policy error

**Fix:**
```bash
# Use cmd instead
cmd /c "npm run dev"

# Or set execution policy
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## 🔐 Test Credentials

After running `npm run seed:minimal`:

| Email | Password | Role |
|-------|----------|------|
| `admin@arenahomes.test` | `Admin#1234` | ADMIN |
| `caretaker1@arenahomes.test` | `Care#1234` | CARETAKER |
| `accountant@arenahomes.test` | `Acc#1234` | ACCOUNTANT |
| `it@arenahomes.test` | `IT#1234` | IT_SUPPORT |
| `tenant1@arenahomes.test` | `Ten#1234` | TENANT |
| `tenant2@arenahomes.test` | `Ten#1234` | TENANT |

## 📚 Additional Documentation

- [Seeding Quick Start](../SEEDING_QUICK_START.md)
- [Seeding Implementation](../SEEDING_IMPLEMENTATION_SUMMARY.md)
- [Database Schema](../DATABASE_SCHEMA_SPEC.md)
- [API Endpoints](../API_ENDPOINT_MAP.md)
- [Access Control](../ACCESS_CONTROL_POLICY.md)

## 🆘 Need Help?

1. Run verification: `npm run dev:verify`
2. Check logs for detailed error messages
3. Ensure all prerequisites are installed
4. Review troubleshooting section above

---

**Quick Commands:**
```bash
npm install              # Install dependencies
cp .env.example .env     # Create environment file
npm run db:push          # Initialize database
npm run seed:minimal     # Seed test data
npm run dev              # Start server
npm run dev:verify       # Verify setup
```


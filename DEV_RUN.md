# Arena Homes - Local Development Setup

## 🎯 Overview

This guide will help you set up the complete Arena Homes platform on your local machine, including:
- **Backend** (arena-server): Node.js + TypeScript + Express + Drizzle + PostgreSQL
- **Frontend** (arena-web): Next.js 15 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (local or Docker)
- **Seeded Data**: Test users, properties, leases, and transactions

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/) or use Docker)
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Verify Prerequisites

```bash
node --version    # Should be 18+
npm --version     # Should be 8+
psql --version    # Should be 14+
```

## 🚀 Quick Start (3 Commands)

```bash
# 1. Set up backend
cd arena-server
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run db:push
npm run seed:minimal
npm run dev

# 2. In a new terminal, set up frontend
cd arena-web
cp .env.example .env.local
npm install
npm run dev

# 3. Open http://localhost:3000
# Login: admin@arenahomes.test / Admin#1234
```

## 📦 Detailed Setup

### Step 1: Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb arena_db

# Or using psql
psql -U postgres
CREATE DATABASE arena_db;
\q
```

#### Option B: Docker PostgreSQL

```bash
docker run --name arena-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=arena_db \
  -p 5432:5432 \
  -d postgres:14
```

### Step 2: Backend Setup (arena-server)

```bash
cd arena-server

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# Edit .env with your settings:
# NODE_ENV=development
# PORT=4000
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arena_db
# JWT_SECRET=<generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
# REFRESH_TOKEN_SECRET=<generate a different secret>

# 3. Initialize database schema
npm run db:push

# 4. Seed test data
npm run seed:minimal

# 5. Start development server
npm run dev
```

**Expected Output:**
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

### Step 3: Frontend Setup (arena-web)

**Open a new terminal window**

```bash
cd arena-web

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api

# 3. Start development server
npm run dev
```

**Expected Output:**
```
🔗 API Client initialized: http://localhost:4000/api
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

### Step 4: Verify Setup

```bash
# In backend terminal
cd arena-server
npm run dev:verify
```

This will check:
- ✅ Database connection
- ✅ Seed data exists
- ✅ Test users created
- ✅ Backend health endpoint

## 🌐 Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:4000/api | REST API |
| **Health Check** | http://localhost:4000/api/system/health | Backend status |

## 🔐 Test Credentials

After seeding, you can login with these accounts:

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| `admin@arenahomes.test` | `Admin#1234` | ADMIN | Full system access |
| `caretaker1@arenahomes.test` | `Care#1234` | CARETAKER | Property management |
| `accountant@arenahomes.test` | `Acc#1234` | ACCOUNTANT | Financial reports |
| `it@arenahomes.test` | `IT#1234` | IT_SUPPORT | System monitoring |
| `tenant1@arenahomes.test` | `Ten#1234` | TENANT | Tenant portal |
| `tenant2@arenahomes.test` | `Ten#1234` | TENANT | Tenant portal |

## 📊 What Gets Seeded

### Minimal Seed (`npm run seed:minimal`)
- ✅ 6 users (all roles)
- ✅ 1 property (Arena Njokerio A)
- ✅ 8 units (KSh 3,500 - 12,000)
- ✅ 2 active leases
- ✅ Sample payments with ledger entries
- ✅ Issues and maintenance requests
- ✅ Announcements and notifications

### Demo Seed (`npm run seed:demo`)
- ✅ Everything from minimal +
- ✅ 20 users
- ✅ 3 properties
- ✅ 60 units
- ✅ 15 active leases
- ✅ 4 months of payment history
- ✅ Budgets and financial snapshots

## 🔧 Common Development Tasks

### Reset Database

```bash
cd arena-server
npm run dev:clean
```

This will:
1. Push latest schema to database
2. Run minimal seed

### View Logs

Backend logs are displayed in the terminal where `npm run dev` is running.

### Test API Endpoints

```bash
# Health check
curl http://localhost:4000/api/system/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arenahomes.test","password":"Admin#1234"}'
```

### Hot Reload

Both backend and frontend support hot reload:
- **Backend**: Changes to `.ts` files auto-restart server
- **Frontend**: Changes to `.tsx` files auto-refresh browser

## 🐛 Troubleshooting

### Port Conflicts

**Backend (Port 4000)**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

**Frontend (Port 3000)**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed

**Check PostgreSQL is running:**
```bash
# Windows
sc query postgresql-x64-14

# Linux/Mac
pg_isready
```

**Check connection string:**
- Verify `DATABASE_URL` in `arena-server/.env`
- Format: `postgresql://username:password@localhost:5432/arena_db`

### Missing Environment Variables

**Backend:**
```bash
cd arena-server
cp .env.example .env
# Edit .env with your values
```

**Frontend:**
```bash
cd arena-web
cp .env.example .env.local
# Edit .env.local with your values
```

### Database Schema Not Initialized

```bash
cd arena-server
npm run db:push
npm run seed:minimal
```

### PowerShell Execution Policy (Windows)

```bash
# Use cmd instead
cmd /c "npm run dev"

# Or set execution policy
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Frontend Can't Connect to Backend

1. Ensure backend is running: `http://localhost:4000/api/system/health`
2. Check `NEXT_PUBLIC_API_URL` in `arena-web/.env.local`
3. Restart frontend: `npm run dev`

### CORS Errors

The backend is configured to allow all origins in development. If you still see CORS errors:
1. Check backend is running on port 4000
2. Verify frontend is using `http://localhost:4000/api`
3. Clear browser cache

## 🎨 Development Workflow

### Typical Development Session

```bash
# Terminal 1: Backend
cd arena-server
npm run dev

# Terminal 2: Frontend
cd arena-web
npm run dev

# Terminal 3: Database operations (as needed)
cd arena-server
npm run seed:minimal
npm run dev:verify
```

### Making Schema Changes

```bash
# 1. Edit schema
# arena-server/src/infrastructure/orm/schema.ts

# 2. Generate migration
cd arena-server
npm run db:generate

# 3. Apply migration
npm run db:push

# 4. Reseed (optional)
npm run seed:minimal
```

### Testing Different Roles

1. Login with different test accounts
2. Each role has different dashboard access
3. Test RBAC enforcement

## 📚 Project Structure

```
Arena/
├── arena-server/          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── modules/      # Business logic
│   │   ├── infrastructure/ # Database, logging, etc.
│   │   └── scripts/      # Seeding, utilities
│   ├── .env.example      # Environment template
│   └── package.json
│
├── arena-web/            # Frontend (Next.js 15)
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── lib/            # Utilities, API client
│   ├── .env.example    # Environment template
│   └── package.json
│
└── DEV_RUN.md          # This file
```

## 🔒 Security Notes

- **Development Only**: The provided credentials are for development only
- **JWT Secrets**: Generate strong secrets for production
- **Database**: Use strong passwords in production
- **CORS**: Configure allowed origins in production

## 📖 Additional Resources

- [Backend README](arena-server/README.md)
- [Frontend README](arena-web/README.md)
- [Seeding Quick Start](SEEDING_QUICK_START.md)
- [Database Schema](DATABASE_SCHEMA_SPEC.md)
- [API Endpoints](API_ENDPOINT_MAP.md)
- [Access Control](ACCESS_CONTROL_POLICY.md)

## 🆘 Getting Help

1. **Run verification**: `cd arena-server && npm run dev:verify`
2. **Check logs**: Look for error messages in terminal
3. **Review troubleshooting**: See sections above
4. **Check documentation**: See additional resources

## ✅ Success Criteria

You've successfully set up the environment when:

- ✅ Backend starts without errors on port 4000
- ✅ Frontend starts without errors on port 3000
- ✅ Can login with test credentials
- ✅ Dashboards load with real data
- ✅ Can navigate between different role dashboards
- ✅ Listings page shows seeded properties
- ✅ No console errors in browser

---

## 🎉 Quick Reference

**Start Everything:**
```bash
# Terminal 1
cd arena-server && npm run dev

# Terminal 2
cd arena-web && npm run dev
```

**Reset Everything:**
```bash
cd arena-server
npm run dev:clean
```

**Verify Everything:**
```bash
cd arena-server
npm run dev:verify
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api
- Login: admin@arenahomes.test / Admin#1234

**Common Ports:**
- Frontend: 3000
- Backend: 4000
- Database: 5432

Happy coding! 🚀

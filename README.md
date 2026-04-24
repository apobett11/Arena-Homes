# Arena Homes Platform

> Premium student housing and property management platform

## 🎯 Quick Start

### For Windows Users

```bash
# First-time setup
setup.bat

# Start development servers (Backend + Frontend + Seed)
npm run dev:all
# OR
start-dev.bat
```

### For Linux/Mac Users

```bash
# Make scripts executable
chmod +x setup.sh start-dev.sh

# First-time setup
./setup.sh

# Start development servers
./start-dev.sh
```

### Manual Setup

See **[DEV_RUN.md](DEV_RUN.md)** for detailed setup instructions.

## 📦 What's Included

- **arena-server**: Backend API (Node.js + TypeScript + Express + PostgreSQL)
- **arena-web**: Frontend (Next.js 15 + TypeScript + Tailwind CSS)
- **Database**: PostgreSQL with Drizzle ORM
- **Seeding**: Pre-configured test data and users

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend** | http://localhost:4000/api | REST API |
| **Health** | http://localhost:4000/api/system/health | Backend status |

## 🔐 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@arenahomes.test` | `Admin#1234` | ADMIN |
| `caretaker1@arenahomes.test` | `Care#1234` | CARETAKER |
| `accountant@arenahomes.test` | `Acc#1234` | ACCOUNTANT |
| `it@arenahomes.test` | `IT#1234` | IT_SUPPORT |
| `tenant1@arenahomes.test` | `Ten#1234` | TENANT |

## 📚 Documentation

- **[DEV_RUN.md](DEV_RUN.md)** - Complete development setup guide
- **[arena-server/README.md](arena-server/README.md)** - Backend documentation
- **[arena-web/README.md](arena-web/README.md)** - Frontend documentation
- **[SEEDING_QUICK_START.md](SEEDING_QUICK_START.md)** - Database seeding guide

## 🏗️ Architecture

### Backend (arena-server)

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle
- **Auth**: JWT + HTTP-only cookies
- **Port**: 4000

### Frontend (arena-web)

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI**: shadcn/ui + Radix UI
- **Animations**: GSAP + Framer Motion
- **Port**: 3000

## 🚀 Development Workflow

### Start Both Servers

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

**Manual:**
```bash
# Terminal 1: Backend
cd arena-server
npm run dev

# Terminal 2: Frontend
cd arena-web
npm run dev
```

### Reset Database

```bash
cd arena-server
npm run dev:clean
```

### Verify Setup

```bash
cd arena-server
npm run dev:verify
```

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## 🔧 Common Commands

```bash
# Install all dependencies
npm run install:all

# Set up database
npm run db:setup

# Verify environment
npm run verify

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

## 🐛 Troubleshooting

### Port Conflicts

**Backend (4000):**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

**Frontend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `arena-server/.env`
3. Create database: `createdb arena_db`

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

## 📖 Key Features

### Role-Based Dashboards

- **Admin**: Full system control, user management, analytics
- **Tenant**: Rent payment, lease info, maintenance requests
- **Caretaker**: Property management, tenant oversight
- **Accountant**: Financial reports, budgets, ledger
- **IT Support**: System monitoring, diagnostics

### Public Features

- Property listings with search and filters
- Property details with image galleries
- Responsive design (mobile-first)
- Dark mode support

### Backend Features

- RESTful API with comprehensive endpoints
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Immutable audit logs and ledger
- Database migrations and seeding
- Comprehensive error handling

## 🔒 Security

- **Authentication**: JWT tokens in HTTP-only cookies
- **Authorization**: Role-based access control
- **Database**: Prepared statements (SQL injection prevention)
- **Secrets**: Environment-based configuration
- **Audit**: Comprehensive activity logging

## 📊 Project Structure

```
Arena/
├── arena-server/          # Backend
│   ├── src/
│   │   ├── modules/      # Business logic
│   │   ├── infrastructure/
│   │   └── scripts/      # Seeding, utilities
│   └── package.json
│
├── arena-web/            # Frontend
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   ├── lib/            # Utilities
│   └── package.json
│
├── DEV_RUN.md           # Development guide
├── setup.bat/.sh        # Setup scripts
├── start-dev.bat/.sh    # Startup scripts
└── package.json         # Root scripts
```

## 🆘 Getting Help

1. **Read the docs**: Start with [DEV_RUN.md](DEV_RUN.md)
2. **Run verification**: `cd arena-server && npm run dev:verify`
3. **Check logs**: Look for error messages in terminal
4. **Review troubleshooting**: See sections above

## ✅ Success Criteria

Your environment is ready when:

- ✅ Backend starts on port 4000 without errors
- ✅ Frontend starts on port 3000 without errors
- ✅ Can login with test credentials
- ✅ Dashboards load with real data
- ✅ No console errors in browser
- ✅ API health check returns 200

## 🎉 Next Steps

1. **Explore the app**: Login with different roles
2. **Review the code**: Check out the architecture
3. **Make changes**: Both servers support hot reload
4. **Test features**: Try different dashboards and features

---

**Quick Reference:**

```bash
# Setup (first time)
setup.bat          # Windows
./setup.sh         # Linux/Mac

# Start servers
start-dev.bat      # Windows
./start-dev.sh     # Linux/Mac

# Access
http://localhost:3000  # Frontend
http://localhost:4000/api  # Backend

# Login
admin@arenahomes.test / Admin#1234
```

Happy coding! 🚀

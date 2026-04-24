# Arena Homes - Quick Reference Card

## 🚀 First Time Setup

### Windows
```bash
setup.bat
```

### Linux/Mac
```bash
chmod +x setup.sh start-dev.sh
./setup.sh
```

## ▶️ Start Development

### Windows
```bash
start-dev.bat
```

### Linux/Mac
```bash
./start-dev.sh
```

### Manual
```bash
# Terminal 1
cd arena-server && npm run dev

# Terminal 2
cd arena-web && npm run dev
```

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000/api |
| Health | http://localhost:4000/api/system/health |

## 🔐 Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@arenahomes.test | Admin#1234 | ADMIN |
| tenant1@arenahomes.test | Ten#1234 | TENANT |
| caretaker1@arenahomes.test | Care#1234 | CARETAKER |
| accountant@arenahomes.test | Acc#1234 | ACCOUNTANT |
| it@arenahomes.test | IT#1234 | IT_SUPPORT |

## 🔧 Common Commands

### Backend (arena-server)
```bash
npm run dev              # Start server
npm run db:push          # Apply schema
npm run seed:minimal     # Seed test data
npm run seed:demo        # Seed demo data
npm run dev:clean        # Reset DB + seed
npm run dev:verify       # Verify setup
```

### Frontend (arena-web)
```bash
npm run dev              # Start server
npm run build            # Build production
npm run lint             # Run linter
```

### Root
```bash
npm run install:all      # Install all deps
npm run db:setup         # Setup database
npm run verify           # Verify setup
```

## 🐛 Troubleshooting

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:4000 | xargs kill -9
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in arena-server/.env
# Create database: createdb arena_db
```

### Missing .env Files
```bash
# Backend
cd arena-server
cp .env.example .env

# Frontend
cd arena-web
cp .env.example .env.local
```

### Reset Everything
```bash
cd arena-server
npm run dev:clean
```

## 📁 Project Structure

```
Arena/
├── arena-server/     # Backend (Port 4000)
├── arena-web/        # Frontend (Port 3000)
├── DEV_RUN.md       # Full setup guide
├── README.md        # Main documentation
├── setup.bat/.sh    # Setup scripts
└── start-dev.bat/.sh # Startup scripts
```

## 📚 Documentation

- **DEV_RUN.md** - Complete setup guide
- **arena-server/README.md** - Backend docs
- **arena-web/README.md** - Frontend docs
- **SEEDING_QUICK_START.md** - Seeding guide

## ✅ Verification Checklist

- [ ] Backend starts on port 4000
- [ ] Frontend starts on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can login with test credentials
- [ ] Dashboards load with data
- [ ] No console errors

## 🆘 Need Help?

1. Read DEV_RUN.md
2. Run: `cd arena-server && npm run dev:verify`
3. Check terminal logs for errors

---

**Quick Start:** `setup.bat` → `start-dev.bat` → http://localhost:3000

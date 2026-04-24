# Arena Homes - Troubleshooting Guide

## 🔍 Common Issues and Solutions

### 1. Port Already in Use

#### Symptoms
- Error: "Port 4000 is already in use"
- Error: "Port 3000 is already in use"

#### Solution

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :4000

# Kill process
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:4000 | xargs kill -9
```

**Alternative:**
Change port in environment file:
- Backend: Edit `arena-server/.env` → `PORT=4001`
- Frontend: Run `PORT=3001 npm run dev`

---

### 2. Database Connection Failed

#### Symptoms
- Error: "Database connection failed"
- Error: "ECONNREFUSED"
- Error: "password authentication failed"

#### Solutions

**Check PostgreSQL is Running:**
```bash
# Windows
sc query postgresql-x64-14

# Linux/Mac
pg_isready
```

**Verify DATABASE_URL:**
```bash
# Check arena-server/.env
DATABASE_URL=postgresql://username:password@localhost:5432/arena_db
```

**Create Database:**
```bash
createdb arena_db

# Or using psql
psql -U postgres
CREATE DATABASE arena_db;
\q
```

**Test Connection:**
```bash
psql -U postgres -d arena_db -c "SELECT 1"
```

---

### 3. Missing Environment Variables

#### Symptoms
- Error: "❌ Invalid environment variables"
- Error: "NEXT_PUBLIC_API_URL is not configured"
- Server exits immediately

#### Solution

**Backend:**
```bash
cd arena-server
cp .env.example .env

# Edit .env and set:
# - DATABASE_URL
# - JWT_SECRET
# - REFRESH_TOKEN_SECRET
```

**Frontend:**
```bash
cd arena-web
cp .env.example .env.local

# Edit .env.local and set:
# - NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**Generate Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 4. Database Schema Not Initialized

#### Symptoms
- Error: "relation 'users' does not exist"
- Warning: "Database schema may not be initialized"

#### Solution

```bash
cd arena-server

# Apply schema
npm run db:push

# Seed test data
npm run seed:minimal
```

---

### 5. Frontend Can't Connect to Backend

#### Symptoms
- API calls fail
- CORS errors
- Network errors in browser console

#### Solutions

**Verify Backend is Running:**
```bash
curl http://localhost:4000/api/system/health
```

**Check Environment Variable:**
```bash
# arena-web/.env.local should have:
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**Restart Frontend:**
```bash
cd arena-web
# Stop server (Ctrl+C)
npm run dev
```

**Check Browser Console:**
- Look for specific error messages
- Verify API URL in network tab

---

### 6. PowerShell Execution Policy (Windows)

#### Symptoms
- Error: "cannot be loaded because running scripts is disabled"
- npm scripts fail to run

#### Solutions

**Option 1: Use cmd instead**
```bash
cmd /c "npm run dev"
```

**Option 2: Set execution policy**
```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Option 3: Use batch files**
```bash
setup.bat
start-dev.bat
```

---

### 7. Seed Data Already Exists

#### Symptoms
- Warning: "User already exists"
- Seed script skips records

#### Explanation
This is **normal behavior**. The seed scripts are idempotent and skip existing records.

#### To Reset Data
```bash
cd arena-server
npm run dev:clean
```

---

### 8. TypeScript Compilation Errors

#### Symptoms
- Error: "Cannot find module"
- Error: "Type error"

#### Solutions

**Rebuild:**
```bash
cd arena-server  # or arena-web
npm run build
```

**Clear and Reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Check TypeScript Version:**
```bash
npx tsc --version
```

---

### 9. Hot Reload Not Working

#### Symptoms
- Changes don't reflect in browser
- Server doesn't restart on file changes

#### Solutions

**Backend:**
```bash
# Restart server
cd arena-server
# Stop (Ctrl+C)
npm run dev
```

**Frontend:**
```bash
# Clear Next.js cache
cd arena-web
rm -rf .next
npm run dev
```

**Check File Watchers (Linux):**
```bash
# Increase limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### 10. Login Fails

#### Symptoms
- Invalid credentials error
- User not found

#### Solutions

**Verify Seed Data:**
```bash
cd arena-server
npm run dev:verify
```

**Check Test Credentials:**
| Email | Password |
|-------|----------|
| admin@arenahomes.test | Admin#1234 |

**Reseed Database:**
```bash
cd arena-server
npm run seed:minimal
```

**Check Backend Logs:**
Look for authentication errors in terminal

---

### 11. CORS Errors

#### Symptoms
- "Access-Control-Allow-Origin" error
- Cross-origin request blocked

#### Solutions

**Verify Backend CORS Config:**
Backend should allow all origins in development (already configured)

**Check Request URL:**
Ensure frontend is using `http://localhost:4000/api`

**Clear Browser Cache:**
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear cache in browser settings

---

### 12. Dependencies Installation Failed

#### Symptoms
- npm install errors
- Module not found errors

#### Solutions

**Clear npm Cache:**
```bash
npm cache clean --force
```

**Delete and Reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Check Node Version:**
```bash
node --version  # Should be 18+
```

**Use Specific npm Registry:**
```bash
npm install --registry https://registry.npmjs.org/
```

---

### 13. Database Migration Errors

#### Symptoms
- Migration fails
- Schema mismatch

#### Solutions

**Reset Schema:**
```bash
cd arena-server
npm run db:push
```

**Generate New Migration:**
```bash
npm run db:generate
npm run db:push
```

**Manual Reset (Development Only):**
```bash
# Drop and recreate database
dropdb arena_db
createdb arena_db
npm run db:push
npm run seed:minimal
```

---

### 14. Middleware Infinite Loop

#### Symptoms
- Too many redirects error
- Browser shows redirect loop

#### Solutions

**Check RBAC Configuration:**
- Verify user role is valid
- Check route is in `lib/rbac/config.ts`

**Clear Cookies:**
- Open browser DevTools
- Application → Cookies → Clear all

**Check Middleware Logic:**
- Review `arena-web/middleware.ts`
- Ensure redirect target is accessible

---

### 15. Build Fails

#### Symptoms
- Production build errors
- Type errors during build

#### Solutions

**Frontend:**
```bash
cd arena-web
rm -rf .next
npm run build
```

**Backend:**
```bash
cd arena-server
rm -rf dist
npm run build
```

**Check for Type Errors:**
```bash
npx tsc --noEmit
```

---

## 🆘 Still Having Issues?

### Verification Steps

1. **Run verification script:**
   ```bash
   cd arena-server
   npm run dev:verify
   ```

2. **Check all prerequisites:**
   - Node.js 18+ installed
   - PostgreSQL 14+ running
   - Database created

3. **Review logs:**
   - Backend terminal output
   - Frontend terminal output
   - Browser console

4. **Check environment files:**
   - `arena-server/.env` exists and configured
   - `arena-web/.env.local` exists and configured

5. **Verify ports:**
   - Backend: 4000
   - Frontend: 3000
   - Database: 5432

### Clean Slate Reset

```bash
# Stop all servers

# Backend
cd arena-server
rm -rf node_modules package-lock.json dist
npm install
npm run db:push
npm run seed:minimal

# Frontend
cd arena-web
rm -rf node_modules package-lock.json .next
npm install

# Start servers
# Terminal 1: cd arena-server && npm run dev
# Terminal 2: cd arena-web && npm run dev
```

### Get Help

1. Check [DEV_RUN.md](DEV_RUN.md) for detailed setup
2. Review [README.md](README.md) for quick start
3. Check backend/frontend README files
4. Review error logs carefully

---

## 📋 Quick Diagnostic Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] Database `arena_db` exists
- [ ] `arena-server/.env` configured
- [ ] `arena-web/.env.local` configured
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database schema applied
- [ ] Test data seeded
- [ ] Port 4000 available
- [ ] Port 3000 available
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can login with test credentials

---

**Last Updated**: 2026-01-24

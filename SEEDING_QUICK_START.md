# Arena Homes Seeding - Quick Start Guide

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Ensure you're in the arena-server directory
cd arena-server

# Verify .env file has DATABASE_URL set
# DATABASE_URL=postgresql://user:password@localhost:5432/arena_db
```

### 2. Run Minimal Seed (Recommended for Development)
```bash
npm run seed:minimal
```

**What you get:**
- 6 test users with known passwords
- 1 property with 8 units
- 2 active leases + 1 pending
- Sample payments, issues, announcements

**Time:** ~5-10 seconds

### 3. Run Demo Seed (For Dashboards & Charts)
```bash
npm run seed:demo
```

**What you get:**
- Everything from minimal seed PLUS:
- 3 properties, 60 units
- 20 tenants, 15 active leases
- 4 months of payment history
- Budgets and financial snapshots

**Time:** ~20-30 seconds

## 🔑 Test Credentials

After seeding, you can login with these accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@arenahomes.test` | `Admin#1234` | ADMIN |
| `caretaker1@arenahomes.test` | `Care#1234` | CARETAKER |
| `accountant@arenahomes.test` | `Acc#1234` | ACCOUNTANT |
| `it@arenahomes.test` | `IT#1234` | IT_SUPPORT |
| `tenant1@arenahomes.test` | `Ten#1234` | TENANT |
| `tenant2@arenahomes.test` | `Ten#1234` | TENANT |

## 📊 What Gets Created

### Minimal Seed
```
✓ 6 users (all roles)
✓ 1 property (Arena Njokerio A)
✓ 8 units (mixed types, KSh 3,500 - 12,000)
✓ 2 active leases (units marked TAKEN)
✓ 1 pending lease
✓ 2 successful payments (with ledger entries)
✓ 1 failed payment
✓ 2 issues (tenant-reported)
✓ 1 maintenance request
✓ 3 announcements
✓ 5 notifications
✓ 1 financial snapshot
```

### Demo Seed (Includes Minimal + More)
```
✓ 20 users
✓ 3 properties
✓ 60 units
✓ 15 active leases (~60-70% occupancy)
✓ 40+ payments (last 4 months)
✓ 2 budgets with allocations
✓ 12 financial snapshots (4 months × 3 properties)
```

## ✅ Safety Features

- **Idempotent**: Safe to run multiple times
- **No Duplicates**: Checks existing records before creating
- **Audit Trail**: All operations logged
- **Domain Services**: Uses proper business logic (not raw DB inserts)
- **Transaction Safe**: Atomic operations with rollback on error

## 🔧 Troubleshooting

### "Database not initialized"
**Solution:** Check your `.env` file has `DATABASE_URL` set correctly.

### "User already exists"
**Solution:** This is normal! The seed is idempotent and skips existing records.

### PowerShell execution policy error
**Solution:** Use `cmd /c "npm run seed:minimal"` instead.

### TypeScript errors
**Solution:** Run `npm run build` to check for compilation errors.

## 📁 File Locations

```
arena-server/
├── src/scripts/seed/
│   ├── index.ts       # Main runner
│   ├── minimal.ts     # Minimal dataset
│   ├── demo.ts        # Demo dataset
│   ├── utils.ts       # Utilities
│   └── README.md      # Full documentation
└── package.json       # Scripts: seed:minimal, seed:demo
```

## 🎯 Common Use Cases

### Fresh Development Environment
```bash
npm run seed:minimal
```

### Testing Dashboards
```bash
npm run seed:demo
```

### Resetting Data (Re-run seed)
```bash
# Seeds are idempotent - just run again
npm run seed:minimal
```

## 📖 Full Documentation

For detailed information, see:
- `src/scripts/seed/README.md` - Complete seeding documentation
- `SEEDING_IMPLEMENTATION_SUMMARY.md` - Implementation details

## 🆘 Need Help?

1. Check the full README: `src/scripts/seed/README.md`
2. Verify database connection: Check `.env` file
3. Check TypeScript compilation: `npm run build`
4. Review logs: Seed output shows detailed progress

---

**Quick Commands:**
```bash
npm run seed:minimal  # Fast development seed
npm run seed:demo     # Full dashboard seed
npm run build         # Verify TypeScript
```

**Test Login:** `admin@arenahomes.test` / `Admin#1234`

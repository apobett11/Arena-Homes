# Arena Homes Frontend

## 📋 Overview

This is the Next.js 15 frontend for Arena Homes, a premium student housing platform. Built with the App Router, TypeScript, Tailwind CSS, and modern web technologies.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Backend** running on http://localhost:4000 (see [arena-server/README.md](../arena-server/README.md))

### Setup

```bash
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

### Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Test Login

After the backend is seeded, you can login with:

| Email | Password | Role |
|-------|----------|------|
| `admin@arenahomes.test` | `Admin#1234` | ADMIN |
| `tenant1@arenahomes.test` | `Ten#1234` | TENANT |
| `caretaker1@arenahomes.test` | `Care#1234` | CARETAKER |
| `accountant@arenahomes.test` | `Acc#1234` | ACCOUNTANT |
| `it@arenahomes.test` | `IT#1234` | IT_SUPPORT |

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build production bundle |
| `npm start` | Run production server (requires build) |
| `npm run lint` | Run ESLint |

## 🏗️ Project Structure

```
arena-web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── admin/             # Admin dashboard
│   ├── tenant/            # Tenant dashboard
│   ├── caretaker/         # Caretaker dashboard
│   ├── accountant/        # Accountant dashboard
│   ├── it-support/        # IT Support dashboard
│   ├── listings/          # Public listings
│   └── page.tsx           # Homepage
│
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
│
├── lib/                  # Utilities and helpers
│   ├── api/             # API client
│   ├── rbac/            # Role-based access control
│   └── utils.ts         # Utility functions
│
├── middleware.ts         # Next.js middleware (auth, RBAC)
└── public/              # Static assets
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: GSAP 3.14+ + Framer Motion
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light mode)

## 🔒 Authentication & Authorization

### Authentication Flow

1. User submits login credentials
2. Frontend sends request to `/api/auth/login`
3. Backend validates and returns JWT + refresh token
4. Tokens stored in HTTP-only cookies
5. Middleware validates on each request

### Role-Based Access Control (RBAC)

The middleware enforces route access based on user role:

- **PUBLIC**: `/`, `/listings`, `/auth/*`
- **ADMIN**: All routes
- **TENANT**: `/tenant/*`
- **CARETAKER**: `/caretaker/*`
- **ACCOUNTANT**: `/accountant/*`
- **IT_SUPPORT**: `/it-support/*`

See [lib/rbac/config.ts](lib/rbac/config.ts) for full configuration.

## 🌐 Environment Variables

### Required

- `NEXT_PUBLIC_API_URL`: Backend API base URL (e.g., `http://localhost:4000/api`)

### Optional

- `NODE_ENV`: Environment (`development`, `production`)

**Note**: All public environment variables must be prefixed with `NEXT_PUBLIC_`

## 🔧 Development

### Hot Reload

The development server supports hot reload. Changes to files will automatically refresh the browser.

### API Integration

API calls are made through the centralized client in `lib/api/client.ts`:

```typescript
import { fetchClient } from '@/lib/api/client';

// Example: Fetch properties
const properties = await fetchClient<Property[]>('/properties');
```

### Adding New Pages

1. Create page in appropriate directory under `app/`
2. Update RBAC config in `lib/rbac/config.ts` if needed
3. Add navigation links in relevant dashboard

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theming (see `app/globals.css`)
- Prefer composition over custom CSS

## 🐛 Troubleshooting

### "NEXT_PUBLIC_API_URL is not configured"

**Fix:**
```bash
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL
```

### API Connection Errors

**Check:**
1. Backend is running: `http://localhost:4000/api/system/health`
2. `NEXT_PUBLIC_API_URL` is correct in `.env.local`
3. No CORS errors in browser console

**Fix:**
```bash
# Restart frontend
npm run dev
```

### Port 3000 Already in Use

**Fix:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

Or change the port:
```bash
PORT=3001 npm run dev
```

### Middleware Infinite Loop

This can happen if RBAC configuration is incorrect. Check:
1. User role is valid
2. Route is configured in `lib/rbac/config.ts`
3. Redirect target is accessible by the role

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 🎯 Key Features

### Dashboards

Each role has a dedicated dashboard with role-specific features:

- **Admin**: Full system control, user management, analytics
- **Tenant**: Rent payment, lease info, maintenance requests
- **Caretaker**: Property management, tenant oversight
- **Accountant**: Financial reports, budgets, ledger
- **IT Support**: System monitoring, diagnostics

### Public Pages

- **Homepage**: Hero, featured listings, trust badges
- **Listings**: Property search and filtering
- **Property Details**: Individual property information

### Design System

- **Premium aesthetics**: Glassmorphism, gradients, animations
- **Dark mode**: Full dark mode support
- **Responsive**: Mobile-first design
- **Accessible**: WCAG 2.1 AA compliant

## 📚 Additional Documentation

- [Root Setup Guide](../DEV_RUN.md)
- [Backend README](../arena-server/README.md)
- [Dashboard Integration](DASHBOARD_INTEGRATION.md)
- [Testing Guide](TESTING_GUIDE.md)

## 🆘 Need Help?

1. Check backend is running: `http://localhost:4000/api/system/health`
2. Verify environment variables in `.env.local`
3. Check browser console for errors
4. Review [DEV_RUN.md](../DEV_RUN.md) for full setup

---

## Quick Commands

```bash
npm install              # Install dependencies
cp .env.example .env.local  # Create environment file
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run linter
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api
- Login: admin@arenahomes.test / Admin#1234

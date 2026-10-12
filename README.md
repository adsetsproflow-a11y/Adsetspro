# Adsetspro SaaS — Multi-Tenant Project Management & WebP Engine

A production-grade, high-performance Multi-Tenant Cloud SaaS Project Management & Productivity Platform inspired by **Zoho Projects** and **ClickUp**, featuring a built-in **WebP Image Compression Engine**, **Gamified XP Leaderboard**, and **Real-time Web Audio Synthesizer**.

---

## 🚀 Key Features

### 1. 🏢 Multi-Tenant Architecture & Subdomains
- **Platform Owner (Super Admin)**: `Adsetspro SaaS` (`owner@adsetspro.com`) oversees platform telemetry, MRR, seats, and storage quotas.
- **Client Tenants**: Isolated workspace environments for client companies (e.g. `/workspace/apex`, `/workspace/techflow`, `/workspace/pulse`).
- **Super Admin Tenant Toggle (ON / OFF)**: Platform Owner can toggle any client company ON (Active) or OFF (Suspended pending payment/renewal).
- **Workspace Suspension Guard**: Suspended tenant workspaces automatically lock product features for employees with a clear account renewal notice.

### 2. 🔐 Authentication & Role-Based Access Control (RBAC)
- Client Company Registration: Automatically provisions a new client company, subdomains, and Company Admin account.
- Passwords secured with Web Crypto SHA-256 client-side hashing.
- Role Hierarchy:
  - 👑 **Super Admin** (Platform Owner)
  - 🏢 **Company Admin** (Manages company employees, tasks, and settings)
  - 👔 **Team Lead** (Supervises department tasks)
  - 👷 **Worker / Member** (Completes tasks, uploads WebP deliverables)

### 3. 👥 Company Admin Employee Management
- Dedicated **Team & Employees** management tab.
- Company Admins can onboard employees by name, email, department (Development, Design, Content), and role.
- 1-Click **"Assign New Task"** button on employee profile cards.

### 4. 📋 Zoho Projects Table with ClickUp Speed
- Live countdown deadlines with visual pulse alerts (`Overdue` 🔴, `Urgent ≤1h` 🟡).
- Real-time per-task stopwatch timers.
- Interactive status pipelines: `To Do` ➔ `In Progress` ➔ `Under Review 🔍` ➔ `Completed 🏆`.
- Canvas Confetti celebrations upon deliverable completion.

### 5. 🖼️ WebP Image Studio & Deliverable Workflow
- Client-side drag-and-drop conversion engine using HTML5 Canvas.
- Converts PNG/JPEG/JPG to WebP with adjustable quality compression (5% - 95%).
- Live before-and-after comparison slider with byte size and savings % (e.g. -85.4%).
- Deliverable upload button on task rows and drawer.
- **Assigner Downloads**: The person who assigned the task can download both **WebP (Optimized)** and **RAW (Original)** deliverables.

### 6. 🔊 Zero-Asset Web Audio Synthesizer
- Built-in sound engine powered by browser `AudioContext` (no external MP3/WAV assets needed).
- Custom synthesized harmonic chimes:
  - C5-G5 bell chime for assignments and status changes
  - Dual-tone pulsing urgent alarm for approaching deadlines
  - Positive chord progression for task completions
  - Chat pop for messages
- Global mute toggle in the navigation header.

### 7. 🎨 UI & Aesthetics
- Segmented dual-pill theme switcher: `[ ☀️ Light | 🌙 Dark ]` with smooth CSS transitions.
- Responsive modern design with Tailwind CSS v4 and Lucide React icons.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: [Supabase](https://supabase.com/) PostgreSQL
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visual FX**: Canvas Confetti

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+ installed

### 2. Installation
```bash
git clone https://github.com/adsetsproflow-a11y/Adsetspro.git
cd Adsetspro
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and add your database configuration:
```bash
cp .env.example .env.local
```

### 4. Database Setup (Optional)
To initialize the Supabase schema and seed data:
```bash
node scripts/setup-db.js
```

### 5. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main landing & platform entry
│   │   ├── layout.tsx                  # Root layout & dark mode provider
│   │   ├── api/db-status/route.ts      # Database health check
│   │   └── workspace/[subdomain]/      # Dynamic tenant workspace route
│   ├── components/
│   │   ├── Header.tsx                  # Navbar, quick switcher, audio controls
│   │   ├── SuperAdminDashboard.tsx     # Platform owner console & tenant ON/OFF toggles
│   │   ├── TeamManagement.tsx          # Company admin employee management & onboarding
│   │   ├── TaskTable.tsx               # Zoho-style interactive task board
│   │   ├── TaskDrawer.tsx              # Task discussion, deliverable inspector
│   │   ├── WebPStudio.tsx              # HTML5 canvas WebP conversion engine
│   │   ├── Leaderboard.tsx             # Gamified XP top 3 podium
│   │   ├── ChatSystem.tsx              # Multi-channel department messaging
│   │   ├── AuthModal.tsx               # Login, register tenant, password reset
│   │   └── ThemeToggle.tsx             # Dual-pill Light / Dark mode toggle
│   └── lib/
│       ├── types.ts                    # Core TypeScript models
│       ├── auth.ts                     # AuthService, SHA-256 hashing, JWT session
│       ├── storage.ts                  # Reactive SaaSStore with localStorage sync
│       ├── audio.ts                    # Web Audio API sound synthesizer
│       └── seed-data.ts                # Initial multi-tenant mock data
├── scripts/
│   └── setup-db.js                     # Supabase PostgreSQL DDL migration script
└── README.md
```

---

## 📜 License
MIT License. Built for **Adsetspro SaaS**.

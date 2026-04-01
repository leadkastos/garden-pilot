# 🌱 Garden Pilot

> Your smart guide to a better garden.

A modern SaaS garden management dashboard built with React + Vite, Tailwind CSS, Supabase, and Vercel.

---

## Tech Stack

| Layer       | Tool |
|-------------|------|
| Frontend    | React 18 + Vite |
| Styling     | Tailwind CSS |
| Auth + DB   | Supabase |
| Email       | Resend |
| Hosting     | Vercel |
| Icons       | Lucide React |
| Charts      | Recharts |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/garden-pilot.git
cd garden-pilot
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Storage** → New bucket → name it `garden-photos` (private)
4. Copy your project URL and anon key from **Settings → API**

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_RESEND_API_KEY=your_resend_key_here
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B — GitHub Integration
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add environment variables in Vercel dashboard
4. Deploy

---

## Project Structure

```
src/
├── components/
│   └── layout/
│       └── Layout.jsx          # Top nav, notifications, profile dropdown
├── lib/
│   ├── supabase.js             # Supabase client
│   └── AuthContext.jsx         # Auth state provider
├── pages/
│   ├── LoginPage.jsx           # Login + signup
│   ├── DashboardPage.jsx       # Main dashboard
│   ├── ProfilePage.jsx         # User profile + tracker links
│   ├── FlowerTrackerPage.jsx   # Flower spreadsheet tracker
│   └── StubPages.jsx           # Placeholder pages (Calendar, Plants, etc.)
└── styles/
    └── globals.css             # Tailwind + custom design tokens
```

---

## Database Tables

| Table             | Purpose |
|-------------------|---------|
| `profiles`        | User accounts + settings |
| `plants`          | Individual plant entries |
| `beds`            | Garden bed definitions |
| `bed_plants`      | Plants assigned to beds |
| `tasks`           | System + user tasks |
| `expenses`        | Spending tracker |
| `notifications`   | In-app alerts |
| `photos`          | Photo metadata (stored in Supabase Storage) |
| `flower_tracker`  | Flower spreadsheet rows |
| `flower_cycles`   | Harvest cycles per flower (expandable) |
| `reports`         | Generated weekly/monthly/yearly reports |
| `broadcasts`      | Admin broadcast messages |

---

## Pages — Build Status

| Page              | Status |
|-------------------|--------|
| Login / Signup    | ✅ Complete |
| Dashboard         | ✅ Complete |
| Profile           | ✅ Complete |
| Flower Tracker    | ✅ Complete |
| Calendar          | 🔧 Stub — coming next |
| My Plants         | 🔧 Stub — coming next |
| Garden Beds       | 🔧 Stub — coming next |
| Expenses          | 🔧 Stub — coming next |
| Reports           | 🔧 Stub — coming next |
| Shop (Affiliate)  | 🔧 Stub — coming next |

---

## Fonts

- **Display:** Playfair Display (headings, numbers)
- **Body:** DM Sans (UI text)
- **Mono:** DM Mono (data/code)

---

## Color Palette

| Name     | Primary | Usage |
|----------|---------|-------|
| Garden   | `#3a7a2e` | Primary brand green |
| Soil     | `#9a6b42` | Secondary/accent brown |
| Cream    | `#fdfcf8` | Card backgrounds |
| Parchment| `#f6f3ec` | Page background |

---

## Roadmap (Next Steps)

- [ ] Connect flower tracker to Supabase (save/load data)
- [ ] Build out My Plants page with add/edit/delete
- [ ] Build Garden Beds with plant assignment
- [ ] Build Expenses with year filter + category breakdown
- [ ] Build Calendar with FullCalendar or custom grid
- [ ] Add weather API (OpenWeatherMap)
- [ ] Build Reports with PDF export
- [ ] Add vegetable + herb trackers
- [ ] Admin broadcast system
- [ ] Email notifications via Resend
- [ ] Photo upload to Supabase Storage

---

## License

Private — All rights reserved.

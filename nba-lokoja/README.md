# NBA Lokoja Branch — Official Website Platform

A modern, professional, fully responsive multi-page website for the **Nigerian Bar Association, Lokoja Branch (Confluence Bar)**, with a member portal and admin console powered by Supabase.

---

## What's Included

### 12 Public Pages
1. **Home** (`index.html`) — Hero, mission, news, events, leadership, CTA
2. **About the Branch** (`pages/about.html`) — History, mission, vision, core values
3. **Branch Leadership** (`pages/leadership.html`) — Chairman's message, past chairmen
4. **Executive Committee** (`pages/executive.html`) — Full 2025–2027 executive team
5. **Practice Areas** (`pages/practice-areas.html`) — 12 areas of legal practice
6. **News & Announcements** (`pages/news.html`) — Branch updates, press releases
7. **Events & Programmes** (`pages/events.html`) — Featured + upcoming events
8. **Gallery** (`pages/gallery.html`) — Filterable image gallery
9. **Publications** (`pages/publications.html`) — Bulletins, reports, journals
10. **Continuing Legal Education** (`pages/cle.html`) — CLE programme calendar
11. **Membership Information** (`pages/membership.html`) — Tiers, benefits, application form
12. **Contact Us** (`pages/contact.html`) + **FAQ** (`pages/faq.html`)

### Member Portal (`portal/`)
- `login.html`, `register.html`, `forgot-password.html`
- `dashboard.html` — Welcome, stats, ID card, events, notices
- `profile.html` — Personal & professional details
- `id-card.html` — Digital membership ID + downloadable certificate
- `dues.html` — Dues payment + history
- `events.html` — Event RSVP & attendance history
- `cle.html` — CLE progress, transcript, course catalogue
- `resources.html` — Document library
- `directory.html` — Member directory with search
- `messages.html` — Messaging center
- `notices.html` — Branch notices
- `support.html` — Help desk / ticketing

### Admin Console (`admin/`)
- `dashboard.html` — Overview, charts, quick actions, system health
- `analytics.html` — Engagement funnel, top pages
- `members.html` — Member management with filters
- `approvals.html` — Application approval workflow
- `payments.html` — Payment tracking & reconciliation
- `events.html` — Event management + creator
- `news.html` — News/blog editor
- `documents.html` — Document upload + repository
- `cle.html` — CLE course management
- `communications.html` — Bulk email/notifications
- `audit.html` — System audit logs
- `reports.html` — Report generators
- `roles.html` — RBAC matrix

---

## Design System

| Token | Value | Use |
|---|---|---|
| Primary (NBA Green) | `#0b5d3b` | Primary, navigation, headers |
| Gold | `#c9a227` | Accent, CTAs, decorative |
| White | `#ffffff` | Background |
| Charcoal | `#2a2f3a` | Body text |
| Off-white | `#f8f9fb` | Section backgrounds |

- **Display font:** Playfair Display (serif) — for headings
- **Body font:** Inter (sans-serif) — for body & UI

---

## Getting Started (Static Hosting)

The platform is **fully static**. You can deploy it to any static host:

### Option 1 — Local Preview
```bash
cd nba-lokoja
python3 -m http.server 8000
# Open http://localhost:8000
```

### Option 2 — Deploy to Static Host
- **Netlify:** drag-and-drop the `nba-lokoja` folder
- **Vercel:** `vercel --prod` from the project folder
- **GitHub Pages:** push to a repo, enable Pages
- **Any cPanel:** upload via FTP

---

## Connecting to Supabase

The site is wired with **placeholder Supabase credentials** and a built-in mock-data fallback so it works out-of-the-box. To connect to your real Supabase project:

### 1. Create a Supabase Project
- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Copy your **Project URL** and **anon public key** from `Settings → API`

### 2. Update Credentials
Open `js/supabase.js` and replace:
```js
const SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  anonKey: 'YOUR-PUBLIC-ANON-KEY'
};
```

### 3. Provision the Database
- In Supabase Dashboard → **SQL Editor**, paste the contents of `supabase/schema.sql` and run it
- This creates all tables, RLS policies, triggers and functions

### 4. Create Storage Buckets
In **Storage** create these buckets:
| Bucket | Visibility | Use |
|---|---|---|
| `documents` | private | Members-only files |
| `publications` | public | Public PDFs |
| `avatars` | public | Member photos |
| `event-covers` | public | Event banners |

### 5. Enable Auth Providers
In **Authentication → Providers**:
- Enable Email (default)
- Optionally enable Google, Microsoft, etc.

### 6. Configure Email Templates
In **Authentication → Email Templates**, customise confirmation and reset emails with NBA Lokoja branding.

---

## Optional Integrations

The codebase has hooks for these — replace the stubs with real API calls:

- **Payment Gateway:** Paystack, Flutterwave, or Stripe (in `portal/dues.html`)
- **Email Automation:** Supabase Edge Functions + Resend / SendGrid
- **SMS Notifications:** Termii (Nigerian SMS gateway)
- **Newsletter:** Mailchimp / ConvertKit

---

## File Structure
```
nba-lokoja/
├── index.html
├── css/
│   ├── style.css           # Main stylesheet
│   └── portal.css          # Portal & dashboard styles
├── js/
│   ├── main.js             # General UI / animations
│   ├── partials.js         # Header & footer injection
│   ├── supabase.js         # Supabase client + helpers
│   ├── portal-shared.js    # Portal sidebar & topbar
│   └── admin-shared.js     # Admin sidebar & topbar
├── pages/                  # 12 public pages
├── portal/                 # Member portal (12 pages)
├── admin/                  # Admin console (13 pages)
└── supabase/
    └── schema.sql          # Database provisioning script
```

---

## Security Highlights

- **Row Level Security (RLS)** policies on every sensitive table
- **`is_admin()` helper function** for role-based checks
- **Separate buckets** for public vs. members-only documents
- **Audit log** captures all admin actions (`audit_logs` table)
- **Auto-trigger** creates member record on auth signup
- **Mock-data fallback** if Supabase keys are not configured (zero-crash dev)

---

## Accessibility & SEO

- Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`)
- Meta descriptions on all pages
- Keyboard-navigable menus
- WCAG-AA color contrast on text
- Responsive breakpoints: 480px, 860px, 1024px
- Cross-browser tested (Chrome, Firefox, Safari, Edge)

---

## Demo Credentials (Mock Mode)

When Supabase credentials are not configured, you can sign in with **any email / any password** and the system will use mock member data (Barr. Adekunle Adebayo). All pages remain fully interactive for review.

---

## License
© 2026 Nigerian Bar Association, Lokoja Branch. All rights reserved.

---

**Built for the Confluence Bar.**

# PROJECT_MAP — Taysir (Quran Academy Management System)

> Living document, verified against the codebase on **Sep 9, 2026**.
> Every feature row in `[FEATURE_MAP]` maps to live code. When you add a
> feature, add a row there *and* to `[OPPORTUNITIES]` if it's not yet built.

---

## [PRODUCT]

**One-liner:** Multi-tenant SaaS that lets online **Quran academies** run their
entire operation — students, groups, sessions, tutor quality, billing, and
WhatsApp-driven communication — from one Arabic RTL web app (PWA).

**Actors (roles / dashboards):**

| Actor | Role | Dashboard prefix | What they care about |
|---|---|---|---|
| SuperAdmin | 0 · Platform owner | `/dashboard/admin/*` | Academy signups (SaaS MRR), tier caps |
| Academy Admin | 1 · The customer | `/dashboard/*` | Everything: students, money in/out, tutor quality, ops |
| Supervisor | 2 · Academy staff | `/dashboard/supervisor/*` | Tutor/class quality, attendance, reports |
| Tutor | 3 · Contractor | `/dashboard/tutor/*` | Own schedule, students, homework, pay, zoom |
| Student / parent | 4 · End user | `/dashboard/student/*` | Classes, homework, grades, recordings, chat |
| Lead | external · prospect | landing → whatsapp | Trial/apply |

---

## [SYSTEM_FLOW]

### Business domain
Multi-tenant academy management. A **SuperAdmin** manages Academies; each
Academy has an **Admin**, **Supervisors**, **Tutors** and **Students**. A
platform **SaaS plan** caps an academy's students/tutors. Academies use
**WhatsApp** (Evolution API) for messaging/leads and **Zoom** for live
sessions. Primary language Arabic, RTL.

### Financial model (current, Subscription-based — verified)
- **SaaS** — `SaasPlan` (name, Dollar/Egyptian price, `maxStudents`,
  `maxTutors`, `billingPeriod`) is attached to an `Academy` with start/end
  dates. This is the platform's MRR.
- **Products** — `Plan`: academy-level top-up products owned by the academy
  (`sessionCount`, `price`, `billingPeriod`, currency).
- **Billing agreements** — `Subscription` is per `GroupStudent` (one per
  enrollment line). A cycle has `price` (authoritative), `billingCycle`,
  `startDate/endDate/nextBillingDate`, `sessionCount` (fallback to plan),
  `status` (0 active, 1 cancelled, 2 expired, 3 pending). Renewals expire the
  old row and create a new one → pricing history preserved.
- **Income** — `Revenue`: student payments/invoices with `status` (pending/
  paid/failed/refunded), `method` (cash/card/bank/online), `dueDate`,
  `channel`, `invoiceUrl`, optional `planId`/`subscriptionId`. `Student.creditBalance`
  is a monetary float used for top-ups/refunds.
- **Outgo** — `Expense` linked to `CostCenter`, optional `Tutor` +
  `salaryMonth` → salaries tab. Reversal = new expense row, never delete.
- **Per-session pricing is frozen at scheduling** — `Session.tutorRate` from
  group's `tutorHourlyRate` (fallback tutor `baseHourlyRate`/`baseGroupHourlyRate`);
  each `SessionParticipant.price` from group `studentSessionPrice` or the
  membership's `customSessionPrice`. `paymentStatus` tracks payment per
  attendance.

### Session lifecycle
Schedule session → pick group (members = participants) → freeze tutor rate +
per-student prices → conflict check → create `Session` + `SessionParticipant[]`
→ tutor marks attendance + writes `SessionReport` (auto-marks tutor present) →
supervisor reviews separately (never overwritten) → cancel/delete refunds /
trial-promotes → WhatsApp reminders (every 30 min) → report/recording reminders
(nightly).

---

## [FEATURE_MAP]

> Legend — **Who** = actors who use it · **Benefit** = why *they* love it ·
> **Business value** = why *we* charge for it · **Refs** = where it lives.
> Based on a full audit: 52 pages, 38 Prisma models, 32 action files,
> cron/worker/wss/pwa/i18n.

### 1 · Platform & go-to-market (SuperAdmin layer)

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| Academy management + SaaS tiers (`SaasPlan`: caps, prices, billing period) | SuperAdmin | One console for all customers | Tier caps force upsells; MRR | `dashboard/admin/academies`, `actions/academy.ts` |
| Public landing + lead capture form | Prospect | Instant signup path | Defines the funnel | `components/landing/*`, `app/[locale]/page.tsx` |
| Lead scoring (A/B/C by teacher count, C auto-rejected) + instant WhatsApp to lead & academy + email to admin | SuperAdmin/Admin | Deals arrive on WhatsApp pre-qualified | No sales team needed to triage | `actions/lead.ts`, `worker/whatsapp.ts` |
| Platform currencies | SuperAdmin | Works across markets | Multi-country SaaS | `actions/currency.ts` |

### 2 · Academy setup & control

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| WhatsApp connect (Evolution API, QR, status, rate-limited queue) | Admin | Own business channel inside the app | WhatsApp = retention backbone | `settings/whatsapp`, `worker/whatsapp.ts`, `lib/queue/whatsappQueue.ts`, `lib/whatsappRateLimiter.ts` |
| Currency catalog + per-academy FX rates → default currency | Admin | One report currency (EGP) while billing Gulf customers (SAR/USD) | Replaces the FX spreadsheet | `settings/currencies`, `actions/currency.ts` |
| Permission toggles (tutors create sessions? edit session time?) + default currency | Admin | "Your rules, your way" | Controls tutor over-leverage | `actions/academySettings.ts` |

### 3 · Student lifecycle (the heart)

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| Add student w/ **username login, no email needed**, live availability check | Admin | Lock in a lead with zero friction | Fewer lost trials at capture | `addStudentDialog.tsx`, `createStudent`, `checkUsername` |
| Pipeline `lead→trial→subscribed→churned/paused` + status history + notes | Admin | Student list works like a CRM | Churn/pause visible → revenue clarity | `actions/student.ts`, `studentProfile/*` |
| Bulk actions (status change / tutor assign / notes) | Admin | 200 students in minutes | Saves the owner hours every month | `bulk*Dialog` + `actions/student.ts` |
| Tutor assignment = private group + direct chat room (swap closes old room) | Admin/Tutor/Student | 1:1 as a first-class product line | Premium tier without extra logic | `assignTutor`, `actions/groups.ts` |
| Billing date override per student | Admin | Aligns invoices to real paydays | Better collections | `actions/student.ts` |

### 4 · Teaching operations (groups + sessions)

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| Groups + membership with auto-created enrollment `Subscription` + price override + group chat | Admin | Class roster + billing in one place | Group = the billing unit | `groups/**`, `actions/groups.ts` |
| Weekly calendar scheduling, group/private mode, **conflict detection**, trial flags, frozen pricing | Admin/Tutor | Predictable timetable, no double-booking | Data for KPIs & pay | `sessions/**`, `actions/sessions.ts` |
| Session Zoom link + **recording link** per session (admin oversight, nightly reminder) | Admin/Tutor/Student | Students review past lessons | Retention + content value | `lib/groups.ts`, `groupSessionsTable.tsx`, cron |
| Attendance (tutor marks, supervisor reviews) | Tutor/Supervisor/Admin | Both sides accountable | Quality + pay data | `lib/session.ts` |
| **Time-extension requests** (tutor asks up to +240 min, admin approves) | Tutor/Admin | Fair handling of overtime | Overtime becomes billable/countable | `timeExtensionRequests/**` |

### 5 · Quality & supervision

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| Tutor auto-attendance vs **supervisor review that is never overwritten** | Supervisor/Admin | Trustworthy conduct record | Quality control = the "why us" story | `tutorAttendance`, `supervisor/*` |
| Per-session reports (rating 1–5 + outcomes/strengths/weaknesses/next goals) | Tutor/Admin | Structure for every lesson | Reusable training data | `sessionReports.ts`, `SessionDetailPanel` |
| Weekly progress reports (+ optional PDF), notified via push + WhatsApp | Tutor/Student/Admin | Parents see progress | Proof of value → renewals | `studentReports/**` |
| Homework: assignment + file, student solution, grading + feedback, notify on both | Tutor/Student | Full homework loop in-app | Less churn from "no follow-up" | `assignments.ts`, `homeworkSolution.ts` |

### 6 · Money (Finance)

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| Revenue invoices + payment status (pending/paid/failed/refunded), method, channel, invoice URL, **weekly WhatsApp summary** | Admin | Cash flow at a glance, on phone | Collections clarity | `finances/revenuesTab`, `actions/finances.ts` |
| Expenses + cost centers (rent/marketing/tools), pending/paid | Admin | True profit picture | The metric SaaS sells on | `finances/expensesTab` |
| **Tutor salaries** — expected vs paid, per month, reversals keep audit trail | Admin | Contractors paid on time | Lower contractor churn; auditors happy | `finances` salaries tab, `payTutor` |
| **Payments engine**: mark paid, monthly student invoice view, allocation across targets, `payStudentMonthly` | Admin | Concrete collection workflow | Directly improves cash in | `actions/finances.ts` |
| KPI suite — LTV, ARPS, quarterly LTGP/ARPPU/CAC/churn, cohort retention, per-plan/per-tutor/per-method revenue, profit per tutor, cost/session | Admin | Sees *which* tutors lose money, *which* plans work | The demo that sells the subscription | `analytics/**`, `actions/finances.ts` get*KPIs |

### 7 · Communication & retention automation

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| Real-time chat: tutor↔student + group, read/delivery, edits ≤15 min, online presence | Tutor/Student/Admin | Everything stays in-app | Keeps owner-tutor-student relationships captive | `chat/**`, `wss/server.ts` |
| Web push notifications (PWA, installable, AR/EN, RTL) | all | Miss nothing while away | Engagement → retention | `notifications.ts`, `PushSubscription` |
| WhatsApp: manual (individual/all, bulk by status), lead templates, **session reminders (30 min), report reminder (8 pm), recording reminder (10 pm), weekly financial summary** | Admin/Tutor/Student | Automated outreach without effort | The #1 reason academies stay subscribed | `lib/cronJobs.ts`, `worker/whatsapp.ts`, `wss` |

### 8 · Platform: roles, exports, i18n

| Feature | Who | User benefit | Business value | Refs |
|---|---|---|---|---|
| 5 roles, JWT auth (username **or** email login), user management, password reset | all | Simple access control | Enterprise trust | `lib/auth.ts`, `actions/auth.ts`, `user-management.ts` |
| CSV exports (students/tutors) + **full 21-sheet Excel academy export** (`pnpm export:academy`) | Admin/Data handover | Full data ownership | Trust + easy onboarding/offboarding | `lib/export.ts`, `scripts/exportAcademyToExcel.ts` |
| History ledger (every mutation audited) | Admin | Full accountability | Audit & dispute resolution | `lib/history.ts` |

---

## [OPPORTUNITIES] — prioritized roadmap

> Priority = business value × reach ÷ effort. ✅ done · 🔲 to build · 🟠 partial.

| # | Opportunity | Value | Effort | Status |
|---|---|---|---|---|
| 1 | **Full Excel academy export** (`scripts/exportAcademyToExcel.ts`) | Data ownership/trust on every new deal | done | ✅ Sep 9 2026 |
| 2 | **Zoom auto-meetings**: OAuth connect UI + auto `createZoomMeeting` on schedule + role-aware join/start links | Differentiator; hides links so students can't poach tutors; matches marketing guide already live | M | 🟠 `lib/zoom.ts` + callback done, UI/fi wiring missing |
| 3 | **Student self-service**: buy top-up plans / pay invoice from student portal (`creditBalance` mostly read-side today) | Direct-to-student revenue, less admin chasing | M | 🔲 |
| 4 | **Automated collections**: overdue/invoice reminders via WhatsApp (only weekly summary exists) | Faster payment, less churn | S–M | 🔲 |
| 5 | **Academy onboarding checklist** for SuperAdmin (whatsapp connect → first class → first salary) | Reduces time-to-value on signups | S | 🔲 |
| 6 | **Academy profit reports** (profit per method/cost center over time) | The headline number owners brag about | M | 🔲 |

---

## [ARCHITECTURE]

```
app/[locale]/dashboard/
  admin/            SuperAdmin: academies, SaaS plans, currencies, leads
  dashboard/        Admin home (overview)
  students/         Students list + profile [id]
  student/          Student's own view
  groups/           Groups list + group detail [id]
  sessions/         Admin sessions (weekly calendar)
  session-management/  Session analysis
  tutors/           Tutors list + profile [id]
  tutor/            Tutor's own area (sessions, zoom, finances, availability)
  plans/            Plan products + detail [id]
  finances/         Finances (Dashboard/Revenues/Expenses/Salaries)
  analytics/        Analytics (global, per student [id], per tutor [id])
  time-extension-requests/
  settings/         personal, security, users, currencies, whatsapp
  chat/             Chat rooms
actions/            Server actions (grouped by domain, "use server", zod + Arabic errors)
components/dashboard/  Feature-based client components
types/              Shared TS types (mirror Prisma payloads)
lib/                db, auth, history, session, balance, cron, zoom, whatsapp, prisma-error, username
worker/, wss/       WhatsApp worker (BullMQ), Socket.IO server (port 3001)
scripts/            exportAcademyToExcel, backfillUsernames, demoSeed
```

**Patterns (reference implementations)**
- Groups list `dashboard/groups/page.tsx` + `actions/groups.ts`
- Students list `dashboard/students/page.tsx` (groupMemberships, creditBalance, `_count.members`)
- Sessions pages + `actions/sessions.ts`
- Finances salaries `finances/page.tsx` + `salariesTab.tsx` + `payTutor`
- Server action convention: authenticated `user()` → zod parse → `db.$transaction` → `lib/history.ts` → `revalidatePath("/ar/dashboard/**")`.
- New-fields pattern (username): nullable `@unique`, server-side `checkUsername` + debounced client availability, P2002 handled via `lib/prisma-error.ts`.

---

## [TECH_STACK]

| Layer | Choice | Locked |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | · |
| Language | TypeScript (strict, no `any`) | · |
| ORM | Prisma (`prisma-client`, output `generated/prisma`) | · |
| Database | PostgreSQL | · |
| Styling | Tailwind CSS + shadcn/ui (radix) | · |
| Validation | zod | · |
| Dates | dayjs | · |
| Charts | recharts | · |
| i18n | next-intl (+ i18next) — Arabic primary, RTL | · |
| Real-time | socket.io + socket.io-client (custom WSS `server.ts`) | · |
| Queue | BullMQ + ioredis (WhatsApp queue) | · |
| Cron | node-cron (`lib/cronJobs.ts`) | · |
| Push | web-push (`PushSubscription`) | · |
| Scripts/Excel | tsx + exceljs (`export:academy`) | · |
| Other | bcrypt, jsonwebtoken, nodemailer, axios, uuid, framer-motion, lucide-react, sonner, react-hook-form | · |

---

## [ORPHANS & PENDING]

> Status legend: ❌ broken · ⚠️ partial · ✅ done.

- ✅ Server actions migrated to Subscription model: `changePlan`, `recordPayment`,
  `renewSubscription`, `resolvePayment` (`actions/student.ts`); finances family
  (`getSubscriptionRetention`, `getPlanEfficiency`, `getRevenueKPIs`,
  `getRenewalSubscriptions`, `createRevenueForSubscription`, `getSalaryData`,
  `payTutor`, `payStudentMonthly`).
- ⚠️ Zoom auto-meetings gap — see `[OPPORTUNITIES]` #2.
- ⚠️ `creditBalance` top-up is read/refund-side only; direct "add credit" +
  student self-service purchase not built (opportunity #3).
- 🟠 Cron reminders reference `zoomUrl` (renamed field) — uses `Session.recordingLink`
  for recording reminder; verify `lib/cronJobs.ts` after any schema change.
- ✅ `scripts/exportAcademyToExcel.ts` is live (rebuilt Sep 9 2026); old artifact
  header layout reproduced with `[object Object]` name-resolution bug fixed.
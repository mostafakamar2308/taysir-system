# PROJECT_MAP — Taysir (Quran Academy Management System)

> Living document. Last updated: Aug 6, 2026.
> Keep `[ORPHANS & PENDING]` in sync as tasks are completed.

---

## [TECH_STACK]

| Layer | Choice | Locked | Latest stable (today) |
|---|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | 16.2.2 | 16.3.0 |
| UI runtime | React | 19.2.3 | 19.2.8 |
| Language | TypeScript (strict, no `any`) | ^5 | — |
| ORM | Prisma 7 (`prisma-client`, output `generated/prisma`) | 7.4.2 | 7.9.1 |
| Database | PostgreSQL | — | — |
| Styling | Tailwind CSS 4 + shadcn/ui (radix) | ^4 | 4.3.3 |
| Validation | zod | 4.3.6 | 4.4.3 |
| Dates | dayjs | 1.11.19 | 1.11.21 |
| Charts | recharts | 3.8.0 | 3.10.1 |
| i18n | next-intl (+ i18next/react-i18next) | 4.8.3 / 25.8.13 | 4.13.5 / 26.3.6 |
| Real-time | socket.io + socket.io-client (custom WSS `server.ts`) | 4.8.3 | — |
| Queue | BullMQ + ioredis (WhatsApp queue) | 5.74.1 / 5.10.1 | — |
| Cron | node-cron (`lib/cronJobs.ts`) | 4.2.1 | — |
| Push | web-push (`PushSubscription`) | 3.6.7 | — |
| Other | bcrypt, jsonwebtoken, nodemailer, axios, uuid, framer-motion, lucide-react, sonner, react-hook-form | — | — |

**Conventions**
- RTL layout, primary language Arabic (`locales/ar.json`, `i18n/`).
- Client components under `components/`; pages under `app/[locale]/dashboard/**`.
- Server actions under `actions/` with `"use server"`, zod + Arabic error messages.
- Prisma client imported via `@/lib/prisma` (or `@/generated/prisma/client` for types).

---

## [SYSTEM_FLOW]

### Business domain
Multi-tenant **Quran Academy Management SaaS** ("Taysir"). A SuperAdmin manages
Academies; each Academy has an Admin, Supervisors, Tutors and Students. A SaaS
subscription (`SaasPlan`) caps an academy's students/tutors. Academies use
WhatsApp (Evolution API) for messaging/leads and Zoom for live sessions.

### Financial model (current, post-migration)
- **Student pricing** — driven by `creditBalance` (monetary float, in the
  student's currency). Students buy standalone `Plan` products (top-ups:
  `sessionCount` + `price`) → `Revenue` record → credit added.
- **Per-session cost** — a `SessionParticipant.price` is **frozen at
  scheduling** from `Group.studentSessionPrice` (or `customSessionPrice`).
  `paymentStatus` (0=unpaid, 1=paid) tracks payment per attendance.
- **Tutor pay** — independent of student pricing. `Session.tutorRate` frozen at
  scheduling from `Group.tutorHourlyRate` (fallback: tutor's
  `baseHourlyRate` private / `baseGroupHourlyRate` group). Paid via
  `Expense` records with `tutorId` + `salaryMonth` (Salaries tab, `payTutor`).
- **Groups** — the unit that carries sessions. `Group.tutorHourlyRate` =
  tutor pay, `Group.studentSessionPrice` = student price, `GroupStudent` may
  override with `customSessionPrice`.
- **Revenue** — general income records (credit top-ups) with `planId` optional.
  `Expense` — outflows incl. tutor salaries.

### Actor journeys
1. **SuperAdmin** — academies, SaaS plans, currencies.
2. **Admin** — students, groups (+ members), sessions (weekly calendar,
   add/edit/cancel), attendance + reports, plans, finances (revenue/expense/
   salaries), analytics, tutors/supervisors, WhatsApp, Zoom, chat.
3. **Supervisor** — sessions, `TutorAttendance` review, group management.
4. **Tutor** — own sessions, groups, zoom link, homework/assignments, reports,
   own finances, chat.
5. **Student** — own dashboard: credit balance, groups, sessions + reports,
   homework uploads, chat.

### Data flow (session lifecycle)
Schedule session → pick group (members = participants) → freeze tutor rate &
per-student prices → create `Session` + `SessionParticipant[]` (price,
paymentStatus=0) → conflict check, trial status promotion (lead→trial) →
attendance + `SessionReport` + `TutorAttendance` → cancel/delete refunds credit.

---

## [ARCHITECTURE]

```
app/[locale]/dashboard/
  admin/            SuperAdmin: academies, currencies, leads, subscriptions (SaaS)
  dashboard/        Admin home (overview)
  students/         Students list + student profile [id]
  student/          Student's own view
  groups/           Groups list + group detail [id]
  sessions/         Admin sessions (weekly calendar)
  session-management/  Session analysis
  tutors/           Tutors list + tutor profile [id]
  tutor/            Tutor's own area (sessions, finances, zoom, layout)
  plans/            Plan (top-up products) list + detail [id]
  finances/         Finances (Dashboard/Revenues/Expenses/Salaries)
  analytics/        Analytics (global, per student [id], per tutor [id])
  settings/         personal, security, users, currencies, whatsapp
  chat/             Chat rooms
actions/            Server actions (grouped by domain)
components/dashboard/  Feature-based client components
types/              Shared TS types (mirror Prisma payloads)
lib/                db, auth, history, session, balance, cron, zoom, whatsapp…
worker/, wss/       WhatsApp worker, Socket.IO server
```

### Patterns (reference implementations — already migrated)
- **Groups list page** `app/[locale]/dashboard/groups/page.tsx` + `actions/groups.ts`
- **Students list page** `app/[locale]/dashboard/students/page.tsx` (uses
  `groupMemberships → group → currentTutor`, `creditBalance`, `_count.members`)
- **Sessions pages** (`sessions`, `tutor/sessions`) + `actions/sessions.ts`
- **Tutor profile** `tutors/[id]` + `tutorProfile/*` (uses `baseHourlyRate`,
  `baseGroupHourlyRate`)
- **Finances salaries** `finances/page.tsx` + `salariesTab.tsx` + `payTutor`
- Server action convention: `user()` (auth) → zod parse → `db.$transaction` →
  history → `revalidatePath("/ar/dashboard/**")`.

---

## [ORPHANS & PENDING]

> Status legend: ❌ broken (references removed fields) · ⚠️ partial/in-progress · ✅ done.

### Old-schema ground truth (removed fields)
`Subscription` model, `SubscriptionStatus`, `Revenue.subscriptionId`,
`Student.tutorId`, `Student.planId`, `Student.currentSubscriptionId`,
`Student.sessionsBalance`, `Student.subscriptions`, `Plan.sessionsPerWeek`,
`SessionParticipant.balanceDeducted`, `Session.zoomJoinUrl/zoomStartUrl`,
`Tutor.privatePricePerHour/groupPricePerHour`, `Tutor.students`.

---

### ❌ Server actions

| File | Lines / fns | Issue |
|---|---|---|
| `actions/student.ts` | ✅ done: `createStudent`, `updateStudent`, `getStudent`, `changeStudentStatus`, `assignTutor`, `bulkAssignTutor`, `bulkChangeStatus`, `bulkAddNote`, `addNote` (private-group membership + `creditBalance`). ❌ still old-schema (studentProfile scope): `changePlan` L611, `recordPayment` L700, `renewSubscription` L783, `resolvePayment` L870 | Subscription + `tutorId`/`planId` on Student + `sessionsBalance` |
| `actions/finances.ts` | `getDashboardAlerts` L66, `getDashboardKPIs` L176, `getQuarterlyKPIs` L283, `getSubscriptionRetention` L554, `getPlanEfficiency` L629, `getRevenueKPIs` L732 (uses `student.tutorId`), `getRenewalSubscriptions` L909, `createRevenueForSubscription` L1039, `updateRevenue` L1110, `getSalaryData` L1433 (revenue-per-tutor via `student.tutorId`), `createRevenueFromDashboard` L1653 | Subscription model + `student.planId`/`currentSubscriptionId` + `sessionsBalance` |
| `actions/plan.ts` | schema L12, create L27, update L48, delete L68, `getPlans` L85–105 | `sessionsPerWeek` → `sessionCount`; `db.subscription.count`; `plan.subscriptions` |
| `actions/sessions.ts` | `balanceDeducted` writes L282/L409; `sessionsBalance` L577/L605; `decrementBalance`/`incrementBalance` L258/L508/L541 | Uses old `lib/balance` + dropped field |
| `actions/tutor.ts` | `createTutor` L90–91 | `privatePricePerHour`/`groupPricePerHour` → `baseHourlyRate`/`baseGroupHourlyRate` |

### ❌ libs

| File | Lines | Issue |
|---|---|---|
| `lib/balance.ts` | whole file | `sessionsBalance` + `plan.sessionsPerWeek*4`. **Needs rewrite to `creditBalance`/`sessionCount`** |
| `lib/cronJobs.ts` | L74, L90 | `session.zoomJoinUrl`/`zoomStartUrl` → `zoomUrl` |
| `lib/history.ts` | L80, L104 | `StudentTutorChange`, `StudentPlanChange` on removed Student fields |
| `lib/export.ts` | ✅ students CSV fixed (creditBalance + groups). ❌ `t.privatePricePerHour` L21 (tutors scope) |

### ❌ Pages

| File | Issue |
|---|---|
| `app/[locale]/dashboard/students/[id]/page.tsx` | `plan`/`subscriptions` includes, `sessionsBalance` |
| `app/[locale]/dashboard/student/page.tsx` | `tutor`/`plan`/`subscriptions` includes, `sessionsPerWeek` |
| `app/[locale]/dashboard/page.tsx` | `s.sessionsBalance` (overview viewer `plans` prop already removed) |
| `app/[locale]/dashboard/plans/[id]/page.tsx` | `plan.subscriptions` + `SubscriptionStatus` |
| `app/[locale]/dashboard/tutor/page.tsx` | `privatePricePerHour`/`groupPricePerHour`, `zoomStartUrl` |
| `app/[locale]/dashboard/analytics/tutors/[id]/page.tsx` | `tutor.students`, `student.tutorId` |
| `app/[locale]/dashboard/tutors/page.tsx` | `studentCount` wrongly = `baseGroupHourlyRate` |
| `app/[locale]/dashboard/sessions/page.tsx` L77, `tutor/sessions/page.tsx` L77 | `balanceDeducted` include |

### ❌ Components

| File | Issue |
|---|---|
| `components/dashboard/students/changeStatusDialog.tsx`, `bulkChangeStatusDialog.tsx` | ✅ rewritten (status + note only, no plan/subscription UI) |
| `components/dashboard/students/editStudentDialog.tsx` | ✅ group memberships + `assignTutor` on tutor change |
| `components/dashboard/dialogs/addStudentDialog.tsx` | ✅ already new-schema (tutors/currencies, `tutorId` → private group) |
| `components/dashboard/students/assignTutorDialog.tsx`, `bulkAssignTutorDialog.tsx` | ✅ already call new `assignTutor`/`bulkAssignTutor` |
| `components/dashboard/students/viewer.tsx`, `bulkActionBar.tsx`, `emptyState.tsx`, `studentCard.tsx`, `studenTable.tsx`, `quickActionsMenu.tsx` | ✅ new-schema (groups, creditBalance); `plans` prop removed everywhere |
| `components/dashboard/studentProfile/billingTab.tsx`, `viewer.tsx`, `changePlanDialog.tsx`, `dialogs/recordPaymentDialog.tsx`, `dialogs/renewSubscriptionDialog.tsx` | subscriptions, `sessionsBalance`, `planId` |
| `components/dashboard/plans/viewer.tsx`, `addPlanDialog.tsx`, `editPlanDialog.tsx`, `planDetailViewer.tsx` | `sessionsPerWeek`, `activeStudents` (from subscriptions) |
| `components/dashboard/finances/revenuesTab.tsx` | renewal-subscription block + `createRevenueForSubscription` |
| `components/dashboard/finances/financialDashboard.tsx` | retention matrix, `activeSubscriptionCount`, renewal alerts |
| `components/dashboard/tutors/viewer.tsx`, `tutorCard.tsx`, `tutorTable.tsx` | `privatePricePerHour`/`groupPricePerHour` |
| `components/dashboard/tutorProfile/profileSettingsTab.tsx` | `privatePricePerHour`/`groupPricePerHour` |
| `components/dashboard/sessions/AddSessionDialog.tsx`, `components/tutor/sessions/AddSessionDialog.tsx` | student `sessionsBalance` low-balance warning |
| `components/dashboard/tutorProfile/paymentsTab.tsx`, `studentsTab.tsx`, `reportsTab.tsx`, `availabilityTab.tsx`, `communicationTab.tsx` | orphaned (not imported by `viewer.tsx`), read old `Tutor` fields |

### ❌ Types (stale / dead)

| File | Issue |
|---|---|
| `types/student.ts` | `GetStudentResult` has `tutor`/`plan` |
| `types/studentProfile.ts` | `sessionsBalance`, `plan`/`planId`, `subscriptions`, `Subscription`, `Plan.sessionsPerWeek` |
| `types/session.ts` | `balanceDeducted` L59, `sessionsBalance` L104 |
| `types/subscription.ts` | **entire file dead** (model removed) |
| `types/history.ts` | `StudentNearEndSubscriptionReminder`, `StudentTutorChange`, `StudentPlanChange`, `{oldTutorId,newTutorId}` |

### ⚠️ In-progress (uncommitted working tree)
37 files modified (2,157 ins / 2,458 del). `actions/sessions.ts`, students pages,
studentProfile, tutorProfile, addStudentDialog are mid-migration and still
contain the ❌ refs listed above. **Run `pnpm lint` / `pnpm build:next` before
committing.**

### 🔲 Missing features (to be built)
- **Add Credit (credit top-up)** — `Student.creditBalance` is only read
  (7 display sites) — no action to add credit, no `Revenue`/`Plan` wiring,
  no deduction when sessions are scheduled.
- **Plan purchase / billing flow** — Plans are standalone products; purchase +
  credit-apply flow not adapted.
- **Academy profit reports** — not done.
- **Cron review** — reminders need `zoomUrl` fix + audit.

---

### ✅ Verified clean (reference code)
`students/page.tsx` (list), `groups/**`, `sessions/page.tsx` (admin calendar),
`session-management/page.tsx`, `analytics/page.tsx`, `finances/page.tsx`,
`tutor/finances/page.tsx`, `salariesTab.tsx`, `expensesTab.tsx`,
`actions/groups.ts`, `actions/tutor/*`, `lib/session.ts`, `types/finances.ts`,
`types/payment.ts`, `components/dashboard/studentProfile/{overviewTab,sessionsTab,attendance*}`.

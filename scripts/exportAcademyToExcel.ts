/**
 * Full academy data export to Excel (21 sheets).
 *
 * Rebuild of the `export:academy` script. Reproduces the sheet layout and
 * headers of `exports/academy-export.xlsx` while fixing an old bug that wrote
 * `[object Object]` into resolved "Name"/"Title" columns (real names now).
 * Sensitive columns are dropped: User.password, Tutor zoom tokens,
 * Academy.whatsappInstanceToken.
 *
 * Run with:  pnpm export:academy            (first academy)
 *            pnpm export:academy 12         (academy by id)
 *            ACADEMY_ID=12 pnpm export:academy
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import db from "@/lib/prisma";

// ---------------------------------------------------------------------------
// English labels (matching the existing export artifact format)
// ---------------------------------------------------------------------------

const ROLE_LABELS = ["SuperAdmin", "Admin", "Supervisor", "Tutor", "Student"];
const STUDENT_STATUS_LABELS = ["Lead", "Trial", "Subscribed", "Churned", "Paused"];
const SUBSCRIPTION_STATUS_LABELS = ["Active", "Cancelled", "Expired", "Pending"];
const PAYMENT_STATUS_LABELS = ["Pending", "Paid", "Failed", "Refunded"];
const PAYMENT_METHOD_LABELS = ["Cash", "Card", "Bank Transfer", "Online"];
const ATTENDANCE_LABELS = ["ATTENDED", "ABSENT_EXCUSED", "ABSENT_UNEXCUSED", "LATE", "CANCELLED"];

const fmtDate = (d: Date | null | undefined): string =>
  d ? d.toISOString().slice(0, 16).replace("T", " ") : "";
const boolStr = (b: boolean): string => (b ? "true" : "false");
const orEmpty = (v: unknown): unknown => (v === null || v === undefined ? "" : v);

interface SheetSpec {
  name: string;
  description: string;
  headers: string[];
  rows: unknown[][];
}

async function collectData(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    include: { defaultCurrency: true, saasPlan: true },
  });
  if (!academy) throw new Error(`Academy ${academyId} not found`);

  const [currencies, costCenters] = await Promise.all([
    db.currency.findMany({ orderBy: { id: "asc" } }),
    db.costCenter.findMany({ orderBy: { id: "asc" } }),
  ]);

  const academyCurrencyRates = await db.academyCurrencyRate.findMany({
    where: { academyId },
    include: { currency: true },
    orderBy: { id: "asc" },
  });

  const [admin, supervisors, tutors, students] = await Promise.all([
    db.admin.findUnique({ where: { academyId }, include: { user: true } }),
    db.supervisor.findMany({
      where: { academyId },
      include: { user: true },
      orderBy: { id: "asc" },
    }),
    db.tutor.findMany({
      where: { academyId },
      include: {
        user: true,
        currency: true,
        specialities: true,
        defaultSupervisor: { include: { user: true } },
      },
      orderBy: { id: "asc" },
    }),
    db.student.findMany({
      where: { academyId },
      include: { user: true, currency: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const tutorSpecialityCounts = new Map<number, number>();
  for (const t of tutors) {
    for (const s of t.specialities) {
      tutorSpecialityCounts.set(s.id, (tutorSpecialityCounts.get(s.id) ?? 0) + 1);
    }
  }
  const specialities = await db.speciality.findMany({ orderBy: { id: "asc" } });

  const [groups, groupStudents, plans, subscriptions] = await Promise.all([
    db.group.findMany({
      where: { academyId },
      include: {
        currentTutor: { include: { user: true } },
        _count: { select: { members: { where: { active: true } } } },
      },
      orderBy: { id: "asc" },
    }),
    db.groupStudent.findMany({
      where: { group: { academyId } },
      include: { group: { select: { title: true } }, student: { include: { user: true } } },
      orderBy: { id: "asc" },
    }),
    db.plan.findMany({ where: { academyId }, orderBy: { id: "asc" } }),
    db.subscription.findMany({
      where: { groupStudent: { group: { academyId } } },
      orderBy: { id: "asc" },
    }),
  ]);

  const [sessions, sessionParticipants, sessionReports, tutorAttendances, revenues, expenses] =
    await Promise.all([
      db.session.findMany({
        where: { academyId },
        include: {
          group: { select: { title: true } },
          tutor: { include: { user: true } },
          supervisor: { include: { user: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { id: "asc" },
      }),
      db.sessionParticipant.findMany({
        where: { session: { academyId } },
        include: { student: { include: { user: true } }, report: { select: { id: true } } },
        orderBy: { id: "asc" },
      }),
      db.sessionReport.findMany({
        where: { participant: { session: { academyId } } },
        orderBy: { id: "asc" },
      }),
      db.tutorAttendance.findMany({
        where: { session: { academyId } },
        include: { supervisor: { include: { user: true } } },
        orderBy: { id: "asc" },
      }),
      db.revenue.findMany({
        where: { academyId },
        include: { student: { include: { user: true } } },
        orderBy: { id: "asc" },
      }),
      db.expense.findMany({
        where: { academyId },
        include: { tutor: { include: { user: true } }, costCenter: true },
        orderBy: { id: "asc" },
      }),
    ]);

  // --- Users sheet (admin, supervisors, tutors, students of this academy) ---

  interface UserRow {
    user: { id: number; email: string | null; password: string; name: string | null; phone: string | null; timezone: string; preferredLanguage: string | null; imageUrl: string | null; createdAt: Date; updatedAt: Date };
    role: number;
  }
  const userRows: UserRow[] = [];
  if (admin) userRows.push({ user: admin.user, role: 1 });
  for (const s of supervisors) userRows.push({ user: s.user, role: 2 });
  for (const t of tutors) userRows.push({ user: t.user, role: 3 });
  for (const s of students) userRows.push({ user: s.user, role: 4 });

  // --- Sheets ---

  const sheets: SheetSpec[] = [];

  sheets.push({
    name: "Currencies",
    description: "Global currency reference (Currency)",
    headers: ["ID", "Code", "Name", "Symbol"],
    rows: currencies.map((c) => [c.id, c.code, c.name, c.symbol]),
  });

  sheets.push({
    name: "CostCenters",
    description: "Expense cost centers (CostCenter)",
    headers: ["ID", "Title"],
    rows: costCenters.map((c) => [c.id, c.title]),
  });

  sheets.push({
    name: "Academy",
    description: "The exported academy (Academy)",
    headers: [
      "ID", "Name", "Max Tutors", "Max Students", "Primary Color",
      "Default Currency ID", "Default Currency Code", "SaaS Plan ID",
      "SaaS Plan Start", "SaaS Plan End", "WhatsApp Instance", "WhatsApp Status",
      "Created At", "Updated At",
    ],
    rows: [
      [
        academy.id, academy.name, academy.maxTutors, academy.maxStudents,
        academy.primaryColor, academy.defaultCurrencyId,
        academy.defaultCurrency?.code ?? "", academy.saasPlanId ?? "",
        fmtDate(academy.saasPlanStartDate), fmtDate(academy.saasPlanEndDate),
        academy.whatsappInstanceName ?? "", academy.whatsappConnectionStatus ?? "",
        fmtDate(academy.createdAt), fmtDate(academy.updatedAt),
      ],
    ],
  });

  sheets.push({
    name: "AcademyCurrencyRates",
    description: "Exchange rates configured per academy (AcademyCurrencyRate)",
    headers: ["ID", "Academy ID", "Currency ID", "Currency Code", "Rate", "Created At", "Updated At"],
    rows: academyCurrencyRates.map((r) => [
      r.id, r.academyId, r.currencyId, r.currency.code, r.rate,
      fmtDate(r.createdAt), fmtDate(r.updatedAt),
    ]),
  });

  sheets.push({
    name: "Specialities",
    description: "Subjects taught in the academy (Speciality)",
    headers: ["ID", "Title", "Tutors Count"],
    rows: specialities.map((s) => [s.id, s.title, tutorSpecialityCounts.get(s.id) ?? 0]),
  });

  sheets.push({
    name: "Users",
    description:
      "User accounts of the academy's admin/supervisors/tutors/students; password column dropped (User)",
    headers: [
      "ID", "Email", "Name", "Role", "Role Label", "Phone", "Timezone",
      "Preferred Language", "Image URL", "Created At", "Updated At",
    ],
    rows: userRows.map(({ user: u, role }) => [
      u.id, u.email ?? "", u.name ?? "", role, ROLE_LABELS[role] ?? String(role),
      u.phone ?? "", u.timezone, u.preferredLanguage ?? "", u.imageUrl ?? "",
      fmtDate(u.createdAt), fmtDate(u.updatedAt),
    ]),
  });

  sheets.push({
    name: "Admins",
    description: "Academy administrators (Admin)",
    headers: ["ID", "User ID", "User Name", "Academy ID", "Created At", "Updated At"],
    rows: admin
      ? [[admin.id, admin.userId, admin.user.name ?? "", admin.academyId, fmtDate(admin.createdAt), fmtDate(admin.updatedAt)]]
      : [],
  });

  sheets.push({
    name: "Supervisors",
    description: "Supervisors reviewing tutors and sessions (Supervisor)",
    headers: ["ID", "User ID", "User Name", "Active", "Academy ID", "Created At", "Updated At"],
    rows: supervisors.map((s) => [
      s.id, s.userId, s.user.name ?? "", boolStr(s.active), s.academyId,
      fmtDate(s.createdAt), fmtDate(s.updatedAt),
    ]),
  });

  sheets.push({
    name: "Tutors",
    description: "Teaching staff; zoom access/refresh tokens dropped (Tutor)",
    headers: [
      "ID", "User ID", "Name", "Academy ID", "Currency ID", "Base Hourly Rate",
      "Base Group Hourly Rate", "Active", "Bio", "Qualifications",
      "Zoom Authenticated", "Zoom URL", "Default Supervisor ID",
      "Default Supervisor Name", "Specialities", "Created At", "Updated At",
    ],
    rows: tutors.map((t) => [
      t.id, t.userId, t.user.name ?? "", t.academyId, t.currencyId,
      t.baseHourlyRate, t.baseGroupHourlyRate, boolStr(t.active ?? false),
      t.bio ?? "", t.qualifications ?? "", boolStr(t.zoomAuthenticated),
      t.zoomUrl ?? "", t.defaultSupervisorId ?? "",
      t.defaultSupervisor?.user.name ?? "", t.specialities.map((s) => s.title).join("، "),
      fmtDate(t.createdAt), fmtDate(t.updatedAt),
    ]),
  });

  sheets.push({
    name: "Students",
    description: "Enrolled students, leads, trials, churned and paused (Student)",
    headers: [
      "ID", "User ID", "Name", "Age", "Country", "Status", "Status Label",
      "Credit Balance", "Source", "Billing Date", "Academy ID", "Currency ID",
      "Created At", "Updated At",
    ],
    rows: students.map((s) => [
      s.id, s.userId, s.user.name ?? "", s.age, s.country ?? "", s.status,
      STUDENT_STATUS_LABELS[s.status] ?? String(s.status), s.creditBalance,
      s.source ?? "", fmtDate(s.billingDate), s.academyId, s.currencyId,
      fmtDate(s.createdAt), fmtDate(s.updatedAt),
    ]),
  });

  sheets.push({
    name: "Groups",
    description: "Class and private groups (Group)",
    headers: [
      "ID", "Title", "Academy ID", "Current Tutor ID", "Current Tutor Name",
      "Tutor Hourly Rate", "Student Session Price", "Active", "Active Members",
      "Created At", "Updated At",
    ],
    rows: groups.map((g) => [
      g.id, g.title, g.academyId, g.currentTutorId, g.currentTutor.user.name ?? "",
      g.tutorHourlyRate ?? "", g.studentSessionPrice ?? "", boolStr(g.active),
      g._count.members, fmtDate(g.createdAt), fmtDate(g.updatedAt),
    ]),
  });

  sheets.push({
    name: "GroupStudents",
    description: "Memberships linking students to groups (GroupStudent)",
    headers: [
      "ID", "Group ID", "Group Title", "Student ID", "Student Name",
      "Custom Session Price", "Joined At", "Left At", "Active", "Created At",
      "Updated At",
    ],
    rows: groupStudents.map((m) => [
      m.id, m.groupId, m.group.title, m.studentId, m.student.user.name ?? "",
      m.customSessionPrice ?? "", fmtDate(m.joinedAt), fmtDate(m.leftAt),
      boolStr(m.active), fmtDate(m.createdAt), fmtDate(m.updatedAt),
    ]),
  });

  sheets.push({
    name: "Plans",
    description: "Standalone subscription products of the academy (Plan)",
    headers: [
      "ID", "Title", "Session Count", "Price", "Billing Period", "Currency ID",
      "Academy ID", "Created At", "Updated At",
    ],
    rows: plans.map((p) => [
      p.id, p.title, p.sessionCount, p.price, p.billingPeriod, p.currencyId,
      p.academyId, fmtDate(p.createdAt), fmtDate(p.updatedAt),
    ]),
  });

  sheets.push({
    name: "Subscriptions",
    description: "Billing agreements per membership, incl. expired history (Subscription)",
    headers: [
      "ID", "GroupStudent ID", "Plan ID", "Price", "Currency ID", "Session Count",
      "Billing Cycle", "Start Date", "End Date", "Next Billing Date", "Status",
      "Status Label", "Created At", "Updated At",
    ],
    rows: subscriptions.map((s) => [
      s.id, s.groupStudentId, s.planId ?? "", s.price, s.currencyId,
      s.sessionCount ?? "", s.billingCycle, fmtDate(s.startDate), fmtDate(s.endDate),
      fmtDate(s.nextBillingDate), s.status,
      SUBSCRIPTION_STATUS_LABELS[s.status] ?? String(s.status),
      fmtDate(s.createdAt), fmtDate(s.updatedAt),
    ]),
  });

  sheets.push({
    name: "Sessions",
    description: "Scheduled/held sessions incl. cancelled and trials (Session)",
    headers: [
      "ID", "Start Time", "Duration Minutes", "Topic", "Notes", "Is Trial",
      "Cancelled By", "Group ID", "Group Title", "Tutor ID", "Tutor Name",
      "Tutor Rate", "Supervisor ID", "Supervisor Name", "Participant Count",
      "Created At", "Updated At",
    ],
    rows: sessions.map((s) => [
      s.id, fmtDate(s.startTime), s.durationMinutes, s.topic ?? "", s.notes ?? "",
      boolStr(s.isTrial), s.cancelledBy ?? "", s.groupId, s.group.title,
      s.tutorId, s.tutor.user.name ?? "", s.tutorRate, s.supervisorId,
      s.supervisor.user.name ?? "", s._count.participants,
      fmtDate(s.createdAt), fmtDate(s.updatedAt),
    ]),
  });

  sheets.push({
    name: "SessionParticipants",
    description: "Per-student attendance and pricing per session (SessionParticipant)",
    headers: [
      "ID", "Session ID", "Student ID", "Student Name", "Attendance Status",
      "Reason", "Price", "Payment Status", "Payment Status Label", "Has Report",
      "Created At", "Updated At",
    ],
    rows: sessionParticipants.map((p) => [
      p.id, p.sessionId, p.studentId, p.student.user.name ?? "",
      p.studentAttendanceStatus === null ? "" :
        (ATTENDANCE_LABELS[p.studentAttendanceStatus] ?? String(p.studentAttendanceStatus)),
      p.reason ?? "", p.price, p.paymentStatus,
      PAYMENT_STATUS_LABELS[p.paymentStatus] ?? String(p.paymentStatus),
      boolStr(!!p.report), fmtDate(p.createdAt), fmtDate(p.updatedAt),
    ]),
  });

  sheets.push({
    name: "SessionReports",
    description: "Post-session student reports (SessionReport)",
    headers: [
      "ID", "Participant ID", "Rating", "Outcomes", "Strengths", "Weaknesses",
      "Next Goals", "Comments", "Details", "Created At", "Updated At",
    ],
    rows: sessionReports.map((r) => [
      r.id, r.participantId, r.rating ?? "", r.outcomes ?? "", r.strengths ?? "",
      r.weaknesses ?? "", r.nextGoals ?? "", r.comments ?? "",
      r.details !== null && typeof r.details === "object"
        ? JSON.stringify(r.details)
        : orEmpty(r.details),
      fmtDate(r.createdAt), fmtDate(r.updatedAt),
    ]),
  });

  sheets.push({
    name: "TutorAttendances",
    description: "Supervisor reviews of tutor session conduct (TutorAttendance)",
    headers: [
      "ID", "Session ID", "Status", "Notes", "Reviewed By", "Reviewed By Name",
      "Reviewed At", "Created At", "Updated At",
    ],
    rows: tutorAttendances.map((a) => [
      a.id, a.sessionId,
      ATTENDANCE_LABELS[a.status] ?? String(a.status), a.notes ?? "",
      a.reviewedBy, a.supervisor.user.name ?? "", fmtDate(a.reviewedAt),
      fmtDate(a.createdAt), fmtDate(a.updatedAt),
    ]),
  });

  sheets.push({
    name: "Revenues",
    description: "Student payments and invoices (Revenue)",
    headers: [
      "ID", "Amount", "Currency ID", "Status", "Status Label", "Method",
      "Method Label", "Due Date", "Description", "Channel", "Notes",
      "Invoice URL", "Academy ID", "Student ID", "Student Name", "Plan ID",
      "Subscription ID", "Recorded By", "Created At", "Updated At",
    ],
    rows: revenues.map((r) => [
      r.id, r.amount, r.currencyId, r.status, PAYMENT_STATUS_LABELS[r.status] ?? String(r.status),
      r.method ?? "", r.method === null ? "" : (PAYMENT_METHOD_LABELS[r.method] ?? String(r.method)),
      fmtDate(r.dueDate), r.description ?? "", r.channel ?? "", r.notes ?? "",
      r.invoiceUrl ?? "", r.academyId, r.studentId, r.student.user.name ?? "",
      r.planId ?? "", r.subscriptionId ?? "", r.recordedBy ?? "",
      fmtDate(r.createdAt), fmtDate(r.updatedAt),
    ]),
  });

  sheets.push({
    name: "Expenses",
    description: "Tutor salaries and operating expenses (Expense)",
    headers: [
      "ID", "Date", "Description", "Amount", "Currency ID", "Method", "Method Label",
      "Status", "Status Label", "Invoice URL", "Notes", "Tutor ID", "Tutor Name",
      "Salary Month", "Academy ID", "Recorded By", "Cost Center ID",
      "Cost Center Title", "Created At", "Updated At",
    ],
    rows: expenses.map((e) => [
      e.id, fmtDate(e.date), e.description, e.amount, e.currencyId,
      e.method ?? "", e.method === null ? "" : (PAYMENT_METHOD_LABELS[e.method] ?? String(e.method)),
      e.status, PAYMENT_STATUS_LABELS[e.status] ?? String(e.status),
      e.invoiceUrl ?? "", e.notes ?? "", e.tutorId ?? "", e.tutor?.user.name ?? "",
      e.salaryMonth ?? "", e.academyId, e.recordedBy ?? "", e.costCenterId ?? "",
      e.costCenter?.title ?? "", fmtDate(e.createdAt), fmtDate(e.updatedAt),
    ]),
  });

  return { academy, sheets };
}

function buildWorkbook(sheets: SheetSpec[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();

  // --- Overview sheet ---
  const overview = wb.addWorksheet("Overview");
  const merged = (text: string, col = 1) => {
    const n = overview.addRow(col === 1 ? [text] : ["", "", text]);
    if (col === 1) {
      overview.mergeCells(n.number, 1, n.number, 3);
    }
  };
  overview.columns = [
    { width: 36 }, { width: 22 }, { width: 58 },
  ];
  merged("Taysir — Academy Data Export");
  overview.addRow([]);
  merged("Academy");
  overview.addRow(["Academy ID", sheets.find((s) => s.name === "Academy")?.rows[0]?.[0] ?? ""]);
  overview.addRow([
    "Max Tutors / Students",
    `${sheets.find((s) => s.name === "Academy")?.rows[0]?.[2] ?? ""} / ${sheets.find((s) => s.name === "Academy")?.rows[0]?.[3] ?? ""}`,
  ]);
  overview.addRow(["Generated At (UTC)", new Date().toISOString().slice(0, 16).replace("T", " ")]);
  overview.addRow(["Source", "Live PostgreSQL dump scoped to this academy"]);
  overview.addRow([
    "Dropped columns",
    "User.password, Tutor.zoomAccessToken, Tutor.zoomRefreshToken, Tutor.zoomTokenExpiry, Tutor.zoomUserId, Academy.whatsappInstanceToken",
  ]);
  overview.addRow([]);
  merged("Sheets");
  overview.addRow(["Sheet", "Description", "Rows"]);
  for (const s of sheets) {
    overview.addRow([s.name, s.description, s.rows.length]);
  }
  overview.addRow([]);
  merged("Linked relations (FK → sheet, plus resolved-name formula columns)");
  const relations = [
    "Academy.Default Currency ID → Currencies.ID",
    "AcademyCurrencyRates.Currency ID → Currencies.ID",
    "Admins/Supervisors/Tutors/Students.User ID → Users.ID",
    "Tutors.Default Supervisor ID → Supervisors.ID",
    "Groups.Current Tutor ID → Tutors.ID",
    "GroupStudents.Group ID / Student ID → Groups.ID / Students.ID",
    "Subscriptions.GroupStudent ID / Plan ID → GroupStudents.ID / Plans.ID",
    "Sessions.Cancelled By / Group / Tutor / Supervisor → Users / Groups / Tutors / Supervisors",
    "SessionParticipants.Session ID / Student ID → Sessions.ID / Students.ID",
    "SessionReports.Participant ID → SessionParticipants.ID",
    "TutorAttendances.Session ID / Reviewed By → Sessions.ID / Supervisors.ID",
    "Revenues.Student / Plan / Subscription / Recorded By → Students / Plans / Subscriptions / Users",
    "Expenses.Tutor / Recorded By / Cost Center → Tutors / Users / CostCenters",
  ];
  for (const line of relations) {
    merged(line, 3);
  }

  // --- Data sheets (bold header row with fill) ---
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name);
    ws.columns = s.headers.map((h) => ({
      header: h,
      width: Math.max(h.length + 2, 12),
    }));
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    };
    for (const row of s.rows) {
      ws.addRow(row);
    }
  }

  return wb;
}

async function main() {
  const argId = Number.parseInt(process.argv[2] ?? "", 10);
  const envId = Number.parseInt(process.env.ACADEMY_ID ?? "", 10);
  const requestedId = Number.isFinite(argId) ? argId : Number.isFinite(envId) ? envId : NaN;

  const academyId = Number.isFinite(requestedId)
    ? requestedId
    : ((await db.academy.findFirst({ orderBy: { id: "asc" }, select: { id: true } }))?.id);

  if (!academyId) throw new Error("No academy found. Pass an academy id or set ACADEMY_ID.");

  const { academy, sheets } = await collectData(academyId);
  const wb = buildWorkbook(sheets);

  const outDir = path.join(process.cwd(), "exports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "academy-export.xlsx");
  await wb.xlsx.writeFile(outFile);

  console.log(`✅ Exported academy "${academy.name}" (id=${academy.id})`);
  for (const s of sheets) {
    console.log(`   ${s.name.padEnd(20)} ${String(s.rows.length).padStart(6)} rows`);
  }
  console.log(`→ ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
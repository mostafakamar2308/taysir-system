export interface Student {
  id: string;
  name: string;
  age: number;
  country: string;
  timezone: string;
  whatsapp: string;
  email: string;
  source:
    | "facebook"
    | "snapchat"
    | "instagram"
    | "tiktok"
    | "referral"
    | "website";
  status: "trial" | "subscribed" | "lead" | "churned" | "paused";
  currentProgram: string;
  startDate: string;
  plan: "free" | "starter" | "pro";
  renewalDate: string;
  tutorName: string;
  createdAt: string;
}

export interface Tutor {
  id: string;
  name: string;
  programs: string[];
  status: "active" | "inactive";
  sessionPrice: number;
  timetable: { day: string; from: string; to: string }[];
  whatsapp: string;
  zoomAuthenticated: boolean;
  timezone: string;
  createdAt: string;
}

export interface Supervisor {
  id: string;
  name: string;
  country: string;
  whatsapp: string;
}

export const students: Student[] = [
  {
    id: "s1",
    name: "أحمد محمد",
    age: 12,
    country: "السعودية",
    timezone: "Asia/Riyadh",
    whatsapp: "+966501234567",
    email: "ahmed@example.com",
    source: "facebook",
    status: "subscribed",
    currentProgram: "تحفيظ القرآن",
    startDate: "2025-09-01",
    plan: "pro",
    renewalDate: "2026-03-01",
    tutorName: "الشيخ عبدالله",
    createdAt: "2025-08-20",
  },
  {
    id: "s2",
    name: "فاطمة علي",
    age: 10,
    country: "الإمارات",
    timezone: "Asia/Dubai",
    whatsapp: "+971501234567",
    email: "fatima@example.com",
    source: "instagram",
    status: "trial",
    currentProgram: "تجويد",
    startDate: "2026-02-15",
    plan: "free",
    renewalDate: "2026-03-15",
    tutorName: "الأستاذة نور",
    createdAt: "2026-02-10",
  },
  {
    id: "s3",
    name: "يوسف خالد",
    age: 14,
    country: "مصر",
    timezone: "Africa/Cairo",
    whatsapp: "+201234567890",
    email: "youssef@example.com",
    source: "referral",
    status: "subscribed",
    currentProgram: "تحفيظ القرآن",
    startDate: "2025-06-01",
    plan: "starter",
    renewalDate: "2026-06-01",
    tutorName: "الشيخ عبدالله",
    createdAt: "2025-05-15",
  },
  {
    id: "s4",
    name: "مريم حسن",
    age: 9,
    country: "الكويت",
    timezone: "Asia/Kuwait",
    whatsapp: "+96512345678",
    email: "mariam@example.com",
    source: "snapchat",
    status: "lead",
    currentProgram: "-",
    startDate: "-",
    plan: "free",
    renewalDate: "-",
    tutorName: "-",
    createdAt: "2026-03-01",
  },
  {
    id: "s5",
    name: "عمر سعيد",
    age: 11,
    country: "قطر",
    timezone: "Asia/Qatar",
    whatsapp: "+97412345678",
    email: "omar@example.com",
    source: "tiktok",
    status: "subscribed",
    currentProgram: "إجازة",
    startDate: "2025-01-10",
    plan: "pro",
    renewalDate: "2026-01-10",
    tutorName: "الشيخ محمود",
    createdAt: "2025-01-05",
  },
  {
    id: "s6",
    name: "ليلى إبراهيم",
    age: 13,
    country: "البحرين",
    timezone: "Asia/Bahrain",
    whatsapp: "+97312345678",
    email: "layla@example.com",
    source: "website",
    status: "paused",
    currentProgram: "تجويد",
    startDate: "2025-11-01",
    plan: "starter",
    renewalDate: "2026-05-01",
    tutorName: "الأستاذة نور",
    createdAt: "2025-10-20",
  },
  {
    id: "s7",
    name: "حسن طارق",
    age: 15,
    country: "الأردن",
    timezone: "Asia/Amman",
    whatsapp: "+96212345678",
    email: "hassan@example.com",
    source: "facebook",
    status: "churned",
    currentProgram: "تحفيظ القرآن",
    startDate: "2025-03-01",
    plan: "pro",
    renewalDate: "2025-09-01",
    tutorName: "الشيخ محمود",
    createdAt: "2025-02-20",
  },
  {
    id: "s8",
    name: "سارة نبيل",
    age: 8,
    country: "السعودية",
    timezone: "Asia/Riyadh",
    whatsapp: "+966509876543",
    email: "sara@example.com",
    source: "instagram",
    status: "trial",
    currentProgram: "تجويد",
    startDate: "2026-03-01",
    plan: "free",
    renewalDate: "2026-03-30",
    tutorName: "الأستاذة نور",
    createdAt: "2026-02-28",
  },

  {
    id: "s9",
    name: "أحمد محمد",
    age: 12,
    country: "السعودية",
    timezone: "Asia/Riyadh",
    whatsapp: "+966501234567",
    email: "ahmed@example.com",
    source: "facebook",
    status: "subscribed",
    currentProgram: "تحفيظ القرآن",
    startDate: "2025-09-01",
    plan: "pro",
    renewalDate: "2026-03-01",
    tutorName: "الشيخ عبدالله",
    createdAt: "2025-08-20",
  },
  {
    id: "s10",
    name: "فاطمة علي",
    age: 10,
    country: "الإمارات",
    timezone: "Asia/Dubai",
    whatsapp: "+971501234567",
    email: "fatima@example.com",
    source: "instagram",
    status: "trial",
    currentProgram: "تجويد",
    startDate: "2026-02-15",
    plan: "free",
    renewalDate: "2026-03-15",
    tutorName: "الأستاذة نور",
    createdAt: "2026-02-10",
  },
  {
    id: "s11",
    name: "يوسف خالد",
    age: 14,
    country: "مصر",
    timezone: "Africa/Cairo",
    whatsapp: "+201234567890",
    email: "youssef@example.com",
    source: "referral",
    status: "subscribed",
    currentProgram: "تحفيظ القرآن",
    startDate: "2025-06-01",
    plan: "starter",
    renewalDate: "2026-06-01",
    tutorName: "الشيخ عبدالله",
    createdAt: "2025-05-15",
  },
  {
    id: "s12",
    name: "مريم حسن",
    age: 9,
    country: "الكويت",
    timezone: "Asia/Kuwait",
    whatsapp: "+96512345678",
    email: "mariam@example.com",
    source: "snapchat",
    status: "lead",
    currentProgram: "-",
    startDate: "-",
    plan: "free",
    renewalDate: "-",
    tutorName: "-",
    createdAt: "2026-03-01",
  },
  {
    id: "s13",
    name: "عمر سعيد",
    age: 11,
    country: "قطر",
    timezone: "Asia/Qatar",
    whatsapp: "+97412345678",
    email: "omar@example.com",
    source: "tiktok",
    status: "subscribed",
    currentProgram: "إجازة",
    startDate: "2025-01-10",
    plan: "pro",
    renewalDate: "2026-01-10",
    tutorName: "الشيخ محمود",
    createdAt: "2025-01-05",
  },
  {
    id: "s14",
    name: "ليلى إبراهيم",
    age: 13,
    country: "البحرين",
    timezone: "Asia/Bahrain",
    whatsapp: "+97312345678",
    email: "layla@example.com",
    source: "website",
    status: "paused",
    currentProgram: "تجويد",
    startDate: "2025-11-01",
    plan: "starter",
    renewalDate: "2026-05-01",
    tutorName: "الأستاذة نور",
    createdAt: "2025-10-20",
  },
  {
    id: "s15",
    name: "حسن طارق",
    age: 15,
    country: "الأردن",
    timezone: "Asia/Amman",
    whatsapp: "+96212345678",
    email: "hassan@example.com",
    source: "facebook",
    status: "churned",
    currentProgram: "تحفيظ القرآن",
    startDate: "2025-03-01",
    plan: "pro",
    renewalDate: "2025-09-01",
    tutorName: "الشيخ محمود",
    createdAt: "2025-02-20",
  },
  {
    id: "s16",
    name: "سارة نبيل",
    age: 8,
    country: "السعودية",
    timezone: "Asia/Riyadh",
    whatsapp: "+966509876543",
    email: "sara@example.com",
    source: "instagram",
    status: "trial",
    currentProgram: "تجويد",
    startDate: "2026-03-01",
    plan: "free",
    renewalDate: "2026-03-30",
    tutorName: "الأستاذة نور",
    createdAt: "2026-02-28",
  },
];

export const tutors: Tutor[] = [
  {
    id: "t1",
    name: "الشيخ عبدالله",
    programs: ["تحفيظ القرآن", "إجازة"],
    status: "active",
    sessionPrice: 50,
    timetable: [
      { day: "السبت", from: "09:00", to: "13:00" },
      { day: "الأحد", from: "09:00", to: "13:00" },
      { day: "الاثنين", from: "09:00", to: "13:00" },
    ],
    whatsapp: "+966551234567",
    zoomAuthenticated: true,
    timezone: "Asia/Riyadh",
    createdAt: "2024-06-01",
  },
  {
    id: "t2",
    name: "الأستاذة نور",
    programs: ["تجويد", "تحفيظ القرآن"],
    status: "active",
    sessionPrice: 45,
    timetable: [
      { day: "السبت", from: "14:00", to: "18:00" },
      { day: "الثلاثاء", from: "14:00", to: "18:00" },
      { day: "الخميس", from: "14:00", to: "18:00" },
    ],
    whatsapp: "+971559876543",
    zoomAuthenticated: true,
    timezone: "Asia/Dubai",
    createdAt: "2024-08-15",
  },
  {
    id: "t3",
    name: "الشيخ محمود",
    programs: ["تحفيظ القرآن", "إجازة", "تجويد"],
    status: "active",
    sessionPrice: 60,
    timetable: [
      { day: "الأحد", from: "10:00", to: "14:00" },
      { day: "الثلاثاء", from: "10:00", to: "14:00" },
    ],
    whatsapp: "+201098765432",
    zoomAuthenticated: false,
    timezone: "Africa/Cairo",
    createdAt: "2025-01-10",
  },
  {
    id: "t4",
    name: "الأستاذ كريم",
    programs: ["تجويد"],
    status: "inactive",
    sessionPrice: 40,
    timetable: [],
    whatsapp: "+96551234567",
    zoomAuthenticated: false,
    timezone: "Asia/Kuwait",
    createdAt: "2025-05-01",
  },
];

export const supervisors: Supervisor[] = [
  {
    id: "sup1",
    name: "خالد العمري",
    country: "السعودية",
    whatsapp: "+966501111111",
  },
  {
    id: "sup2",
    name: "هدى المنصور",
    country: "الإمارات",
    whatsapp: "+971502222222",
  },
  {
    id: "sup3",
    name: "سامي الحسيني",
    country: "مصر",
    whatsapp: "+201033333333",
  },
];

export const sourceLabels: Record<Student["source"], string> = {
  facebook: "فيسبوك",
  snapchat: "سناب شات",
  instagram: "إنستغرام",
  tiktok: "تيك توك",
  referral: "إحالة",
  website: "الموقع",
};

export const statusLabels: Record<Student["status"], string> = {
  trial: "تجربة",
  subscribed: "مشترك",
  lead: "عميل محتمل",
  churned: "منسحب",
  paused: "متوقف",
};

export const statusColors: Record<Student["status"], string> = {
  trial: "bg-blue-100 text-blue-700",
  subscribed: "bg-primary/10 text-primary",
  lead: "bg-amber-100 text-amber-700",
  churned: "bg-destructive/10 text-destructive",
  paused: "bg-muted text-muted-foreground",
};

export const planLabels: Record<Student["plan"], string> = {
  free: "مجاني",
  starter: "أساسي",
  pro: "احترافي",
};

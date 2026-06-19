import { DashboardTutor } from "@/components/dashboard/tutors/viewer";
import { DashboardStudent } from "@/types/student";

export function exportTutorsToCSV(tutors: DashboardTutor[]) {
  const headers = [
    "الاسم",
    "الحالة",
    "التخصصات",
    "سعر الساعة",
    "عدد الطلاب",
    "المنطقة الزمنية",
    "تاريخ الانضمام",
    "البريد الإلكتروني",
    "رقم الهاتف",
  ];

  const rows = tutors.map((t) => [
    t.name,
    t.status ? "نشط" : "غير نشط",
    t.specialities.join("، ") || "-",
    t.privatePricePerHour.toString(),
    t.studentCount.toString(),
    t.timezone,
    new Date(t.createdAt).toLocaleDateString("ar-EG"),
    t.email,
    t.phone,
  ]);

  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tutors.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStudentsToCSV(students: DashboardStudent[]) {
  const headers = [
    "الاسم",
    "العمر",
    "الدولة",
    "الحالة",
    "الخطة",
    "المعلم",
    "البريد",
    "واتساب",
  ];
  const rows = students.map((s) => [
    s.name,
    s.age,
    s.country,
    s.status,
    s.plan || "-",
    s.tutorName,
    s.email,
    s.phone,
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students.csv";
  a.click();
  URL.revokeObjectURL(url);
}

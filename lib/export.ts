import { DashboardStudent } from "@/types/student";

export function exportToCSV(students: DashboardStudent[]) {
  const headers = [
    "الاسم",
    "العمر",
    "الدولة",
    "الحالة",
    "الخطة",
    "المعلم",
    "تاريخ التجديد",
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
    s.renewalDate,
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

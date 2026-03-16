import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { StudentStatus } from "@/types/student";

export const statusLabels: Record<StudentStatus, string> = {
  [StudentStatus.trial]: "تجريبي",
  [StudentStatus.subscribed]: "مشترك",
  [StudentStatus.lead]: "عميل محتمل",
  [StudentStatus.churned]: "منسحب",
  [StudentStatus.paused]: "متوقف",
};

export const statusColors: Record<StudentStatus, string> = {
  [StudentStatus.trial]: "bg-blue-100 text-blue-700",
  [StudentStatus.subscribed]: "bg-green-100 text-green-700",
  [StudentStatus.lead]: "bg-amber-100 text-amber-700",
  [StudentStatus.churned]: "bg-red-100 text-red-700",
  [StudentStatus.paused]: "bg-gray-100 text-gray-700",
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]: "مجدولة",
  [SessionStatus.COMPLETED]: "مكتملة",
  [SessionStatus.CANCELLED]: "ملغاة",
};

export const sessionStatusColors: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  [SessionStatus.COMPLETED]: "bg-primary/10 text-primary",
  [SessionStatus.CANCELLED]: "bg-destructive/10 text-destructive",
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.ATTENDED]: "حاضر",
  [AttendanceStatus.ABSENT_EXCUSED]: "غائب (بعذر)",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "غائب (بدون عذر)",
  [AttendanceStatus.LATE]: "متأخر",
  [AttendanceStatus.CANCELLED]: "ملغى",
};

export const attendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.ATTENDED]: "bg-primary/10 text-primary",
  [AttendanceStatus.ABSENT_EXCUSED]:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "bg-destructive/10 text-destructive",
  [AttendanceStatus.LATE]:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  [AttendanceStatus.CANCELLED]: "bg-muted text-muted-foreground",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "معلق",
  [PaymentStatus.PAID]: "مدفوع",
  [PaymentStatus.FAILED]: "فشل",
  [PaymentStatus.REFUNDED]: "مسترد",
};

export const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  [PaymentStatus.PAID]: "bg-primary/10 text-primary",
  [PaymentStatus.FAILED]: "bg-destructive/10 text-destructive",
  [PaymentStatus.REFUNDED]: "bg-muted text-muted-foreground",
};

export const paymentMethodMap: Record<number, PaymentMethod> = {
  0: PaymentMethod.CASH,
  1: PaymentMethod.CARD,
  2: PaymentMethod.BANK_TRANSFER,
  3: PaymentMethod.ONLINE,
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "نقدي",
  [PaymentMethod.CARD]: "بطاقة",
  [PaymentMethod.BANK_TRANSFER]: "تحويل بنكي",
  [PaymentMethod.ONLINE]: "إلكتروني",
};

export const dayLabels: Record<number, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

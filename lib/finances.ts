import { PaymentMethod, PaymentStatus } from "@/types/payment";

export const paymentStatusLabels: Record<number, string> = {
  [PaymentStatus.PENDING]: "معلق",
  [PaymentStatus.PAID]: "مدفوع",
  [PaymentStatus.FAILED]: "فشل",
  [PaymentStatus.REFUNDED]: "مسترد",
};

export const paymentStatusColors: Record<number, string> = {
  [PaymentStatus.PENDING]: "bg-amber-100 text-amber-700",
  [PaymentStatus.PAID]: "bg-primary/10 text-primary",
  [PaymentStatus.FAILED]: "bg-destructive/10 text-destructive",
  [PaymentStatus.REFUNDED]: "bg-muted text-muted-foreground",
};

export const paymentMethodLabels: Record<number, string> = {
  [PaymentMethod.CASH]: "نقدي",
  [PaymentMethod.CARD]: "بطاقة",
  [PaymentMethod.BANK_TRANSFER]: "تحويل بنكي",
  [PaymentMethod.ONLINE]: "إلكتروني",
};

export const costCenters = [
  "رواتب",
  "إيجار",
  "تسويق",
  "أدوات وبرمجيات",
  "صيانة",
  "متنوعة",
];

export function formatCurrency(amount: number, currency = "SAR"): string {
  return `${amount.toLocaleString("ar-EG")} ${currency === "SAR" ? "ر.س" : currency}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import { getTutorSelfFinances } from "@/actions/tutorFinances";
import FinancesTab from "@/components/dashboard/tutorProfile/financesTab";

export default async function TutorFinancesPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor || !currentUser.tutorId) {
    redirect("/login");
  }
  const tutorId = currentUser.tutorId;

  let finances;
  try {
    finances = await getTutorSelfFinances();
  } catch {
    redirect("/login");
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ماليتي</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مستحقاتي ومدفوعاتي حسب ما يسجله الأكاديمية
        </p>
      </div>
      <FinancesTab
        tutorId={tutorId}
        tutorName={currentUser.name ?? ""}
        data={finances.data}
        isAdmin={false}
      />
    </div>
  );
}

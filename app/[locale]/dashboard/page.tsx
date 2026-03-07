import db from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Eye,
  Users,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

const Page: React.FC = async () => {
  const [
    totalStudents,
    subscribedStudents,
    trialStudents,
    activeTutors,
    totalSupervisors,
    leadStudents,
  ] = await Promise.all([
    db.student.count({ where: { academyId: 5 } }),
    db.student.count({ where: { academyId: 5 } }),
    db.student.count({ where: { academyId: 5 } }),
    db.tutor.count({ where: { active: true, academyId: 5 } }),
    db.supervisor.count({ where: { academyId: 5 } }),
    db.student.count({ where: { academyId: 5 } }),
  ]);

  const stats = [
    {
      label: "إجمالي الطلاب",
      value: totalStudents,
      icon: GraduationCap,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "المشتركين",
      value: subscribedStudents,
      icon: TrendingUp,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "فترة تجريبية",
      value: trialStudents,
      icon: CalendarDays,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "المعلمين النشطين",
      value: activeTutors,
      icon: BookOpen,
      color: "bg-accent text-accent-foreground",
    },
    {
      label: "المشرفين",
      value: totalSupervisors,
      icon: Eye,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "عملاء محتملين",
      value: leadStudents,
      icon: Users,
      color: "bg-gold/10 text-gold",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">لوحة التحكم</h2>
        <p className="text-sm text-muted-foreground mt-1">
          نظرة عامة على أداء الأكاديمية
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Page;

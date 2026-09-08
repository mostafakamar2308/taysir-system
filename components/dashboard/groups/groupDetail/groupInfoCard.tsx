import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, User } from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { GroupDetail } from "@/types/groupDetails";
import Link from "next/link";

interface Props {
  group: GroupDetail;
  readOnly?: boolean;
}

export default function GroupInfoCard({ group, readOnly = false }: Props) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-2xl font-bold">{group.title}</h3>
        <div className="grid grid-cols-2 gap-4 text-base">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>تاريخ الإنشاء: {formatDate(group.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>
              {group.activeStudentCount} / {group.studentCount} طالب نشط
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <User className="h-5 w-5" />
            <span>
              المعلم:
              {readOnly ? (
                <span className="font-medium">{group.tutorName}</span>
              ) : (
                <>
                  <Link
                    href={`/ar/dashboard/tutors/${group.tutorId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {group.tutorName}
                  </Link>
                  <span className="font-medium">
                    {group.effectiveHourlyRate} ج.م/ساعة
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

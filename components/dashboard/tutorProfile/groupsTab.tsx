"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import type { TutorProfile } from "@/types/tutor";
import { formatDate, formatTime } from "@/lib/dates";

interface Props {
  tutor: TutorProfile;
}

export default function GroupsTab({ tutor }: Props) {
  return (
    <div className="space-y-4">
      {tutor.groups.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          لا توجد مجموعات
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutor.groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{g.title}</h3>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/ar/dashboard/groups/${g.id}`}>عرض</a>
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {g.nextSessionDate ? (
                    <p>
                      القادمة: {formatDate(g.nextSessionDate)}{" "}
                      {formatTime(g.nextSessionDate)}
                    </p>
                  ) : (
                    <p>لا توجد حصة قادمة</p>
                  )}
                  {g.latestSessionDate ? (
                    <p>
                      الأخيرة: {formatDate(g.latestSessionDate)}{" "}
                      {formatTime(g.latestSessionDate)}
                    </p>
                  ) : (
                    <p>لا توجد حصة سابقة</p>
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-medium">الطلاب: </span>
                  {g.members.map((m, i) => (
                    <span key={m.id}>
                      <Link
                        href={`/ar/dashboard/students/${m.id}`}
                        className="text-primary hover:underline"
                      >
                        {m.name}
                      </Link>
                      {i < g.members.length - 1 && "، "}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/?text=رسالة جماعية`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageSquare className="h-4 w-4 ml-1" /> واتساب للمجموعة
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

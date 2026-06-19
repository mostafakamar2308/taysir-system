"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck } from "lucide-react";
import { DashboardTutor } from "./viewer";

interface StatsCardsProps {
  tutors: DashboardTutor[];
}

export default function StatsCards({ tutors }: StatsCardsProps) {
  const total = tutors.length;
  const active = tutors.filter((t) => t.active).length;
  const totalStudents = tutors.reduce((sum, t) => sum + t.studentCount, 0);

  const stats = [
    {
      label: "إجمالي المعلمين",
      value: total,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "المعلمين النشطين",
      value: active,
      icon: UserCheck,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "إجمالي الطلاب",
      value: totalStudents,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}
            >
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

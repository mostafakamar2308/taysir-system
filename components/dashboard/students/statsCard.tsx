"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface StatsCardsProps {
  counts: Record<number, number>;
  currentStatusFilter: string;
  onStatusClick: (status: string) => void;
  statusLabels: Record<number, string>;
  statusColors: Record<number, string>;
}

export default function StatsCards({
  counts,
  currentStatusFilter,
  onStatusClick,
  statusLabels,
  statusColors,
}: StatsCardsProps) {

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Object.entries(statusLabels).map(([statusStr, label]) => {
        const status = Number(statusStr);
        const isActive = currentStatusFilter === statusStr;
        return (
          <Card
            key={status}
            className={`border-none shadow-sm cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => onStatusClick(statusStr)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${statusColors[status]}`}
              >
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold text-foreground">
                  {counts[status] || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

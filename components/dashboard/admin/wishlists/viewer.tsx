"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { formatDate } from "@/lib/dates";

interface WaitlistEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  academyName: string;
  academySize: string | null;
  currentMethod: string | null;
  reviewBonus: boolean;
  videoBonus: boolean;
  terms: boolean;
  createdAt: string;
}

interface WaitlistClientProps {
  initialEntries: WaitlistEntry[];
}

export default function WaitlistClient({
  initialEntries,
}: WaitlistClientProps) {
  const [entries] = useState(initialEntries);
  const [search, setSearch] = useState("");
  const [academySizeFilter, setAcademySizeFilter] = useState("all");
  const [currentMethodFilter, setCurrentMethodFilter] = useState("all");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.academyName.toLowerCase().includes(search.toLowerCase());
      const matchesSize =
        academySizeFilter === "all" || e.academySize === academySizeFilter;
      const matchesMethod =
        currentMethodFilter === "all" ||
        e.currentMethod === currentMethodFilter;
      return matchesSearch && matchesSize && matchesMethod;
    });
  }, [entries, search, academySizeFilter, currentMethodFilter]);

  const handleExport = () => {
    const exportData = filtered.map((e) => ({
      "الاسم الكامل": e.fullName,
      "البريد الإلكتروني": e.email,
      "رقم الهاتف": e.phone,
      "اسم الأكاديمية": e.academyName,
      "حجم الأكاديمية": e.academySize || "—",
      "الطريقة الحالية": e.currentMethod || "—",
      مراجعة: e.reviewBonus ? "نعم" : "لا",
      فيديو: e.videoBonus ? "نعم" : "لا",
      "تاريخ التسجيل": formatDate(e.createdAt),
    }));
    const csv = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">قائمة الانتظار</h1>
        <p className="text-muted-foreground">
          إدارة الطلبات المسجلة في قائمة الانتظار
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، البريد، أو اسم الأكاديمية..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select
              value={academySizeFilter}
              onValueChange={setAcademySizeFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="حجم الأكاديمية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="small">صغيرة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="large">كبيرة</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={currentMethodFilter}
              onValueChange={setCurrentMethodFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الطريقة الحالية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="excel">إكسل</SelectItem>
                <SelectItem value="paper">ورقي</SelectItem>
                <SelectItem value="software">برنامج</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 ml-2" /> تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>اسم الأكاديمية</TableHead>
                  <TableHead>الحجم</TableHead>
                  <TableHead>الطريقة الحالية</TableHead>
                  <TableHead>مراجعة</TableHead>
                  <TableHead>فيديو</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد طلبات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.fullName}
                      </TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell dir="ltr">{entry.phone}</TableCell>
                      <TableCell>{entry.academyName}</TableCell>
                      <TableCell>
                        {entry.academySize === "small"
                          ? "صغيرة"
                          : entry.academySize === "medium"
                            ? "متوسطة"
                            : entry.academySize === "large"
                              ? "كبيرة"
                              : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.currentMethod === "excel"
                          ? "إكسل"
                          : entry.currentMethod === "paper"
                            ? "ورقي"
                            : entry.currentMethod === "software"
                              ? "برنامج"
                              : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.reviewBonus ? (
                          <Badge className="bg-green-100 text-green-700">
                            نعم
                          </Badge>
                        ) : (
                          <Badge variant="outline">لا</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.videoBonus ? (
                          <Badge className="bg-green-100 text-green-700">
                            نعم
                          </Badge>
                        ) : (
                          <Badge variant="outline">لا</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

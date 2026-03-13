"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateReport } from "@/actions/report";

interface Report {
  id: number;
  title: string;
  type: string;
  month: string;
  generatedAt: string;
  fileUrl: string | null;
}

interface ReportsClientProps {
  initialReports: Report[];
  academyId: number;
}

const reportTypes = [
  { value: "student_progress", label: "تقرير تقدم الطلاب" },
  { value: "tutor_performance", label: "تقرير أداء المعلمين" },
  { value: "financial", label: "تقرير مالي" },
];

export default function ReportsClient({
  initialReports,
  academyId,
}: ReportsClientProps) {
  const router = useRouter();
  const [reports] = useState(initialReports);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  ); // YYYY-MM
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedType) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نوع التقرير",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("month", selectedMonth);
      formData.append("type", selectedType);
      formData.append("academyId", academyId.toString());

      await generateReport(formData);
      toast({ title: "تم الإنشاء", description: "تم إنشاء التقرير بنجاح" });
      router.refresh(); // re-fetch reports
    } catch (error) {
      console.log({ error });

      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return reportTypes.find((t) => t.value === type)?.label || type;
  };

  const handleDownload = (report: Report) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
    } else {
      toast({
        title: "لا يوجد ملف",
        description: "التقرير لم يتم إنشاؤه بعد",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
        <p className="text-muted-foreground mt-1">
          إنشاء وتحميل التقارير التفصيلية
        </p>
      </div>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إنشاء تقرير جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1">
              <Label>الشهر</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label>نوع التقرير</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">التقارير السابقة</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد تقارير سابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الشهر</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">تحميل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getTypeLabel(report.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.month}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(report.generatedAt).toLocaleDateString(
                          "ar-EG",
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(report)}
                          disabled={!report.fileUrl}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

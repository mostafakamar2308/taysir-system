"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  updateDefaultCurrency,
  updateExchangeRate,
} from "@/actions/academySettings";
import { Coins, Check, X } from "lucide-react";

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number | null;
}

interface CurrenciesClientProps {
  initialCurrencies: Currency[];
  defaultCurrencyId: number | null;
  academyId: number;
}

export default function CurrenciesClient({
  initialCurrencies,
  defaultCurrencyId,
  academyId,
}: CurrenciesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [editingRate, setEditingRate] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [changingDefault, setChangingDefault] = useState(false);
  const [selectedDefaultId, setSelectedDefaultId] = useState(
    defaultCurrencyId?.toString(),
  );

  const defaultCurrency = currencies.find((c) => c.id === defaultCurrencyId);
  const otherCurrencies = currencies.filter((c) => c.id !== defaultCurrencyId);

  const handleUpdateRate = async (currencyId: number) => {
    if (!editValue) return;
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate <= 0) {
      toast({ title: "سعر الصرف غير صالح", variant: "destructive" });
      return;
    }
    try {
      await updateExchangeRate(academyId, currencyId, rate);
      setCurrencies((prev) =>
        prev.map((c) => (c.id === currencyId ? { ...c, rate } : c)),
      );
      toast({ title: "تم تحديث سعر الصرف" });
      setEditingRate(null);
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    }
  };

  const handleChangeDefault = async () => {
    if (!selectedDefaultId) return;
    const newId = parseInt(selectedDefaultId);
    if (newId === defaultCurrencyId) {
      setChangingDefault(false);
      return;
    }
    try {
      await updateDefaultCurrency(academyId, newId);
      toast({ title: "تم تغيير العملة الافتراضية" });
      router.refresh(); // will re-fetch all data
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setChangingDefault(false);
    }
  };

  const formatRate = (rate: number | null) => {
    if (rate === null) return "—";
    return rate.toFixed(4);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5" />
            العملات وأسعار الصرف
          </h1>
          <p className="text-sm text-muted-foreground">
            إدارة العملات المستخدمة في الأكاديمية وتحديد أسعار الصرف (نسبة إلى
            العملة الافتراضية)
          </p>
        </div>
      </div>

      {/* Current Default Currency Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">العملة الافتراضية</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-2xl font-bold">
              {defaultCurrency?.name} ({defaultCurrency?.symbol})
            </p>
            <p className="text-sm text-muted-foreground">
              رمز العملة: {defaultCurrency?.code}
            </p>
          </div>
          <Button variant="outline" onClick={() => setChangingDefault(true)}>
            تغيير العملة الافتراضية
          </Button>
        </CardContent>
      </Card>

      {/* Exchange Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">أسعار الصرف</CardTitle>
          <p className="text-sm text-muted-foreground">
            سعر الصرف يعبر عن قيمة 1 وحدة من العملة الأخرى مقارنة بالعملة
            الافتراضية.
            <br />
            مثال: إذا كانت العملة الافتراضية ريال سعودي، وسعر صرف الدولار 0.27،
            فهذا يعني أن 1 دولار = 0.27 ريال.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العملة</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>سعر الصرف</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherCurrencies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>
                    {editingRate === c.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.0001"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-28"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateRate(c.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingRate(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-mono">{formatRate(c.rate)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRate(c.id);
                        setEditValue(c.rate?.toString() || "");
                      }}
                    >
                      {c.rate === null ? "إضافة سعر" : "تعديل"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Change Default Currency Dialog */}
      <Dialog open={changingDefault} onOpenChange={setChangingDefault}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير العملة الافتراضية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اختر العملة الجديدة</Label>
              <Select
                value={selectedDefaultId}
                onValueChange={setSelectedDefaultId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              سيتم اعتماد هذه العملة كمرجع لجميع العمليات المالية في الأكاديمية.
              سيتم تحديث أسعار الصرف للعملات الأخرى تلقائياً بناءً على السعر
              الافتراضي الجديد.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangingDefault(false)}>
              إلغاء
            </Button>
            <Button onClick={handleChangeDefault}>تأكيد التغيير</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

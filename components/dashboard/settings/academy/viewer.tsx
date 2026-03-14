"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Coins } from "lucide-react";
import {
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from "@/actions/currency";

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

interface CurrenciesClientProps {
  initialCurrencies: Currency[];
}

export default function CurrenciesClient({
  initialCurrencies,
}: CurrenciesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currencies] = useState(initialCurrencies);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formSymbol, setFormSymbol] = useState("");
  const [formExchangeRate, setFormExchangeRate] = useState("1");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setFormCode("");
    setFormName("");
    setFormSymbol("");
    setFormExchangeRate("1");
    setFormIsDefault(false);
    setDialogOpen(true);
  };

  const openEdit = (currency: Currency) => {
    setEditing(currency);
    setFormCode(currency.code);
    setFormName(currency.name);
    setFormSymbol(currency.symbol);
    setFormExchangeRate(String(currency.exchangeRate));
    setFormIsDefault(currency.isDefault);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCode || !formName || !formSymbol || !formExchangeRate) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("code", formCode);
      formData.append("name", formName);
      formData.append("symbol", formSymbol);
      formData.append("exchangeRate", formExchangeRate);
      formData.append("isDefault", String(formIsDefault));

      if (editing) {
        await updateCurrency(editing.id, formData);
        toast({ title: "تم تحديث العملة" });
      } else {
        await createCurrency(formData);
        toast({ title: "تمت إضافة العملة" });
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCurrency(id);
      toast({ title: "تم حذف العملة", variant: "destructive" });
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5" />
            إدارة العملات
          </h1>
          <p className="text-sm text-muted-foreground">
            إضافة وتعديل العملات المستخدمة في الأكاديمية
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة عملة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرمز</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>سعر الصرف</TableHead>
                <TableHead>افتراضي</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا توجد عملات بعد
                  </TableCell>
                </TableRow>
              ) : (
                currencies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.symbol}</TableCell>
                    <TableCell>{c.exchangeRate}</TableCell>
                    <TableCell>
                      {c.isDefault && (
                        <Badge className="bg-primary/10 text-primary">
                          افتراضي
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف العملة</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف &quot;{c.name}&quot;؟ لا
                                يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(c.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل عملة" : "إضافة عملة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رمز العملة *</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  maxLength={3}
                  className="uppercase"
                  placeholder="USD"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="دولار أمريكي"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الرمز *</Label>
                <Input
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  placeholder="$"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>سعر الصرف *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formExchangeRate}
                  onChange={(e) => setFormExchangeRate(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="default"
                checked={formIsDefault}
                onCheckedChange={(v) => setFormIsDefault(v === true)}
              />
              <Label
                htmlFor="default"
                className="text-sm font-normal cursor-pointer"
              >
                تعيين كعملة افتراضية
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "جاري الحفظ..." : editing ? "حفظ التغييرات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from "@/actions/currency";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CurrenciesClientProps {
  initialCurrencies: Currency[];
}

export default function CurrenciesClient({
  initialCurrencies,
}: CurrenciesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingCurrency(null);
    setFormData({ code: "", name: "", symbol: "" });
    setDialogOpen(true);
  };

  const openEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.symbol) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (editingCurrency) {
        await updateCurrency(editingCurrency.id, formData);
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteCurrency(deleteId);
      toast({ title: "تم حذف العملة" });
      setDeleteId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة العملات</h1>
          <p className="text-muted-foreground">
            إدارة العملات المتاحة لجميع الأكاديميات
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 ml-2" /> إضافة عملة
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالرمز أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
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
                  <TableHead>الرمز</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الرمز</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد عملات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.symbol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingCurrency ? "تعديل عملة" : "إضافة عملة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الرمز (ISO)</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="مثال: USD"
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: دولار أمريكي"
              />
            </div>
            <div className="space-y-2">
              <Label>الرمز (مثل $, ﷼, ج.م)</Label>
              <Input
                value={formData.symbol}
                onChange={(e) =>
                  setFormData({ ...formData, symbol: e.target.value })
                }
                placeholder="مثال: $"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "جاري الحفظ..." : editingCurrency ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه العملة؟ قد تؤثر على الأكاديميات التي
              تستخدمها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

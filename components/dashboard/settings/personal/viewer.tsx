"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Camera, Lock, Save } from "lucide-react";
import { updateProfile } from "@/actions/user";

// Options (could be moved to a shared file)
const timezoneOptions = [
  { value: "Africa/Cairo", label: "القاهرة" },
  { value: "Asia/Riyadh", label: "الرياض" },
  { value: "Asia/Dubai", label: "دبي" },
  { value: "Asia/Kuwait", label: "الكويت" },
  { value: "Asia/Amman", label: "عمان" },
];

const languageOptions = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

const roleLabels: Record<number, string> = {
  0: "مدير عام",
  1: "مدير أكاديمية",
  2: "مشرف",
  3: "معلم",
};

const roleBadgeColors: Record<number, string> = {
  0: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  3: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  timezone: string;
  preferredLanguage: string;
  role: number;
}

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [timezone, setTimezone] = useState(user.timezone);
  const [language, setLanguage] = useState(user.preferredLanguage);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("timezone", timezone);
      formData.append("preferredLanguage", language);

      await updateProfile(formData);
      toast({ title: "تم الحفظ", description: "تم تحديث الملف الشخصي بنجاح" });
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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 left-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={roleBadgeColors[user.role]}>
              {roleLabels[user.role]}
            </Badge>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            المعلومات الشخصية
          </CardTitle>
          <CardDescription>تعديل بيانات حسابك الشخصي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                value={user.email}
                disabled
                dir="ltr"
                className="text-left bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                لا يمكن تغيير البريد الإلكتروني من هنا
              </p>
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="text-left"
                placeholder="+966..."
              />
            </div>
            <div className="space-y-2">
              <Label>المنطقة الزمنية</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اللغة المفضلة</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security link */}
      <Card>
        <CardContent className="p-4">
          <Link
            href="/ar/dashboard/settings/security"
            className="flex items-center justify-between hover:bg-accent/50 -m-1 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">تغيير كلمة المرور</p>
                <p className="text-xs text-muted-foreground">
                  إدارة أمان حسابك
                </p>
              </div>
            </div>
            <span className="text-muted-foreground">←</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

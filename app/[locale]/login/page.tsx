"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LogIn, AlertCircle } from "lucide-react";
import { login } from "@/actions/auth";

const demoCredentials = [
  {
    email: "superadmin@example.com",
    password: "password123",
    role: "مدير عام",
  },
  {
    email: "admin1@example.com",
    password: "password123",
    role: "مدير أكاديمية",
  },
  { email: "akram@gmail.com", password: "default123", role: "معلم" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("remember", String(remember));

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl mx-auto">
            ت
          </div>
          <h1 className="text-2xl font-bold text-foreground">نظام التيسير</h1>
          <p className="text-muted-foreground text-sm">
            تسجيل الدخول إلى لوحة التحكم
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center">تسجيل الدخول</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@academy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  تذكرني
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading}
              >
                <LogIn className="h-4 w-4" />
                {isLoading ? "جاري التسجيل..." : "دخول"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              بيانات تجريبية:
            </p>
            <div className="space-y-1.5">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                  }}
                  className="flex items-center justify-between w-full text-xs p-1.5 rounded hover:bg-accent transition-colors"
                >
                  <span className="font-mono text-muted-foreground">
                    {cred.email}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {cred.role}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

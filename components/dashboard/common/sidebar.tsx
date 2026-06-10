"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation"; // i18n‑aware router for locale switching
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, LogOut, UserCog, Globe } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth";
import { Role } from "@/types/user";
import {
  Sidebar as BaseSidebar,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import SidebarContent from "@/components/dashboard/common/sidebarContent";
import logo from "@/assets/logo-transparent.png";

export default function Sidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Sidebar");

  if (!user) return null;

  const locale = pathname.split("/")[1] || "ar";
  const otherLocale = locale === "ar" ? "en" : "ar";

  const getRolePlatformLabel = () => {
    if (user.role === Role.SuperAdmin) return t("superAdminPlatform");
    if (user.role === Role.Admin) return t("adminPlatform");
    if (user.role === Role.Tutor) return t("tutorPlatform");
    return t("defaultPlatform");
  };

  const getRoleLabel = () => {
    if (user.role === Role.SuperAdmin) return t("roleSuperAdmin");
    if (user.role === Role.Admin) return t("roleAdmin");
    if (user.role === Role.Tutor) return t("roleTutor");
    if (user.role === Role.Supervisor) return t("roleSupervisor");
    return t("roleUser");
  };

  console.log(pathname, pathname.split("/"), locale, otherLocale);
  const switchLanguage = () => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(pathWithoutLocale, { locale: otherLocale });
  };

  return (
    <BaseSidebar
      className="w-60 bg-white hidden md:block"
      collapsible="icon"
      side={locale === "ar" ? "right" : "left"}
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="logo" width={40} height={40} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-foreground leading-tight">
                {t("appName")}
              </span>
              <span className="text-xs text-muted-foreground">
                {getRolePlatformLabel()}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent />

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent transition-colors outline-none">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium text-right text-sidebar-foreground truncate w-full">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel()}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() =>
                (window.location.href = `/${locale}/dashboard/settings/personal`)
              }
            >
              <UserCog className="h-4 w-4" />
              <span>{t("accountSettings")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={switchLanguage}
            >
              <Globe className="h-4 w-4" />
              <span>
                {locale === "ar" ? t("switchToEnglish") : t("switchToArabic")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </BaseSidebar>
  );
}

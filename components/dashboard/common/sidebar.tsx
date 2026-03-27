"use client";

import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  BarChart3,
  Clock,
  LayoutDashboard,
  UserCog,
  LogOut,
  Users,
  Shield,
  Coins,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth";
import { Role } from "@/types/user";

const getSidebarGroups = (role: number) => {
  // SuperAdmin
  if (role === Role.SuperAdmin) {
    return [
      {
        label: "الرئيسية",
        items: [
          {
            title: "لوحة التحكم",
            url: "/admin/dashboard",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: "الإدارة",
        items: [
          { title: "الأكاديميات", url: "/admin/academies", icon: Shield },
          { title: "المستخدمين", url: "/admin/users", icon: Users },
          { title: "إعدادات المنصة", url: "/admin/settings", icon: UserCog },
        ],
      },
    ];
  }

  // Academy Admin
  if (role === Role.Admin) {
    return [
      {
        label: "الرئيسية",
        items: [
          { title: "لوحة التحكم", url: "/ar/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        label: "المستخدمين",
        items: [
          {
            title: "الطلاب",
            url: "/ar/dashboard/students",
            icon: GraduationCap,
          },
          { title: "المعلمين", url: "/ar/dashboard/tutors", icon: BookOpen },
        ],
      },
      {
        label: "المالية",
        items: [
          {
            title: "الماليات",
            url: "/ar/dashboard/finances",
            icon: TrendingUp,
          },
          { title: "الخطط", url: "/ar/dashboard/plans", icon: BookOpen },
          {
            title: "العملات وأسعار الصرف",
            url: "/ar/dashboard/settings/currencies",
            icon: Coins,
          },
        ],
      },
      {
        label: "الحصص ومؤشرات الأداء",
        items: [
          { title: "الجداول", url: "/ar/dashboard/sessions", icon: Clock },
          {
            title: "مؤشرات الأداء",
            url: "/ar/dashboard/analytics",
            icon: BarChart3,
          },
        ],
      },
      {
        label: "الإعدادات",
        items: [
          {
            title: "إعدادات شخصية",
            url: "/ar/dashboard/settings/personal",
            icon: UserCog,
          },
          {
            title: "إعدادات الأمان",
            url: "/ar/dashboard/settings/security",
            icon: Shield,
          },
          {
            title: "إدارة المستخدمين",
            url: "/ar/dashboard/settings/users",
            icon: Users,
          },
        ],
      },
    ];
  }

  // Tutor
  if (role === Role.Tutor) {
    return [
      {
        label: "الرئيسية",
        items: [
          {
            title: "لوحة التحكم",
            url: "/ar/dashboard/tutor",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: "الحصص",
        items: [
          {
            title: "جدول الحصص",
            url: "/ar/dashboard/tutor/sessions",
            icon: Calendar,
          },
        ],
      },
      {
        label: "الطلاب",
        items: [
          {
            title: "طلابي",
            url: "/ar/dashboard/tutor/students",
            icon: GraduationCap,
          },
        ],
      },
      {
        label: "المالية",
        items: [
          {
            title: "أرباحي",
            url: "/ar/dashboard/tutor/finances",
            icon: DollarSign,
          },
        ],
      },
      {
        label: "الإعدادات",
        items: [
          {
            title: "ملفي الشخصي",
            url: "/ar/dashboard/settings/personal",
            icon: User,
          },
          {
            title: "إعدادات الأمان",
            url: "/ar/dashboard/settings/security",
            icon: Shield,
          },
        ],
      },
    ];
  }

  return [
    {
      label: "الرئيسية",
      items: [
        { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
      ],
    },
  ];
};

export default function Sidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => currentPath === path;
  const sidebarGroups = user ? getSidebarGroups(user.role) : [];

  if (!user) return null;

  // Role-specific labels for the header
  const getRoleLabel = () => {
    if (user.role === Role.SuperAdmin) return "الإدارة العامة";
    if (user.role === Role.Admin) return "إدارة الأكاديمية";
    if (user.role === Role.Tutor) return "منصة المعلمين";
    return "نظام التيسير";
  };

  return (
    <BaseSidebar className="w-60 bg-white" collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            ت
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-foreground leading-tight">
                نظام التيسير
              </span>
              <span className="text-xs text-muted-foreground">
                {getRoleLabel()}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {sidebarGroups.map((group) => {
          const groupActive = group.items.some((i) => isActive(i.url));
          return (
            <Collapsible key={group.label} defaultOpen={groupActive}>
              <SidebarGroup>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  {!collapsed && <span>{group.label}</span>}
                  {!collapsed && (
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 data-[state=open]:rotate-180" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.url)}
                            className="h-10"
                          >
                            <NavLink
                              href={item.url}
                              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-[0.9rem] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              activeClassName="bg-primary/10 text-primary font-medium"
                            >
                              <item.icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      {/* User section at bottom */}
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
                      {user.role === Role.SuperAdmin
                        ? "مدير عام"
                        : user.role === Role.Admin
                          ? "مدير أكاديمية"
                          : user.role === Role.Tutor
                            ? "معلم"
                            : user.role === Role.Supervisor
                              ? "مشرف"
                              : "مستخدم"}
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
              onClick={() => {
                if (user.role === Role.SuperAdmin) {
                  window.location.href = "/admin/settings/profile";
                } else if (user.role === Role.Admin) {
                  window.location.href = "/ar/dashboard/settings/personal";
                } else {
                  window.location.href = "/tutor/profile";
                }
              }}
            >
              <UserCog className="h-4 w-4" />
              <span>إعدادات الحساب</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </BaseSidebar>
  );
}

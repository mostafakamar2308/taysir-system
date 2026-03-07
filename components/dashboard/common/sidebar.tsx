"use client";
import {
  GraduationCap,
  Eye,
  BookOpen,
  TrendingUp,
  Banknote,
  BarChart3,
  Clock,
  LayoutDashboard,
  UserCog,
  Cog,
  LogOut,
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

const sidebarGroups = [
  {
    label: "الرئيسية",
    items: [
      { title: "لوحة التحكم", url: "/ar/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "المستخدمين",
    items: [
      { title: "الطلاب", url: "/ar/dashboard/students", icon: GraduationCap },
      { title: "المعلمين", url: "/ar/dashboard/tutors", icon: BookOpen },
      { title: "المشرفين", url: "/ar/dashboard/supervisors", icon: Eye },
    ],
  },
  {
    label: "المالية",
    items: [
      { title: "الإيرادات", url: "/ar/dashboard/revenues", icon: TrendingUp },
      { title: "المصروفات", url: "/ar/dashboard/expenses", icon: Banknote },
    ],
  },
  {
    label: "الحصص",
    items: [
      { title: "البرامج", url: "/ar/dashboard/programs", icon: BookOpen },
      { title: "الأداء", url: "/ar/dashboard/performance", icon: BarChart3 },
      { title: "الجداول", url: "/ar/dashboard/timetables", icon: Clock },
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
        title: "إعدادات المنصة",
        url: "/ar/dashboard/settings/platform",
        icon: Cog,
      },
    ],
  },
];

const currentUser = {
  name: "أحمد المدير",
  role: "مدير",
  email: "ahmed@altayseer.com",
};

const Sidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = usePathname();

  const isActive = (path: string) => currentPath === path;

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
                إدارة الأكاديميات
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
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium text-right text-sidebar-foreground truncate w-full">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <UserCog className="h-4 w-4" />
              <span>إعدادات الحساب</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </BaseSidebar>
  );
};

export default Sidebar;

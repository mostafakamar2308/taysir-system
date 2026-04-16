import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  BarChart3,
  Clock,
  LayoutDashboard,
  UserCog,
  Users,
  Shield,
  Coins,
  Calendar,
  DollarSign,
  User,
  Users2,
  Phone,
} from "lucide-react";
import { Role } from "@/types/user";

export const getSidebarGroups = (role: number) => {
  if (role === Role.SuperAdmin) {
    return [
      {
        label: "الرئيسية",
        items: [
          {
            title: "لوحة التحكم",
            url: "/ar/dashboard/admin/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "قائمة الانتظار",
            url: "/ar/dashboard/admin/wishlists",
            icon: Users2,
          },
        ],
      },
      {
        label: "الإدارة",
        items: [
          {
            title: "الأكاديميات",
            url: "/ar/dashboard/admin/academies",
            icon: Shield,
          },
          {
            title: "الاشتراكات",
            url: "/ar/dashboard/admin/subscriptions",
            icon: Users,
          },
          {
            title: "إعدادات العملات",
            url: "/ar/dashboard/admin/currencies",
            icon: DollarSign,
          },
        ],
      },
    ];
  }

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
            title: "إعدادات الواتس اب",
            url: "/ar/dashboard/settings/whatsapp",
            icon: Phone,
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
        { title: "لوحة التحكم", url: "/ar/dashboard", icon: LayoutDashboard },
      ],
    },
  ];
};

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
  Video,
  MessageSquare,
} from "lucide-react";
import { Role } from "@/types/user";

export const getSidebarGroups = (role: number, locale: string = "ar") => {
  if (role === Role.SuperAdmin) {
    return [
      {
        labelKey: "groups.main",
        items: [
          {
            titleKey: "items.dashboard",
            url: `/${locale}/dashboard/admin/dashboard`,
            icon: LayoutDashboard,
          },
          {
            titleKey: "items.wishlists",
            url: `/${locale}/dashboard/admin/wishlists`,
            icon: Users2,
          },
        ],
      },
      {
        labelKey: "groups.administration",
        items: [
          {
            titleKey: "items.academies",
            url: `/${locale}/dashboard/admin/academies`,
            icon: Shield,
          },
          {
            titleKey: "items.subscriptions",
            url: `/${locale}/dashboard/admin/subscriptions`,
            icon: Users,
          },
          {
            titleKey: "items.currencySettings",
            url: `/${locale}/dashboard/admin/currencies`,
            icon: DollarSign,
          },
        ],
      },
    ];
  }

  if (role === Role.Admin) {
    return [
      {
        labelKey: "groups.main",
        items: [
          {
            titleKey: "items.dashboard",
            url: `/${locale}/dashboard`,
            icon: LayoutDashboard,
          },
          {
            titleKey: "items.chat",
            url: `/${locale}/dashboard/chat`,
            icon: MessageSquare,
          },
        ],
      },
      {
        labelKey: "groups.users",
        items: [
          {
            titleKey: "items.students",
            url: `/${locale}/dashboard/students`,
            icon: GraduationCap,
          },
          {
            titleKey: "items.tutors",
            url: `/${locale}/dashboard/tutors`,
            icon: BookOpen,
          },
        ],
      },
      {
        labelKey: "groups.finance",
        items: [
          {
            titleKey: "items.finances",
            url: `/${locale}/dashboard/finances`,
            icon: TrendingUp,
          },
          {
            titleKey: "items.plans",
            url: `/${locale}/dashboard/plans`,
            icon: BookOpen,
          },
          {
            titleKey: "items.currencies",
            url: `/${locale}/dashboard/settings/currencies`,
            icon: Coins,
          },
        ],
      },
      {
        labelKey: "groups.sessionsAndKpis",
        items: [
          {
            titleKey: "items.sessionManagement",
            url: `/${locale}/dashboard/session-management`,
            icon: Clock,
          },
          {
            titleKey: "items.schedules",
            url: `/${locale}/dashboard/sessions`,
            icon: Clock,
          },
          {
            titleKey: "items.kpis",
            url: `/${locale}/dashboard/analytics`,
            icon: BarChart3,
          },
        ],
      },
      {
        labelKey: "groups.settings",
        items: [
          {
            titleKey: "items.personalSettings",
            url: `/${locale}/dashboard/settings/personal`,
            icon: UserCog,
          },
          {
            titleKey: "items.whatsappSettings",
            url: `/${locale}/dashboard/settings/whatsapp`,
            icon: Phone,
          },
          {
            titleKey: "items.securitySettings",
            url: `/${locale}/dashboard/settings/security`,
            icon: Shield,
          },
          {
            titleKey: "items.userManagement",
            url: `/${locale}/dashboard/settings/users`,
            icon: Users,
          },
        ],
      },
    ];
  }

  if (role === Role.Tutor) {
    return [
      {
        labelKey: "groups.main",
        items: [
          {
            titleKey: "items.dashboard",
            url: `/${locale}/dashboard/tutor`,
            icon: LayoutDashboard,
          },
          {
            titleKey: "items.chat",
            url: `/${locale}/dashboard/chat`,
            icon: MessageSquare,
          },
        ],
      },
      {
        labelKey: "groups.sessions",
        items: [
          {
            titleKey: "items.sessionSchedule",
            url: `/${locale}/dashboard/tutor/sessions`,
            icon: Calendar,
          },
        ],
      },
      {
        labelKey: "groups.finance",
        items: [
          {
            titleKey: "items.myEarnings",
            url: `/${locale}/dashboard/tutor/finances`,
            icon: DollarSign,
          },
        ],
      },
      {
        labelKey: "groups.settings",
        items: [
          {
            titleKey: "items.myProfile",
            url: `/${locale}/dashboard/settings/personal`,
            icon: User,
          },
          {
            titleKey: "items.zoomSettings",
            url: `/${locale}/dashboard/tutor/zoom`,
            icon: Video,
          },
          {
            titleKey: "items.securitySettings",
            url: `/${locale}/dashboard/settings/security`,
            icon: Shield,
          },
        ],
      },
    ];
  }

  // Default for unknown roles
  return [
    {
      labelKey: "groups.main",
      items: [
        {
          titleKey: "items.dashboard",
          url: `/${locale}/dashboard/student`,
          icon: LayoutDashboard,
        },
        {
          titleKey: "items.chat",
          url: `/${locale}/dashboard/chat`,
          icon: MessageSquare,
        },
      ],
    },
  ];
};

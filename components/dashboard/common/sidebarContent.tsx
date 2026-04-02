"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/NavLink";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth";
import { getSidebarGroups } from "@/lib/routes";

interface SidebarContentProps {
  onItemClick?: () => void;
}

export default function SidebarContent({ onItemClick }: SidebarContentProps) {
  const currentPath = usePathname();
  const { user } = useAuth();
  if (!user) return null;

  const sidebarGroups = getSidebarGroups(user.role);
  const isActive = (path: string) => currentPath === path;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b md:hidden">
        <div className="font-bold text-lg">نظام أكاديميتي</div>
        <div className="text-xs text-muted-foreground">
          {user.role === 0 ? "الإدارة العامة" : "إدارة الأكاديميات"}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {sidebarGroups.map((group) => {
          const groupActive = group.items.some((i) => isActive(i.url));
          return (
            <Collapsible key={group.label} defaultOpen={groupActive}>
              <SidebarGroup>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  <span>{group.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 data-[state=open]:rotate-180" />
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
                              onClick={onItemClick}
                              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-[0.9rem] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              activeClassName="bg-primary/10 text-primary font-medium"
                            >
                              <item.icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                              <span>{item.title}</span>
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
      </div>
      {/* user footer could be added here if needed */}
    </div>
  );
}

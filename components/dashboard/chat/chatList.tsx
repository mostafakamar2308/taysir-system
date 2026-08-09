"use client";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users } from "lucide-react";
import { Role } from "@/types/user";
import { RoomKind } from "@/wss/types";
import type { ChatRoom } from "./chatLayout";

interface Props {
  chats: ChatRoom[];
  selectedChatId: number | null;
  onSelect: (id: number, kind: RoomKind) => void;
  currentUser: {
    id: number;
    email: string;
    name: string;
    role: number;
    academyId?: number;
    tutorId?: number;
    studentId?: number;
  };
}

export function ChatList({
  chats,
  selectedChatId,
  onSelect,
  currentUser,
}: Props) {
  const t = useTranslations("Chat");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "tutor" | "student">(
    "all",
  );

  const isStaff = currentUser.role === Role.Admin || currentUser.role === Role.Supervisor;

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const tutorName = chat.tutor.name?.toLowerCase() || "";
      const studentName = chat.student?.name?.toLowerCase() || "";
      const groupName = chat.groupTitle?.toLowerCase() || "";
      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        tutorName.includes(query) ||
        studentName.includes(query) ||
        groupName.includes(query);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "tutor" && currentUser.role !== Role.Tutor) ||
        (roleFilter === "student" && currentUser.role !== Role.Student);

      return matchesSearch && matchesRole;
    });
  }, [chats, search, roleFilter, currentUser.role]);

  const isStudent = currentUser.role === Role.Student;

  const displayTitle = (chat: ChatRoom): string => {
    if (chat.kind === "group") return chat.groupTitle || t("unknown");
    if (isStaff) {
      const tutorName = chat.tutor.name || t("unknown");
      const studentName = chat.student?.name || t("unknown");
      return `${tutorName} ${t("with")} ${studentName}`;
    }
    return (
      currentUser.role === Role.Tutor || currentUser.role === Role.Admin
        ? chat.student?.name
        : chat.tutor.name
    ) || t("unknown");
  };

  const displayAvatar = (chat: ChatRoom) => {
    if (chat.kind === "group") {
      return { src: null as string | null, name: chat.groupTitle || "?" };
    }
    const user =
      currentUser.role === Role.Tutor || isStaff
        ? chat.student
        : chat.tutor;
    return { src: user?.imageUrl || null, name: user?.name || "?" };
  };

  const isUnread = (chat: ChatRoom): boolean => {
    if (chat.messages.length === 0) return false;
    const last = chat.messages[chat.messages.length - 1];
    if (last.senderId === currentUser.id) return false;
    if (chat.kind === "group") {
      if (chat.lastReadMessageId == null) return !last.isRead;
      return last.id > chat.lastReadMessageId;
    }
    return !last.isRead;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold mb-3">{t("title")}</h2>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {!isStudent && (
            <div className="flex gap-2">
              <Badge
                variant={roleFilter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setRoleFilter("all")}
              >
                {t("filterAll")}
              </Badge>
              {currentUser.role === Role.Tutor ? null : (
                <Badge
                  variant={roleFilter === "tutor" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setRoleFilter("tutor")}
                >
                  {t("filterTutors")}
                </Badge>
              )}
              {currentUser.role === Role.Student ? null : (
                <Badge
                  variant={roleFilter === "student" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setRoleFilter("student")}
                >
                  {t("filterStudents")}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => {
          const avatar = displayAvatar(chat);
          const isSelected = selectedChatId === chat.id;
          const unread = isUnread(chat);

          return (
            <button
              key={`${chat.kind}-${chat.id}`}
              onClick={() => onSelect(chat.id, chat.kind)}
              className={`w-full cursor-pointer p-4 md:max-w-xs flex gap-3 hover:bg-accent transition-colors ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              <Avatar className="h-10 w-10">
                {chat.kind === "group" ? (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={avatar.src || undefined} />
                    <AvatarFallback>
                      {avatar.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex flex-1 flex-col items-start gap-1 text-sm text-right">
                <div className="font-medium truncate">{displayTitle(chat)}</div>
                {chat.kind === "group" && (
                  <div className="text-xs text-muted-foreground">
                    {t("memberCount", { count: chat.members?.length ?? 0 })}
                  </div>
                )}
                <div className="text-muted-foreground w-full">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].content
                    : t("noMessagesYet")}
                </div>
              </div>
              {unread && (
                <div className="p-2 w-4 h-4 bg-primary rounded-full self-center text-white flex items-center justify-center" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

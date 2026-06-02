// components/chat/chat-list.tsx
"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { Role } from "@/types/user";
import { FullChatMessage } from "@/wss/types";

interface Chat {
  id: number;
  tutor: { id: number; name: string | null; imageUrl: string | null };
  student: {
    id: number;
    name: string | null;
    imageUrl: string | null;
  };
  messages: FullChatMessage[];
  isClosed: boolean;
  updatedAt: Date;
}

interface Props {
  chats: Chat[];
  selectedChatId: number | null;
  onSelect: (id: number) => void;
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "tutor" | "student">(
    "all",
  );

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const tutorName = chat.tutor.name?.toLowerCase() || "";
      const studentName = chat.student.name?.toLowerCase() || "";
      const query = search.toLowerCase();

      const matchesSearch =
        !search || tutorName.includes(query) || studentName.includes(query);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "tutor" && currentUser.role !== Role.Tutor) || // admin can filter by tutor
        (roleFilter === "student" && currentUser.role !== Role.Student);

      return matchesSearch && matchesRole;
    });
  }, [chats, search, roleFilter, currentUser.role]);

  const isStudent = currentUser.role === Role.Student;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold mb-3">المحادثات</h2>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
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
                All
              </Badge>
              {currentUser.role === Role.Tutor ? null : (
                <Badge
                  variant={roleFilter === "tutor" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setRoleFilter("tutor")}
                >
                  Tutors
                </Badge>
              )}
              {currentUser.role === Role.Student ? null : (
                <Badge
                  variant={roleFilter === "student" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setRoleFilter("student")}
                >
                  Students
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => {
          const otherUser =
            currentUser.role === Role.Tutor || currentUser.role === Role.Admin
              ? chat.student
              : chat.tutor;
          const isSelected = selectedChatId === chat.id;

          return (
            <button
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className={`w-full cursor-pointer p-4 md:max-w-xs flex gap-3 hover:bg-accent transition-colors ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.imageUrl || undefined} />
                <AvatarFallback>
                  {otherUser.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start gap-1 text-sm text-right">
                <div className="font-medium truncate">{otherUser.name}</div>
                <div className="text-muted-foreground w-full">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].content
                    : "No messages yet"}
                </div>
              </div>
              {chat.messages.length > 0 &&
                !chat.messages[chat.messages.length - 1].isRead && (
                  <div className="p-2 w-4 h-4 bg-primary rounded-full self-center text-white flex items-center justify-center" />
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { useTranslations } from "next-intl";
import { useChat } from "@/hooks/use-chat";
import { ChatMessageItem } from "./chatMessageItem";
import { ChatInput } from "./chatInput";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight } from "lucide-react";
import { Role } from "@/types/user";
import { RoomKind } from "@/wss/types";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ChatRoom } from "./chatLayout";

interface Props {
  roomId: number;
  kind: RoomKind;
  userId: number;
  chat: ChatRoom;
  currentUser: {
    id: number;
    email: string;
    name: string;
    role: number;
    academyId?: number;
    tutorId?: number;
    studentId?: number;
  };
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatWindow({
  roomId,
  kind,
  userId,
  chat,
  currentUser,
  onBack,
  showBackButton,
}: Props) {
  const t = useTranslations("Chat");
  const {
    messages,
    loading,
    typingUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    sendTyping,
  } = useChat({ roomId, kind, userId, userRole: currentUser.role });

  const isStaff = currentUser.role === Role.Admin || currentUser.role === Role.Supervisor;
  const isGroup = kind === "group";

  const headerTitle = (() => {
    if (isGroup) return chat.groupTitle || t("unknown");
    if (isStaff) {
      const tutorName = chat.tutor.name || t("unknown");
      const studentName = chat.student?.name || t("unknown");
      return `${tutorName} ${t("with")} ${studentName}`;
    }
    return (
      (currentUser.role === Role.Tutor || isStaff
        ? chat.student?.name
        : chat.tutor.name) || t("unknown")
    );
  })();

  const headerAvatar = (() => {
    if (isGroup) {
      return {
        group: true as const,
        src: null as string | null,
        name: chat.groupTitle || "?",
      };
    }
    const user =
      currentUser.role === Role.Tutor || isStaff
        ? chat.student
        : chat.tutor;
    return {
      group: false as const,
      src: user?.imageUrl || null,
      name: user?.name || "?",
    };
  })();

  const otherUserRole = isGroup ? "group" : "student";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length, loading]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        {headerAvatar.group ? (
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        ) : (
          <Avatar className="h-10 w-10">
            <AvatarImage src={headerAvatar.src || undefined} />
            <AvatarFallback>
              {headerAvatar.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <div className="font-semibold">{headerTitle}</div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">
              {isGroup
                ? t("memberCount", { count: chat.members?.length ?? 0 })
                : t(`roles.${otherUserRole}`)}
            </Badge>
            {typingUsers.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {t("typingIndicator")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">
            {t("loadingMessages")}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {t("noMessages")}
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === userId}
              onMarkRead={() => markAsRead(msg.id)}
              onEdit={(text) => updateMessage(msg.id, text)}
              onDelete={() => deleteMessage(msg.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onTyping={sendTyping}
        disabled={chat.isClosed}
      />
    </div>
  );
}

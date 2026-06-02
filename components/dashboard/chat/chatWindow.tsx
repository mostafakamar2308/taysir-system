"use client";
import { useChat } from "@/hooks/use-chat";
import { ChatMessageItem } from "./chatMessageItem";
import { ChatInput } from "./chatInput";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/types/user";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Chat {
  id: number;
  tutor: { id: number; name: string | null; imageUrl: string | null };
  student: {
    id: number;
    name: string | null;
    imageUrl: string | null;
  };
  isClosed: boolean;
}

interface Props {
  roomId: number;
  userId: number;
  chat: Chat;
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
  userId,
  chat,
  currentUser,
  onBack,
  showBackButton,
}: Props) {
  const {
    messages,
    loading,
    typingUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    sendTyping,
  } = useChat({ roomId, userId, userRole: currentUser.role });

  const otherUser =
    currentUser.role === Role.Tutor || currentUser.role === Role.Admin
      ? chat.student
      : chat.tutor;

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
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.imageUrl || undefined} />
          <AvatarFallback>{otherUser.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{otherUser.name}</div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">
              {currentUser.role === Role.Tutor ||
              currentUser.role === Role.Admin
                ? "Student"
                : "Tutor"}
            </Badge>
            {typingUsers.size > 0 && (
              <span className="text-xs text-muted-foreground">typing...</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">
            جاري تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            لا يوجد رسائل حتي الان، قل مرحبا!
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

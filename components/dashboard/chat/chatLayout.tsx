"use client";
import { useState } from "react";
import { ChatList } from "./chatList";
import { ChatWindow } from "./chatWindow";
import { FullChatMessage } from "@/wss/types";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

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

export function ChatLayout({ chats, currentUser }: Props) {
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("room")
    ? Number(searchParams.get("room"))
    : null;

  const [selectedChatId, setSelectedChatId] = useState<number | null>(
    roomIdParam || (chats.length > 0 ? chats[0].id : null),
  );

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const handleSelect = (id: number) => {
    setSelectedChatId(id);
    setMobileChatOpen(true);
  };

  const handleBack = () => {
    setMobileChatOpen(false);
  };

  return (
    <div
      dir="rtl"
      className="flex h-[calc(88vh)] md:h-[calc(100vh-4rem)] bg-background"
    >
      <div
        className={cn(
          "flex flex-col border-r border-border bg-card h-full",
          "md:w-80 md:flex", // desktop: fixed width, always visible
          mobileChatOpen ? "hidden md:flex" : "flex flex-1 md:flex-none", // mobile: hide when chat is open
        )}
      >
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelect={handleSelect}
          currentUser={currentUser}
        />
      </div>
      <div
        className={cn(
          "flex-1 flex flex-col border-l border-border",
          mobileChatOpen ? "flex" : "hidden md:flex",
        )}
      >
        {" "}
        {selectedChatId ? (
          <ChatWindow
            roomId={selectedChatId}
            userId={currentUser.id}
            chat={chats.find((c) => c.id === selectedChatId)!}
            currentUser={currentUser}
            onBack={handleBack}
            showBackButton={true}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            اختر محادثة لبدء الدردشة
          </div>
        )}
      </div>
    </div>
  );
}

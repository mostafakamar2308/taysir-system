// hooks/use-chat.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/socketProvider";
import {
  ClientEvent,
  ServerEvent,
  AcknowledgeCode,
  AcknowledgePayload,
  FullChatMessage,
} from "@/wss/types";
import { getChatMessages } from "@/actions/chat";
import { Role } from "@/types/user";

interface UseChatOptions {
  roomId: number;
  userId: number;
  userRole: Role;
  onError?: (error: string) => void;
}

export function useChat({ roomId, userId, userRole }: UseChatOptions) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<FullChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const typingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const markAsRead = useCallback(
    (messageId: number) => {
      if (!socket) return;
      socket.emit(ClientEvent.MarkMessageAsRead, { id: messageId });
    },
    [socket],
  );

  // Load initial messages
  useEffect(() => {
    if (!roomId) return;
    const getMessages = async () => {
      setLoading(true);
      getChatMessages(roomId)
        .then((msgs) => {
          setMessages(msgs);
          const unreadFromOthers = msgs.filter(
            (m) => !m.isRead && m.senderId !== userId && !m.isDeleted,
          );
          unreadFromOthers.forEach((m) => markAsRead(m.id));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };
    getMessages();
  }, [roomId, markAsRead, userId]);

  // Join / leave room
  useEffect(() => {
    if (!socket) return;
    socket.emit(ClientEvent.JoinRoom, { roomId }, (res: AcknowledgePayload) => {
      if (res.code !== AcknowledgeCode.Success) {
        console.error("Failed to join room:", res.message);
      }
    });

    return () => {
      socket.emit(ClientEvent.LeaveRoom, { roomId });
    };
  }, [socket, roomId]);

  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    // Capture the current timeout map
    const timeoutMap = typingTimeoutsRef.current;

    const handleNewMessage = ({
      message,
      refId,
    }: {
      message: FullChatMessage;
      refId?: string;
    }) => {
      console.log("Received message:", { message, refId });

      setMessages((prev) => {
        const exists = prev.find((m) => m.id === message.id);
        if (exists) return prev;
        if (refId && message.senderId === userId) {
          return prev.map((m) =>
            m.refId === refId ? { ...message, id: message.id } : m,
          );
        }
        return [...prev, message];
      });
      if (
        message.senderId !== userId &&
        !message.isRead &&
        !message.isDeleted
      ) {
        socket?.emit(ClientEvent.MarkMessageAsRead, { id: message.id });
      }
    };

    const handleUpdate = ({ message }: { message: FullChatMessage }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
    };

    const handleDelete = ({ messageId }: { messageId: number }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleRead = ({ messageId }: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isRead: true, readAt: new Date() } : m,
        ),
      );
    };

    const handleTyping = ({ userId: typerId }: { userId: number }) => {
      if (typerId === userId) return; // ignore self
      setTypingUsers((prev) => new Set(prev).add(typerId));

      // Clear any existing timeout for this user
      if (timeoutMap.has(typerId)) {
        clearTimeout(timeoutMap.get(typerId)!);
      }

      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(typerId);
          return next;
        });
        timeoutMap.delete(typerId);
      }, 3000);

      timeoutMap.set(typerId, timeout);
    };

    socket.on(ServerEvent.RoomMessage, handleNewMessage);
    socket.on(ServerEvent.RoomMessageUpdated, handleUpdate);
    socket.on(ServerEvent.RoomMessageDeleted, handleDelete);
    socket.on(ServerEvent.RoomMessageRead, handleRead);
    socket.on(ServerEvent.UserTyping, handleTyping);

    return () => {
      socket.off(ServerEvent.RoomMessage, handleNewMessage);
      socket.off(ServerEvent.RoomMessageUpdated, handleUpdate);
      socket.off(ServerEvent.RoomMessageDeleted, handleDelete);
      socket.off(ServerEvent.RoomMessageRead, handleRead);
      socket.off(ServerEvent.UserTyping, handleTyping);

      // Clear all typing timeouts using the captured map
      timeoutMap.forEach((timeout) => clearTimeout(timeout));
      timeoutMap.clear();
    };
  }, [socket, userId]);

  // ---- Actions ----

  const sendMessage = useCallback(
    (text: string) => {
      if (!socket) return;
      const refId = `temp-${Date.now()}`;
      const optimisticMessage: FullChatMessage = {
        id: -1,
        roomId,
        senderId: userId,
        content: text,
        isRead: false,
        isDeleted: false,
        readAt: null,
        refId,
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { id: userId, name: "You", imageUrl: null, role: userRole },
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      socket.emit(
        ClientEvent.SendMessage,
        { roomId, text, refId },
        (res: AcknowledgePayload) => {
          if (res.code !== AcknowledgeCode.Success) {
            setMessages((prev) => prev.filter((m) => m.refId !== refId));
            console.error("Send failed:", res.message);
          }
        },
      );
    },
    [socket, roomId, userRole, userId],
  );

  const updateMessage = useCallback(
    (messageId: number, text: string) => {
      if (!socket) return;
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: text, updatedAt: new Date() }
            : m,
        ),
      );
      socket.emit(
        ClientEvent.UpdateMessage,
        { id: messageId, text },
        (res: AcknowledgePayload) => {
          if (res.code !== AcknowledgeCode.Success) {
            // Revert? Could refetch original message, but for now just ignore
            console.error("Update failed:", res.message);
          }
        },
      );
    },
    [socket],
  );

  const deleteMessage = useCallback(
    (messageId: number) => {
      if (!socket) return;
      // Optimistic removal
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      socket.emit(
        ClientEvent.DeleteMessage,
        { id: messageId },
        (res: AcknowledgePayload) => {
          if (res.code !== AcknowledgeCode.Success) {
            console.error("Delete failed:", res.message);
            // Could refetch messages, but at least warn
          }
        },
      );
    },
    [socket],
  );

  const sendTyping = useCallback(() => {
    if (!socket) return;
    socket.emit(ClientEvent.UserTyping, { roomId });
  }, [socket, roomId]);

  return {
    messages,
    loading,
    typingUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    sendTyping,
  };
}

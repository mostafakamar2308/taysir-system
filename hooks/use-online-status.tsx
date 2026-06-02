import { useState, useEffect } from "react";
import { useSocket } from "@/components/providers/socketProvider";
import { ServerEvent } from "@/wss/types";

export function useOnlineStatus() {
  const { socket } = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }: { userId: number }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };
    const handleOffline = ({ userId }: { userId: number }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on(ServerEvent.UserOnline, handleOnline);
    socket.on(ServerEvent.UserOffline, handleOffline);

    return () => {
      socket.off(ServerEvent.UserOnline, handleOnline);
      socket.off(ServerEvent.UserOffline, handleOffline);
    };
  }, [socket]);

  return onlineUserIds;
}

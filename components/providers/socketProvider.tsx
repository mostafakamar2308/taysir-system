"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ClientEventsMap, ServerEventsMap } from "@/wss/types";

interface SocketContextValue {
  socket: Socket<ServerEventsMap, ClientEventsMap> | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({
  children,
  token,
  url,
}: {
  children: React.ReactNode;
  token: string | null;
  url: string;
}) {
  const [socket, setSocket] = useState<Socket<
    ServerEventsMap,
    ClientEventsMap
  > | null>(null);

  useEffect(() => {
    if (!token) return;
    const newSocket: Socket<ServerEventsMap, ClientEventsMap> = io(url, {
      transports: ["websocket"],
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocket(null);
    });

    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [url, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

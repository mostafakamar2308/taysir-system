"use client";
import { useEffect, useState } from "react";
import { SocketProvider } from "./socketProvider";
import { Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function SocketAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  usePushNotifications();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/token")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => setToken(data?.token ?? null))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <SocketProvider
      token={token}
      url={process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001"}
    >
      {children}
    </SocketProvider>
  );
}

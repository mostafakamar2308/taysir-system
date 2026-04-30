"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type WhatsAppStatus = "disconnected" | "connecting" | "connected" | "error";

interface WhatsAppContextType {
    status: WhatsAppStatus;
    loading: boolean;
    error: string | null;
    qrCode: string | null;
    refresh: () => Promise<void>;
    createInstance: () => Promise<void>;
    disconnectInstance: () => Promise<void>;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(
    undefined,
);

export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<WhatsAppStatus>("disconnected");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);

    // جلب الحالة الحالية
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/whatsapp/instance/status");
            const data = await res.json();
            setStatus(data.status);
            if (data.qr) setQrCode(data.qr);
            else setQrCode(null);
        } catch (err) {
            console.error("Failed to fetch WhatsApp status", err);
            setStatus("error");
            setError("تعذر التحقق من حالة واتساب");
        } finally {
            setLoading(false);
        }
    }, []);

    const createInstance = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/whatsapp/instance/create", {
                method: "POST",
            });
            const data = await res.json();

            if (data.success) {
                setStatus("connecting");
                setQrCode(null);
                pollQR();
            } else {
                setError(data.error || "فشل إنشاء اتصال واتساب");
                setStatus("error");
            }
        } catch (err) {
            console.error(err);
            setError("خطأ في الشبكة أثناء إنشاء الاتصال");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    // قطع الاتصال
    const disconnectInstance = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/whatsapp/instance/disconnect", {
                method: "POST",
            });
            const data = await res.json();

            if (data.success) {
                setStatus("disconnected");
                setQrCode(null);
            } else {
                setError(data.error || "فشل قطع الاتصال");
            }
        } catch (err) {
            console.error(err);
            setError("خطأ في الشبكة أثناء قطع الاتصال");
        } finally {
            setLoading(false);
        }
    };

    // استطلاع رمز QR حتى الاتصال
    const pollQR = useCallback(() => {
        let attempts = 0;
        const maxAttempts = 30;

        const interval = setInterval(async () => {
            const currentStatus = await checkStatus();

            if (currentStatus === "connecting") {
                try {
                    const qrRes = await fetch("/api/whatsapp/instance/qr");
                    const qrData = await qrRes.json();

                    if (qrData.ready && qrData.qr) {
                        setQrCode(qrData.qr);
                        attempts = 0;
                    } else {
                        attempts++;
                        if (attempts >= maxAttempts) {
                            setError("انتهت مهلة إنشاء رمز QR. يرجى المحاولة مرة أخرى.");
                            setStatus("error");
                            clearInterval(interval);
                        }
                    }
                } catch (err) {
                    console.error(err);
                    attempts++;
                }
            } else if (currentStatus === "connected") {
                setQrCode(null);
                clearInterval(interval);
            } else if (
                currentStatus === "disconnected" ||
                currentStatus === "error"
            ) {
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // دالة مساعدة للتحقق من الحالة أثناء الاستطلاع
    const checkStatus = async () => {
        try {
            const res = await fetch("/api/whatsapp/instance/status");
            const data = await res.json();
            setStatus(data.status);
            return data.status;
        } catch {
            setStatus("error");
            return "error";
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        if (status === "connecting") {
            cleanup = pollQR();
        }
        return cleanup;
    }, [status, pollQR]);

    return (
        <WhatsAppContext.Provider
            value={{
                status,
                loading,
                error,
                qrCode,
                refresh,
                createInstance,
                disconnectInstance,
            }}
        >
            {children}
        </WhatsAppContext.Provider>
    );
}

export function useWhatsApp() {
    const context = useContext(WhatsAppContext);
    if (!context)
        throw new Error("useWhatsApp must be used within a WhatsAppProvider");
    return context;
}
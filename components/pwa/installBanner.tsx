"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function InstallBanner() {
  const t = useTranslations("InstallBanner");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [ios] = useState(
    () => typeof navigator !== "undefined" && isIOS(),
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (ios) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [ios]);

  const show = ios || deferredPrompt !== null;
  if (!show || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-md md:hidden">
      <div className="flex items-center gap-3 rounded-xl border bg-background p-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-xs text-muted-foreground">
            {ios ? t("iosDescription") : t("description")}
          </p>
        </div>
        {deferredPrompt ? (
          <Button size="sm" className="shrink-0 gap-1.5" onClick={handleInstall}>
            <Download className="h-4 w-4" />
            {t("install")}
          </Button>
        ) : null}
        <button
          onClick={() => setDismissed(true)}
          aria-label={t("close")}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
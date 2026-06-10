import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";
import { startZoomOAuth, unlinkZoom } from "@/actions/tutor/zoom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Unlink, Link, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

// Error codes – translation keys are used instead of hardcoded messages
const errorCodes = [
  "missing_code",
  "zoom_auth_failed",
  "zoom_user_fetch_failed",
  "not_authenticated",
  "not_tutor",
  "invalid_state",
] as const;

type ErrorCode = (typeof errorCodes)[number];

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) => {
  const t = await getTranslations("ZoomSettings");
  const currentUser = await user();

  if (!currentUser || currentUser.role !== Role.Tutor) {
    redirect("/login");
  }

  const tutor = await db.tutor.findUnique({
    where: { id: currentUser.tutorId },
    select: {
      zoomAuthenticated: true,
      zoomUserId: true,
    },
  });

  const isConnected = tutor?.zoomAuthenticated ?? false;
  const { message } = await searchParams;

  let errorMessage: string | null = null;
  if (message && errorCodes.includes(message as ErrorCode)) {
    errorMessage = t(message as ErrorCode);
  } else if (message) {
    errorMessage = t("unexpected_error");
  }

  return (
    <div className="mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Error Banner */}
      {errorMessage && (
        <Alert variant="destructive" className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <AlertTitle>{t("errorTitle")}</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t("statusLabel")}</span>
            {isConnected ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 hover:bg-green-200"
              >
                {t("statusConnected")}
              </Badge>
            ) : (
              <Badge variant="secondary">{t("statusDisconnected")}</Badge>
            )}
          </div>

          <p>
            {isConnected
              ? t("connectedDescription")
              : t("disconnectedDescription")}
          </p>

          <div className="pt-2 flex gap-3">
            {!isConnected ? (
              <form action={startZoomOAuth}>
                <Button type="submit" className="gap-2">
                  <Link className="h-4 w-4" />
                  {t("connectButton")}
                </Button>
              </form>
            ) : (
              <form action={unlinkZoom}>
                <Button variant="destructive" type="submit" className="gap-2">
                  <Unlink className="h-4 w-4" />
                  {t("unlinkButton")}
                </Button>
              </form>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">{t("helpText")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;

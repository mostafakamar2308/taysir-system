"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { checkUsername, createStudent } from "@/actions/student";
import { Plus, User, CheckCircle2, XCircle, LoaderCircle } from "lucide-react";
import { StudentStatus } from "@/types/student";
import { useTranslations } from "next-intl";
import {
  normalizeUsername,
  usernameBaseFromName,
} from "@/lib/username";
import { cn } from "@/lib/utils";

interface AddStudentDialogProps {
  tutors: { id: number; name: string | null }[];
  currencies: { id: number; name: string }[];
  academyId?: number;
  children?: React.ReactNode;
}

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

export default function AddStudentDialog({
  tutors,
  currencies,
  academyId,
  children,
}: AddStudentDialogProps) {
  const t = useTranslations("AddStudentDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tutorValue, setTutorValue] = useState("none");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const editedManually = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  // Auto-derive an initial username suggestion from the student's name,
  // unless the owner has already typed a custom one.
  useEffect(() => {
    if (editedManually.current) return;
    setUsername(usernameBaseFromName(name));
  }, [name]);

  // Debounced live availability check.
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!username) {
        setUsernameStatus("idle");
        setSuggestions([]);
        return;
      }

      setUsernameStatus("checking");
      const result = await checkUsername(username);
      if (!result.ok) {
        setUsernameStatus("invalid");
        setSuggestions([]);
        return;
      }
      const check = result.data;
      if (normalizeUsername(check.username) !== normalizeUsername(username)) {
        return;
      }
      if (!check.valid) {
        setUsernameStatus("invalid");
        setSuggestions([]);
      } else if (check.available) {
        setUsernameStatus("available");
        setSuggestions([]);
      } else {
        setUsernameStatus("taken");
        setSuggestions(check.suggestions);
      }
    }, 330);

    return () => clearTimeout(timeout);
  }, [username]);

  function handleUsernameChange(value: string) {
    editedManually.current = true;
    const cleaned = normalizeUsername(value).replace(/[^a-z0-9._]/g, "");
    setUsername(cleaned.slice(0, 30));
  }

  function applySuggestion(suggestion: string) {
    setUsername(suggestion);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (!academyId) return;
      formData.append("academyId", academyId.toString());
      await createStudent(formData);
      toast({ title: t("toast.success") });
      setOpen(false);
      setName("");
      setUsername("");
      editedManually.current = false;
      setUsernameStatus("idle");
      setSuggestions([]);
      router.refresh();
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const usernameInvalid = usernameStatus === "taken" || usernameStatus === "invalid";
  const submitDisabled =
    loading ||
    usernameStatus !== "available" ||
    username.length < 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName("");
          setUsername("");
          editedManually.current = false;
          setUsernameStatus("idle");
          setSuggestions([]);
        }
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> {t("triggerLabel")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <User className="h-4 w-4" /> {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="username">{t("username")} *</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="off"
                  autoCorrect="off"
                  dir="ltr"
                  className={cn("text-left", usernameInvalid && "border-destructive")}
                  placeholder={t("usernamePlaceholder")}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                />
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {usernameStatus === "checking" && (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t("usernameChecking")}
                      </span>
                    </>
                  )}
                  {usernameStatus === "available" && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600">
                        {t("usernameAvailable")}
                      </span>
                    </>
                  )}
                  {usernameStatus === "taken" && (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive">
                        {t("usernameTaken")}
                      </span>
                    </>
                  )}
                  {usernameStatus === "invalid" && (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive">
                        {t("usernameInvalid")}
                      </span>
                    </>
                  )}
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">
                      {t("usernameSuggestions")}
                    </span>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => applySuggestion(s)}
                        className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 text-primary font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  autoCorrect="off"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div>
                <Label htmlFor="age">{t("age")} *</Label>
                <Input id="age" name="age" type="number" required />
              </div>
              <div>
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  autoComplete="off"
                  autoCorrect="off"
                />
                <span className="text-xs text-slate-600">{t("phoneHint")}</span>
              </div>
              <div>
                <Label htmlFor="password">{t("password")} *</Label>
                <Input
                  id="password"
                  name="password"
                  minLength={6}
                  placeholder={t("passwordPlaceholder")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">{t("country")}</Label>
                <Input id="country" name="country" />
              </div>
              <div>
                <Label htmlFor="timezone">{t("timezone-label")} *</Label>
                <Select name="timezone" defaultValue="Africa/Cairo">
                  <SelectTrigger>
                    <SelectValue placeholder={t("timezonePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Cairo">
                      {t("timezone.cairo")}
                    </SelectItem>
                    <SelectItem value="Asia/Riyadh">
                      {t("timezone.riyadh")}
                    </SelectItem>
                    <SelectItem value="Asia/Dubai">
                      {t("timezone.dubai")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredLanguage">
                  {t("preferredLanguage")}
                </Label>
                <Input id="preferredLanguage" name="preferredLanguage" />
              </div>
              <div>
                <Label htmlFor="source">{t("source")}</Label>
                <Input id="source" name="source" />
              </div>
              <div>
                <Label htmlFor="currencyId">{t("currency-label")}</Label>
                <Select
                  name="currencyId"
                  defaultValue={currencies[0]?.id.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("currencyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tutorId">{t("tutor-label")}</Label>
                <Combobox
                  name="tutorId"
                  options={[
                    { value: "none", label: t("tutor.none") },
                    ...tutors.map((tutor) => ({
                      value: tutor.id.toString(),
                      label: tutor.name ?? "",
                    })),
                  ]}
                  value={tutorValue}
                  onValueChange={setTutorValue}
                  placeholder={t("tutorPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="status">{t("status-label")}</Label>
                <Select
                  name="status"
                  defaultValue={StudentStatus.lead.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StudentStatus.lead.toString()}>
                      {t("status.lead")}
                    </SelectItem>
                    <SelectItem value={StudentStatus.trial.toString()}>
                      {t("status.trial")}
                    </SelectItem>
                    <SelectItem value={StudentStatus.subscribed.toString()}>
                      {t("status.subscribed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {loading ? t("saving") : t("add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
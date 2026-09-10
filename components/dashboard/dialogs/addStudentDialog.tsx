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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import dayjs from "@/lib/dayjs";
import { checkUsername, createStudent } from "@/actions/student";
import { getAcademyGroups, getAcademyTutors } from "@/actions/groups";
import { getPlans } from "@/actions/plan";
import {
  Plus,
  User,
  GraduationCap,
  Trash2,
  CheckCircle2,
  XCircle,
  LoaderCircle,
} from "lucide-react";
import { StudentStatus } from "@/types/student";
import { PaymentMethod } from "@/types/payment";
import { paymentMethodLabels } from "@/lib/enums";
import { useTranslations } from "next-intl";
import { normalizeUsername, usernameBaseFromName } from "@/lib/username";
import { cn } from "@/lib/utils";

interface AddStudentDialogProps {
  // Kept for backward-compatibility with existing callers (unused; the dialog
  // fetches up-to-date tutors/groups/plans itself on open).
  tutors?: { id: number; name: string | null }[];
  currencies: { id: number; name: string }[];
  academyId?: number;
  children?: React.ReactNode;
}

// ── Local option types (client-side slice of the server actions) ──
interface AcademyGroup {
  id: number;
  title: string;
  currentTutorId: number;
  currentTutorName: string;
  studentSessionPrice: number;
}
interface TutorOption {
  id: number;
  name: string;
  baseGroupHourlyRate: number | null;
}
interface PlanOption {
  id: number;
  title: string;
  sessionCount: number;
  price: number;
  billingPeriod: number;
}
interface Enrollment {
  key: number;
  kind: "group" | "tutor";
  groupId: string;
  tutorId: string;
  planId: string;
  price: string;
  sessionCount: string;
  billingCycle: string;
  startDate: string;
}

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

// Split a paid amount across enrollments proportionally to their prices
// (last enrollment absorbs leftover rounding).
function computeAllocations(
  enrollments: Enrollment[],
  amount: number,
): Record<number, string> {
  const prices = enrollments.map((e) => Math.max(0, parseFloat(e.price) || 0));
  const total = prices.reduce((a, b) => a + b, 0);
  if (total <= 0 || amount <= 0) {
    return Object.fromEntries(
      enrollments.map((e) => [e.key, "0.00"]),
    ) as Record<number, string>;
  }
  const out: Record<number, string> = {};
  let used = 0;
  enrollments.forEach((e, i) => {
    const v =
      i === enrollments.length - 1
        ? amount - used
        : Math.round((amount * prices[i]) / total * 100) / 100;
    out[e.key] = v.toFixed(2);
    used += v;
  });
  return out;
}

export default function AddStudentDialog({
  currencies,
  academyId,
  children,
}: AddStudentDialogProps) {
  const t = useTranslations("AddStudentDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  // ── Step 1: personal info ──
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const editedManually = useRef(false);
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [source, setSource] = useState("");
  const [currencyId, setCurrencyId] = useState("");

  // ── Step 2: status + enrollments + payment ──
  const [status, setStatus] = useState(StudentStatus.lead.toString());
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PaymentMethod.CASH.toString());
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [allocations, setAllocations] = useState<Record<number, string>>({});

  // ── Loaded options (fetched on open) ──
  const [groups, setGroups] = useState<AcademyGroup[]>([]);
  const [tutorOptions, setTutorOptions] = useState<TutorOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  const isSubscribed = status === StudentStatus.subscribed.toString();
  const parsedAmount = parseFloat(amount) || 0;
  const allocatedTotal = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0,
  );
  const paymentRemaining = parsedAmount - allocatedTotal;
  const selectedCurrency =
    currencies.find((c) => c.id.toString() === currencyId)?.name ?? "";

  // Reset to a clean slate whenever the dialog opens
  const reset = () => {
    setStep(1);
    setName("");
    setUsername("");
    editedManually.current = false;
    setUsernameStatus("idle");
    setSuggestions([]);
    setEmail("");
    setAge("");
    setPhone("");
    setPassword("");
    setCountry("");
    setTimezone("Africa/Cairo");
    setPreferredLanguage("");
    setSource("");
    setCurrencyId(currencies[0]?.id.toString() ?? "");
    setStatus(StudentStatus.lead.toString());
    setEnrollments([]);
    setPaid(false);
    setAmount("");
    setMethod(PaymentMethod.CASH.toString());
    setDate(dayjs().format("YYYY-MM-DD"));
    setAllocations({});
  };

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

  // Fetch tutor/group/plan options fresh each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [gRes, tRes, pRes] = await Promise.all([
        getAcademyGroups(),
        getAcademyTutors(),
        academyId ? getPlans(academyId) : Promise.resolve({ ok: false as const, error: "" }),
      ]);
      if (cancelled) return;
      setGroups(gRes.ok ? gRes.data ?? [] : []);
      setTutorOptions(tRes.ok ? tRes.data ?? [] : []);
      setPlans(pRes.ok ? pRes.data ?? [] : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, academyId]);

  // Re-distribute the paid amount whenever enrollments change is intentionally
  // NOT done via an effect: the same payment block derives fallback shares from
  // computeAllocations() at render time, and the "auto distribute" button
  // re-seeds them on demand (mirroring RecordPaymentDialog).

  function handleUsernameChange(value: string) {
    editedManually.current = true;
    const cleaned = normalizeUsername(value).replace(/[^a-z0-9._]/g, "");
    setUsername(cleaned.slice(0, 30));
  }

  function applySuggestion(suggestion: string) {
    setUsername(suggestion);
  }

  // ── Enrollment management ──
  function addEnrollment() {
    setEnrollments((prev) => [
      ...prev,
      {
        key: Date.now(),
        kind: "group",
        groupId: "",
        tutorId: "",
        planId: "none",
        price: "",
        sessionCount: "",
        billingCycle: "30",
        startDate: dayjs().format("YYYY-MM-DD"),
      },
    ]);
  }

  function removeEnrollment(key: number) {
    setEnrollments((prev) => prev.filter((e) => e.key !== key));
  }

  function handleEnrollmentChange(key: number, patch: Partial<Enrollment>) {
    setEnrollments((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e)),
    );
  }

  function handlePlanChange(key: number, value: string) {
    handleEnrollmentChange(key, { planId: value });
    if (value === "none") return;
    const plan = plans.find((p) => p.id.toString() === value);
    if (plan) {
      handleEnrollmentChange(key, {
        planId: value,
        price: plan.price.toString(),
        sessionCount: plan.sessionCount.toString(),
        billingCycle: plan.billingPeriod.toString(),
      });
    }
  }

  function handleGroupChange(key: number, value: string) {
    handleEnrollmentChange(key, {
      kind: "group",
      groupId: value,
      tutorId: "",
    });
    if (value !== "none") {
      const g = groups.find((x) => x.id.toString() === value);
      const e = enrollments.find((x) => x.key === key);
      if (g && e && !e.price) {
        handleEnrollmentChange(key, { price: g.studentSessionPrice.toString() });
      }
    }
  }

  function handleTutorChange(key: number, value: string) {
    handleEnrollmentChange(key, {
      kind: "tutor",
      tutorId: value,
      groupId: "",
    });
    if (value !== "none") {
      const tutor = tutorOptions.find((x) => x.id.toString() === value);
      const e = enrollments.find((x) => x.key === key);
      if (tutor && e && !e.price && tutor.baseGroupHourlyRate) {
        handleEnrollmentChange(key, {
          price: tutor.baseGroupHourlyRate.toString(),
        });
      }
    }
  }

  function togglePaid() {
    if (paid) {
      setPaid(false);
      return;
    }
    const total = enrollments.reduce(
      (sum, e) => sum + (parseFloat(e.price) || 0),
      0,
    );
    setPaid(true);
    setAmount(total ? total.toFixed(2) : "0");
    setAllocations(computeAllocations(enrollments, total));
    setDate(dayjs().format("YYYY-MM-DD"));
  }

  function handleAutoDistribute() {
    setAllocations(computeAllocations(enrollments, parsedAmount));
  }

  function enrollmentTitle(e: Enrollment): string {
    if (e.kind === "group") {
      const g = groups.find((x) => x.id.toString() === e.groupId);
      return g ? `${g.title} — ${g.currentTutorName}` : "";
    }
    const tutor = tutorOptions.find((x) => x.id.toString() === e.tutorId);
    return tutor ? tutor.name : "";
  }

  async function handleSubmit() {
    // Client-side validation
    if (isSubscribed && enrollments.length === 0) {
      toast({ title: t("errors.needEnrollment"), variant: "destructive" });
      return;
    }
    for (const e of enrollments) {
      const targetOk = e.kind === "group" ? e.groupId : e.tutorId;
      if (!targetOk) {
        toast({
          title: t("errors.needTarget", { n: e.key }),
          variant: "destructive",
        });
        return;
      }
      if (!(parseFloat(e.price) > 0)) {
        toast({ title: t("errors.needPrice"), variant: "destructive" });
        return;
      }
      if (!e.startDate) {
        toast({ title: t("errors.needStartDate"), variant: "destructive" });
        return;
      }
    }
    if (paid && parsedAmount <= 0) {
      toast({ title: t("errors.needAmount"), variant: "destructive" });
      return;
    }
    if (paid && Math.abs(paymentRemaining) > 0.01) {
      toast({ title: t("errors.allocationMismatch"), variant: "destructive" });
      return;
    }

    const payload = {
      name,
      username,
      email: email.trim() ? email.trim() : null,
      phone: phone || null,
      timezone,
      preferredLanguage: preferredLanguage || null,
      password,
      age: parseInt(age, 10),
      country: country || null,
      status: parseInt(status, 10),
      source: source || null,
      currencyId: parseInt(currencyId, 10),
      enrollments: isSubscribed
        ? enrollments.map((e) => ({
            groupId:
              e.kind === "group" && e.groupId
                ? parseInt(e.groupId, 10)
                : null,
            tutorId:
              e.kind === "tutor" && e.tutorId
                ? parseInt(e.tutorId, 10)
                : null,
            planId: e.planId !== "none" ? parseInt(e.planId, 10) : null,
            price: parseFloat(e.price),
            sessionCount: e.sessionCount ? parseInt(e.sessionCount, 10) : null,
            billingCycle: parseInt(e.billingCycle, 10) || 30,
            startDate: e.startDate,
          }))
        : [],
      payment:
        paid && parsedAmount > 0
          ? {
              amount: parsedAmount,
              method: parseInt(method, 10),
              date,
              allocations: enrollments
                .map((e, i) => ({
                  enrollmentIndex: i,
                  amount: parseFloat(allocations[e.key] ?? "0") || 0,
                }))
                .filter((a) => a.amount > 0),
            }
          : undefined,
    };

    setLoading(true);
    try {
      const res = await createStudent(payload);
      if (!res.ok) throw new Error(res.error);
      toast({ title: t("toast.success") });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title:
          error instanceof Error ? error.message : t("toast.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const usernameInvalid =
    usernameStatus === "taken" || usernameStatus === "invalid";
  const step1Valid =
    name.trim().length > 0 &&
    age !== "" &&
    password.length >= 6 &&
    usernameStatus === "available" &&
    timezone !== "" &&
    parseInt(currencyId, 10) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
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
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
              step === 1
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <User className="h-3.5 w-3.5" /> {t("stepPersonal")}
          </span>
          <span className="text-muted-foreground">—</span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
              step === 2
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <GraduationCap className="h-3.5 w-3.5" /> {t("stepSubscription")}
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <User className="h-4 w-4" /> {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
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
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="off"
                  autoCorrect="off"
                  dir="ltr"
                  className={cn(
                    "text-left",
                    usernameInvalid && "border-destructive",
                  )}
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
                  type="email"
                  autoComplete="off"
                  autoCorrect="off"
                  dir="ltr"
                  className="text-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="age">{t("age")} *</Label>
                <Input
                  id="age"
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  autoComplete="off"
                  autoCorrect="off"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span className="text-xs text-slate-600">{t("phoneHint")}</span>
              </div>
              <div>
                <Label htmlFor="password">{t("password")} *</Label>
                <Input
                  id="password"
                  minLength={6}
                  placeholder={t("passwordPlaceholder")}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country">{t("country")}</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="timezone">{t("timezone-label")} *</Label>
                <Select value={timezone} onValueChange={setTimezone}>
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
                <Input
                  id="preferredLanguage"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="source">{t("source")}</Label>
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="currencyId">{t("currency-label")} *</Label>
                <Select value={currencyId} onValueChange={setCurrencyId}>
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
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <GraduationCap className="h-4 w-4" /> {t("subscriptionInfo")}
            </h3>

            <div>
              <Label htmlFor="status">{t("status-label")} *</Label>
              <Select value={status} onValueChange={setStatus}>
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

            {!isSubscribed && (
              <p className="text-sm text-muted-foreground rounded-md border p-3">
                {t("noEnrollmentHint")}
              </p>
            )}

            {isSubscribed && (
              <div className="space-y-3">
                {enrollments.length === 0 && (
                  <p className="text-sm text-muted-foreground rounded-md border p-3">
                    {t("noEnrollments")}
                  </p>
                )}
                {enrollments.map((e, i) => (
                  <div key={e.key} className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        {t("enrollmentTitle", { n: i + 1 })}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeEnrollment(e.key)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Kind selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={e.kind === "group" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          handleEnrollmentChange(e.key, {
                            kind: "group",
                            groupId: "",
                            tutorId: "",
                          })
                        }
                      >
                        {t("kindGroup")}
                      </Button>
                      <Button
                        type="button"
                        variant={e.kind === "tutor" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          handleEnrollmentChange(e.key, {
                            kind: "tutor",
                            groupId: "",
                            tutorId: "",
                          })
                        }
                      >
                        {t("kindPrivate")}
                      </Button>
                    </div>

                    {e.kind === "group" ? (
                      <div>
                        <Label>{t("group-label")} *</Label>
                        <Combobox
                          options={groups.map((g) => ({
                            value: g.id.toString(),
                            label: `${g.title} — ${g.currentTutorName}`,
                          }))}
                          value={e.groupId}
                          onValueChange={(v) => handleGroupChange(e.key, v)}
                          placeholder={t("groupPlaceholder")}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>{t("tutor-label")} *</Label>
                        <Combobox
                          options={tutorOptions.map((tutor) => ({
                            value: tutor.id.toString(),
                            label: tutor.name,
                          }))}
                          value={e.tutorId}
                          onValueChange={(v) => handleTutorChange(e.key, v)}
                          placeholder={t("tutorPlaceholder")}
                        />
                      </div>
                    )}

                    <div>
                      <Label>{t("plan-label")}</Label>
                      <Select
                        value={e.planId}
                        onValueChange={(v) => handlePlanChange(e.key, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("planPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("plan.none")}</SelectItem>
                          {plans.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.title} — {p.sessionCount} {t("sessions")} ·{" "}
                              {p.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("price-label")} *</Label>
                        <Input
                          type="number"
                          value={e.price}
                          onChange={(ev) =>
                            handleEnrollmentChange(e.key, {
                              price: ev.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>{t("sessionCount-label")}</Label>
                        <Input
                          type="number"
                          value={e.sessionCount}
                          onChange={(ev) =>
                            handleEnrollmentChange(e.key, {
                              sessionCount: ev.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>{t("billingCycle-label")}</Label>
                        <Input
                          type="number"
                          value={e.billingCycle}
                          onChange={(ev) =>
                            handleEnrollmentChange(e.key, {
                              billingCycle: ev.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>{t("startDate-label")}</Label>
                        <Input
                          type="date"
                          value={e.startDate}
                          onChange={(ev) =>
                            handleEnrollmentChange(e.key, {
                              startDate: ev.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="gap-1"
                  onClick={addEnrollment}
                >
                  <Plus className="h-4 w-4" /> {t("addEnrollment")}
                </Button>
              </div>
            )}

            {isSubscribed && enrollments.length > 0 && (
              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="paid"
                    checked={paid}
                    onCheckedChange={togglePaid}
                  />
                  <Label htmlFor="paid" className="font-medium">
                    {t("paidLabel")}
                  </Label>
                </div>

                {paid && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("amount-label")}</Label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{t("method-label")}</Label>
                        <Select value={method} onValueChange={setMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PaymentMethod)
                              .filter((m) => typeof m === "number")
                              .map((m) => (
                                <SelectItem key={m} value={m.toString()}>
                                  {paymentMethodLabels[m as PaymentMethod]}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("paymentDate-label")}</Label>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {t("allocationTitle")}
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAutoDistribute}
                        >
                          {t("autoDistribute")}
                        </Button>
                      </div>
                      {enrollments.map((e) => (
                        <div
                          key={e.key}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-sm">
                            {enrollmentTitle(e) ||
                              t("enrollmentTitle", {
                                n: enrollments.indexOf(e) + 1,
                              })}
                          </span>
                          <Input
                            type="number"
                            className="w-28"
                            value={
                              allocations[e.key] ??
                              computeAllocations(enrollments, parsedAmount)[
                                e.key
                              ] ??
                              "0"
                            }
                            onChange={(ev) =>
                              setAllocations((prev) => ({
                                ...prev,
                                [e.key]: ev.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t pt-2 text-sm">
                        <span>{t("paymentRemaining")}</span>
                        <span
                          className={
                            paymentRemaining > 0.01
                              ? "text-destructive font-bold"
                              : "font-medium"
                          }
                        >
                          {paid
                            ? `${Math.max(0, paymentRemaining).toLocaleString(
                                "ar-EG",
                              )} ${selectedCurrency}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          {step === 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                {t("next")}
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                {t("back")}
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? t("saving") : t("add")}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Eye, Search } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { useTranslations } from "next-intl";

interface LeadEntry {
  id: string;
  fullName: string;
  phone: string;
  academyName: string;
  countryCode: string | null;
  studentCategory: string | null;
  teacherCount: string | null;
  currentMethod: string | null;
  biggestChallenge: string | null;
  urgency: string | null;
  qualificationTier: string | null;
  qualificationStatus: string | null;
  whatsappStatus: string | null;
  whatsappMessageId: string | null;
  whatsappError: string | null;
  createdAt: string;
}

interface LeadsClientProps {
  initialLeads: LeadEntry[];
}

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const t = useTranslations("admin.leads");
  const [leads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [challengeFilter, setChallengeFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<LeadEntry | null>(null);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
        lead.academyName.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search);
      const matchesTier =
        tierFilter === "all" || lead.qualificationTier === tierFilter;
      const matchesStatus =
        statusFilter === "all" || lead.qualificationStatus === statusFilter;
      const matchesChallenge =
        challengeFilter === "all" || lead.biggestChallenge === challengeFilter;
      return matchesSearch && matchesTier && matchesStatus && matchesChallenge;
    });
  }, [leads, search, tierFilter, statusFilter, challengeFilter]);

  const handleExport = () => {
    const exportData = filtered.map((lead) => ({
      [t("table.fullName")]: lead.fullName,
      [t("table.phone")]: lead.phone,
      [t("table.academyName")]: lead.academyName,
      [t("table.countryCode")]: lead.countryCode || "—",
      [t("table.studentCategory")]: lead.studentCategory
        ? t(`studentCategoryOptions.${lead.studentCategory}`)
        : "—",
      [t("table.teacherCount")]: lead.teacherCount
        ? t(`teacherCountOptions.${lead.teacherCount}`)
        : "—",
      [t("table.currentMethod")]: lead.currentMethod
        ? t(`currentMethodOptions.${lead.currentMethod}`)
        : "—",
      [t("table.biggestChallenge")]: lead.biggestChallenge
        ? t(`challengeOptions.${lead.biggestChallenge}`)
        : "—",
      [t("table.urgency")]: lead.urgency
        ? t(`urgencyOptions.${lead.urgency}`)
        : "—",
      [t("table.tier")]: lead.qualificationTier || "—",
      [t("table.status")]: lead.qualificationStatus
        ? t(`statusOptions.${lead.qualificationStatus}`)
        : "—",
      [t("table.whatsappStatus")]: lead.whatsappStatus || "—",
      [t("table.registrationDate")]: formatDate(lead.createdAt),
    }));
    const csv = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "qualified") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          {t("statusOptions.qualified")}
        </Badge>
      );
    } else if (status === "rejected") {
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          {t("statusOptions.rejected")}
        </Badge>
      );
    }
    return <Badge variant="outline">{t("statusOptions.pending")}</Badge>;
  };

  const getTierBadge = (tier: string | null) => {
    if (tier === "A") {
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          {t("tierOptions.A")}
        </Badge>
      );
    } else if (tier === "B") {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          {t("tierOptions.B")}
        </Badge>
      );
    } else if (tier === "C") {
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          {t("tierOptions.C")}
        </Badge>
      );
    }
    return <span>—</span>;
  };

  const getWhatsappStatusBadge = (status: string | null) => {
    if (status === "sent") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          {t("whatsappStatusOptions.sent")}
        </Badge>
      );
    } else if (status === "failed") {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          {t("whatsappStatusOptions.failed")}
        </Badge>
      );
    } else if (status === "pending") {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          {t("whatsappStatusOptions.pending")}
        </Badge>
      );
    }
    return <span>—</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> {t("export")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
            <p className="text-2xl font-bold">{leads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("stats.qualified")}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {
                leads.filter((l) => l.qualificationStatus === "qualified")
                  .length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("stats.rejected")}
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {leads.filter((l) => l.qualificationStatus === "rejected").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("stats.today")}</p>
            <p className="text-2xl font-bold">
              {
                leads.filter((l) => {
                  const today = new Date();
                  const leadDate = new Date(l.createdAt);
                  return leadDate.toDateString() === today.toDateString();
                }).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ltr:pl-9 rtl:pr-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("filters.tier")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="A">{t("tierOptions.A")}</SelectItem>
                <SelectItem value="B">{t("tierOptions.B")}</SelectItem>
                <SelectItem value="C">{t("tierOptions.C")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="qualified">
                  {t("statusOptions.qualified")}
                </SelectItem>
                <SelectItem value="rejected">
                  {t("statusOptions.rejected")}
                </SelectItem>
                <SelectItem value="pending">
                  {t("statusOptions.pending")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={challengeFilter} onValueChange={setChallengeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("filters.challenge")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="student-leakage">
                  {t("challengeOptions.student-leakage")}
                </SelectItem>
                <SelectItem value="financial-chaos">
                  {t("challengeOptions.financial-chaos")}
                </SelectItem>
                <SelectItem value="schedule-chaos">
                  {t("challengeOptions.schedule-chaos")}
                </SelectItem>
                <SelectItem value="professional-appearance">
                  {t("challengeOptions.professional-appearance")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.fullName")}</TableHead>
                  <TableHead>{t("table.phone")}</TableHead>
                  <TableHead>{t("table.academyName")}</TableHead>
                  <TableHead>{t("table.teacherCount")}</TableHead>
                  <TableHead>{t("table.biggestChallenge")}</TableHead>
                  <TableHead>{t("table.tier")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.whatsappStatus")}</TableHead>
                  <TableHead>{t("table.registrationDate")}</TableHead>
                  <TableHead>{t("table.details")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.fullName}
                      </TableCell>
                      <TableCell dir="ltr">{lead.phone}</TableCell>
                      <TableCell>{lead.academyName}</TableCell>
                      <TableCell>
                        {lead.teacherCount
                          ? t(`teacherCountOptions.${lead.teacherCount}`)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {lead.biggestChallenge
                          ? t(`challengeOptions.${lead.biggestChallenge}`)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {getTierBadge(lead.qualificationTier)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lead.qualificationStatus)}
                      </TableCell>
                      <TableCell>
                        {getWhatsappStatusBadge(lead.whatsappStatus)}
                      </TableCell>
                      <TableCell>{formatDate(lead.createdAt)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{t("detailsTitle")}</DialogTitle>
                            </DialogHeader>
                            {selectedLead && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.fullName")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.fullName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.phone")}
                                    </p>
                                    <p className="font-medium" dir="ltr">
                                      {selectedLead.phone}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.academyName")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.academyName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.countryCode")}
                                    </p>
                                    <p className="font-medium">
                                      +{selectedLead.countryCode}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.studentCategory")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.studentCategory
                                        ? t(
                                            `studentCategoryOptions.${selectedLead.studentCategory}`,
                                          )
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.teacherCount")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.teacherCount
                                        ? t(
                                            `teacherCountOptions.${selectedLead.teacherCount}`,
                                          )
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.currentMethod")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.currentMethod
                                        ? t(
                                            `currentMethodOptions.${selectedLead.currentMethod}`,
                                          )
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.biggestChallenge")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.biggestChallenge
                                        ? t(
                                            `challengeOptions.${selectedLead.biggestChallenge}`,
                                          )
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.urgency")}
                                    </p>
                                    <p className="font-medium">
                                      {selectedLead.urgency
                                        ? t(
                                            `urgencyOptions.${selectedLead.urgency}`,
                                          )
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.tier")}
                                    </p>
                                    <p className="font-medium">
                                      {getTierBadge(
                                        selectedLead.qualificationTier,
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.status")}
                                    </p>
                                    <p className="font-medium">
                                      {getStatusBadge(
                                        selectedLead.qualificationStatus,
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {t("table.whatsappStatus")}
                                    </p>
                                    <p className="font-medium">
                                      {getWhatsappStatusBadge(
                                        selectedLead.whatsappStatus,
                                      )}
                                      {selectedLead.whatsappError && (
                                        <span className="text-xs text-red-500 block mt-1">
                                          {selectedLead.whatsappError}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-2">
                                  <Button variant="outline" asChild>
                                    <a
                                      href={`https://wa.me/${selectedLead.phone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      WhatsApp
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

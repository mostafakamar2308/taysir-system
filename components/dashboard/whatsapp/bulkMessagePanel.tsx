"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { useWhatsApp } from "@/lib/contexts/whatsapp";
import { StudentStatus } from "@/types/student";
import { statusLabels } from "@/lib/enums";
import SendBulkMessagesDialog from "../common/SendBulkMessagesDialog";

interface StudentBasic {
    id: number;
    name: string | null;
    phone: string | null;
    status: number;
}

interface TutorBasic {
    id: number;
    name: string | null;
    phone: string | null;
    active: boolean | null;
}

interface BulkMessagePanelProps {
    students: StudentBasic[];
    tutors: TutorBasic[];
}

const ALL_STATUSES = [
    StudentStatus.lead,
    StudentStatus.trial,
    StudentStatus.subscribed,
    StudentStatus.churned,
    StudentStatus.paused,
];

const ALL_TUTOR_STATES: Array<{ value: boolean; label: string }> = [
    { value: true, label: "المعلمون النشطون" },
    { value: false, label: "المعلمون غير النشطين" },
];

export function BulkMessagePanel({ students, tutors }: BulkMessagePanelProps) {
    const { status } = useWhatsApp();
    const [openSend, setOpenSend] = useState(false);
    const [recipientGroup, setRecipientGroup] = useState<"all" | "students" | "tutors">("all");
    const [selectedStatuses, setSelectedStatuses] = useState<Set<number>>(
        new Set(ALL_STATUSES),
    );
    const [selectedTutorStates, setSelectedTutorStates] = useState<Set<string>>(
        new Set(ALL_TUTOR_STATES.map((s) => String(s.value))),
    );

    const includeStudents = recipientGroup === "all" || recipientGroup === "students";
    const includeTutors = recipientGroup === "all" || recipientGroup === "tutors";

    const filteredStudents = includeStudents
        ? students.filter((s) => selectedStatuses.has(s.status))
        : [];
    const filteredTutors = includeTutors
        ? tutors.filter((t) =>
              selectedTutorStates.has(String(t.active === null ? false : t.active)),
          )
        : [];

    const recipients: Array<{ id: number; name: string | null; phone: string | null }> = [
        ...filteredStudents,
        ...filteredTutors,
    ];

    const phoneList: { phone: string }[] = recipients
        .filter((u) => !!u.phone)
        .map((u) => ({ phone: u.phone as string }));

    const toggleStatus = (s: number, checked: boolean) => {
        setSelectedStatuses((prev) => {
            const next = new Set(prev);
            if (checked) next.add(s);
            else next.delete(s);
            return next;
        });
    };

    const toggleTutorState = (value: string, checked: boolean) => {
        setSelectedTutorStates((prev) => {
            const next = new Set(prev);
            if (checked) next.add(value);
            else next.delete(value);
            return next;
        });
    };

    if (status !== "connected") return null;

    return (
        <Card className="w-full max-w-md mt-6">
            <CardHeader>
                <CardTitle className="text-lg">إرسال رسائل واتساب جماعية</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    يمكنك اختيار الفئة والحالة المراد إرسال الرسائل إليها.
                </p>

                <div className="space-y-4">
                    {/* اختيار المجموعة */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <label className="text-sm font-medium">الفئة المستهدفة:</label>
                        <Select
                            value={recipientGroup}
                            onValueChange={(val) =>
                                setRecipientGroup(val as "all" | "students" | "tutors")
                            }
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل (طلاب ومعلمون)</SelectItem>
                                <SelectItem value="students">الطلاب فقط</SelectItem>
                                <SelectItem value="tutors">المعلمون فقط</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* حالات الطلاب */}
                    {includeStudents && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">حالات الطلاب:</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_STATUSES.map((s) => (
                                    <div
                                        key={s}
                                        className="flex items-center gap-2 border rounded-md p-2"
                                    >
                                        <Checkbox
                                            id={`student-status-${s}`}
                                            checked={selectedStatuses.has(s)}
                                            onCheckedChange={(c) =>
                                                toggleStatus(s, c === true)
                                            }
                                        />
                                        <Label
                                            htmlFor={`student-status-${s}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {statusLabels[s]}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* حالة المعلمين */}
                    {includeTutors && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">حالة المعلمين:</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_TUTOR_STATES.map((s) => (
                                    <div
                                        key={String(s.value)}
                                        className="flex items-center gap-2 border rounded-md p-2"
                                    >
                                        <Checkbox
                                            id={`tutor-state-${s.value}`}
                                            checked={selectedTutorStates.has(String(s.value))}
                                            onCheckedChange={(c) =>
                                                toggleTutorState(String(s.value), c === true)
                                            }
                                        />
                                        <Label
                                            htmlFor={`tutor-state-${s.value}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {s.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                        {phoneList.length} مستخدم في المجموعة المحددة
                    </div>

                    <div className="flex gap-2 justify-center items-center">
                        <Button
                            onClick={() => setOpenSend(true)}
                            disabled={phoneList.length === 0}
                        >
                            <Send className="ml-2 h-4 w-4" />
                            إنشاء رسالة جماعية
                        </Button>
                    </div>
                </div>
            </CardContent>

            {openSend && (
                <SendBulkMessagesDialog
                    open={openSend}
                    setOpen={setOpenSend}
                    users={phoneList}
                />
            )}
        </Card>
    );
}

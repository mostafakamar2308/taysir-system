"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { useWhatsApp } from "@/lib/contexts/whatsapp";
import SendBulkMessagesDialog from "../common/SendBulkMessagesDialog";

interface UserBasic {
    id: number;
    name: string | null;
    phone: string | null;
}

interface BulkMessagePanelProps {
    students: UserBasic[];
    tutors: UserBasic[];
}

export function BulkMessagePanel({ students, tutors }: BulkMessagePanelProps) {
    const { status } = useWhatsApp();
    const [openSend, setOpenSend] = useState(false);
    const [recipientGroup, setRecipientGroup] = useState<"all" | "students" | "tutors">("all");

    // حساب المستلمين بناءً على الاختيار
    const recipients: UserBasic[] = (() => {
        if (recipientGroup === "students") return students;
        if (recipientGroup === "tutors") return tutors;
        return [...students, ...tutors];
    })();

    // تصفية وإعداد مصفوفة الهواتف مع إزالة القيم الفارغة
    const phoneList: { phone: string }[] = recipients
        .filter((u) => !!u.phone)
        .map((u) => ({ phone: u.phone as string }));

    // وصف المجموعة المختارة
    const groupLabel = (() => {
        if (recipientGroup === "students") return "الطلاب";
        if (recipientGroup === "tutors") return "المعلمين";
        return "الطلاب والمعلمين";
    })();

    if (status !== "connected") return null;

    return (
        <Card className="w-full max-w-md mt-6">
            <CardHeader>
                <CardTitle className="text-lg">إرسال رسائل واتساب جماعية</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    يمكنك اختيار الفئة المراد إرسال الرسائل إليها.
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
                    <div className="text-sm text-muted-foreground">
                        {phoneList.length} مستخدم في المجموعة ({groupLabel})
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
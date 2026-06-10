"use client";
import { useTranslations } from "next-intl";
import { FullChatMessage } from "@/wss/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dayjs } from "@/lib/dayjs";
import { Role } from "@/types/user";

interface Props {
  message: FullChatMessage;
  isOwn: boolean;
  onMarkRead: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
}

export function ChatMessageItem({
  message,
  isOwn,
  onMarkRead,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("Chat");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const canModify = dayjs().diff(dayjs(message.createdAt), "minute") <= 15;

  const handleSave = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  if (message.isDeleted) return null;

  return (
    <div
      className={`flex ${isOwn ? "justify-start" : "justify-end"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[75%] rounded-lg p-3 relative group`}>
        {/* Sender info */}
        <div
          className={cn(
            "flex items-center gap-1 mb-2",
            isOwn ? "justify-start" : "justify-end",
          )}
        >
          <span className="font-medium text-sm">
            {isOwn ? t("you") : message.sender.name || t("unknown")}
          </span>
          <Badge variant="secondary" className="text-xs w-fit">
            {t(
              `roles.${message.sender.role === Role.Admin ? "admin" : message.sender.role === Role.Tutor ? "tutor" : "student"}`,
            )}
          </Badge>
        </div>

        {/* Content */}
        {editing ? (
          <div className="flex gap-2 items-center">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="h-8 bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "text-sm flex justify-between items-center gap-1 whitespace-pre-wrap wrap-break-words p-4 px-6 rounded-lg",
              isOwn ? "bg-primary text-primary-foreground" : "bg-accent",
            )}
          >
            {message.content}
            {message.isRead && message.readAt && isOwn ? (
              <Tooltip>
                <TooltipTrigger>
                  <CheckCheck className="h-4 w-4 text-yellow-300" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("readAt", {
                      time: dayjs(message.readAt).format("h:mm A"),
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        )}

        {/* Actions (edit/delete) */}
        {isOwn && canModify && showActions && !editing && (
          <div className="absolute top-1/2 translate-y-1/2 left-0 -translate-x-full flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={() => {
                setEditText(message.content);
                setEditing(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={() => {
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {!isOwn && !message.isRead && (
          <button
            onClick={onMarkRead}
            className="text-xs underline mt-1 text-primary hover:text-primary/80"
          >
            {t("markAsRead")}
          </button>
        )}
      </div>
    </div>
  );
}

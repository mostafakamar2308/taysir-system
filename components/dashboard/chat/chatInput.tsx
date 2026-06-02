// components/chat/chat-input.tsx
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      {disabled && (
        <p className="text-xs text-muted-foreground mb-2">
          This conversation is closed.
        </p>
      )}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={disabled ? "المحادثة مغلقة" : "اكتب رسالتك..."}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          size="icon"
        >
          <Send className="h-4 w-4 -rotate-90" />
        </Button>
      </div>
    </div>
  );
}

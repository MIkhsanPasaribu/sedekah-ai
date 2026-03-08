"use client";

import { useState, useRef, FormEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Ketik pesan Anda...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleTextareaChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void {
    setInput(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-ink-ghost bg-surface-white px-3 py-2 sm:px-4 sm:py-3"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-ink-ghost bg-surface-warm px-3 py-2 text-sm text-ink-dark sm:px-4 sm:py-3",
            "placeholder:text-ink-light",
            "focus:border-brand-green-light focus:outline-none focus:ring-2 focus:ring-brand-green-light/20",
            "disabled:opacity-50",
          )}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all",
            input.trim() && !isLoading
              ? "bg-brand-green-deep text-white hover:bg-brand-green-mid shadow-md"
              : "bg-ink-ghost text-ink-light cursor-not-allowed",
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

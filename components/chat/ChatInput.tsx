"use client";

import { useState, useRef, FormEvent } from "react";
import { ArrowUp } from "lucide-react";
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
    <div className="border-t border-ink-ghost/50 bg-surface-warm px-3 py-3 sm:px-4 sm:py-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="relative flex items-end rounded-2xl border border-ink-ghost/60 bg-surface-white shadow-sm transition-all focus-within:border-brand-green-light focus-within:shadow-md">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-3 text-sm text-ink-dark",
              "placeholder:text-ink-light",
              "focus:outline-none",
              "disabled:opacity-50",
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all",
              input.trim() && !isLoading
                ? "bg-brand-green-deep text-white hover:bg-brand-green-mid"
                : "bg-ink-ghost/50 text-ink-light cursor-not-allowed",
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-ink-light">
          Amil AI bisa membuat kesalahan. Verifikasi informasi penting.
        </p>
      </form>
    </div>
  );
}

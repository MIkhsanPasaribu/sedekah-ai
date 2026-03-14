"use client";

import { useState, useCallback, useRef } from "react";

interface UseVoiceChatOptions {
  onResult: (text: string) => void;
  lang?: string;
}

interface UseVoiceChatReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

// Internal instance type for speech recognition
type SpeechRecognitionInstance = InstanceType<SpeechRecognitionCtor>;
type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useVoiceChat({
  onResult,
  lang = "id-ID",
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (isListening) return;

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) onResult(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, isListening, lang, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}

/** Speak text aloud using the browser's TTS. Returns a stop function. */
export function speakText(text: string, lang = "id-ID"): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return () => undefined;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}

"use client";

import { useEffect, useRef } from "react";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";

const STORAGE_KEY = "sedekah-ai-onboarding-done";

export function OnboardingTour() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    didRun.current = true;

    // Lazy load driver.js — only when needed
    import("driver.js").then(({ driver }) => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(27, 67, 50, 0.6)",
        nextBtnText: "Lanjut →",
        prevBtnText: "← Kembali",
        doneBtnText: "Mulai Donasi 🤲",
        progressText: "Langkah {{current}} dari {{total}}",
        onDestroyStarted: () => {
          localStorage.setItem(STORAGE_KEY, "1");
          driverObj.destroy();
        },
        steps: ONBOARDING_STEPS.filter((step) =>
          document.querySelector(step.element),
        ) as Parameters<typeof driverObj.setSteps>[0],
      });

      // Small delay so DOM is fully painted
      setTimeout(() => driverObj.drive(), 600);
    });
  }, []);

  return null;
}

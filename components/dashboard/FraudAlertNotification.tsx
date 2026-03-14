"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DonationAlertItem } from "@/app/api/alerts/route";

export function FraudAlertNotification() {
  const [alerts, setAlerts] = useState<DonationAlertItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data: { alerts: DonationAlertItem[] }) =>
        setAlerts(data.alerts ?? []),
      )
      .catch(() => null);
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.donationId));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert) => (
        <div
          key={alert.donationId}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            alert.severity === "critical"
              ? "border-danger/40 bg-danger-light"
              : "border-warning/40 bg-warning-light",
          )}
        >
          <AlertTriangle
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              alert.severity === "critical" ? "text-danger" : "text-warning",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink-black">
              ⚠️ Peringatan: {alert.campaignName}
            </p>
            <p className="mt-0.5 text-xs text-ink-dark">{alert.description}</p>
          </div>
          <button
            onClick={() =>
              setDismissed((prev) => new Set([...prev, alert.donationId]))
            }
            className="shrink-0 text-ink-mid hover:text-ink-dark"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

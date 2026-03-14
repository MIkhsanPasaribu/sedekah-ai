"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Activity, AlertTriangle, RefreshCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OpsCounters {
  agentStream: {
    total: number;
    completed: number;
    errored: number;
    clientDisconnected: number;
    successRate: number;
  };
  llmInvoke: {
    total: number;
    success: number;
    failure: number;
    timeoutDetected: number;
    totalRetries: number;
    successRate: number;
    avgRetryPerInvoke: number;
  };
}

interface AgentOpsResponse {
  generatedAt: string;
  counters: OpsCounters;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

export function AgentOpsCard(): ReactElement {
  const [data, setData] = useState<AgentOpsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/agent/ops", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Tidak dapat mengambil data observability agent.");
      }

      const json = (await res.json()) as AgentOpsResponse;
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kendala.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const streamCounters = data?.counters.agentStream;
  const llmCounters = data?.counters.llmInvoke;

  const statusTone = useMemo(() => {
    if (!streamCounters || !llmCounters) return "text-muted-foreground";

    if (
      streamCounters.successRate < 0.8 ||
      llmCounters.failure > llmCounters.success
    ) {
      return "text-danger";
    }

    if (streamCounters.clientDisconnected > streamCounters.completed * 0.5) {
      return "text-warning";
    }

    return "text-success";
  }, [streamCounters, llmCounters]);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-brand-green-deep" />
              Agent Observability
            </CardTitle>
            <CardDescription>
              Snapshot runtime AI pipeline untuk troubleshooting cepat.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCcw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-md border border-danger/30 bg-danger-light p-3 text-sm text-danger">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4" />
              <p>{error}</p>
            </div>
          </div>
        ) : null}

        {loading && !data ? (
          <p className="text-sm text-muted-foreground">
            Memuat metrik agent...
          </p>
        ) : null}

        {data && streamCounters && llmCounters ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Agent Stream Success
                </p>
                <p className={`text-lg font-semibold ${statusTone}`}>
                  {formatPercent(streamCounters.successRate)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  LLM Invoke Success
                </p>
                <p className={`text-lg font-semibold ${statusTone}`}>
                  {formatPercent(llmCounters.successRate)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Timeout Detected
                </p>
                <p className="text-lg font-semibold text-warning">
                  {llmCounters.timeoutDetected}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Avg Retry / Invoke
                </p>
                <p className="text-lg font-semibold text-brand-gold-core">
                  {formatDecimal(llmCounters.avgRetryPerInvoke)}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Total stream: {streamCounters.total}</p>
              <p>Client disconnected: {streamCounters.clientDisconnected}</p>
              <p>Total LLM invoke: {llmCounters.total}</p>
              <p>Total retry LLM: {llmCounters.totalRetries}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Snapshot diperbarui:{" "}
              {new Date(data.generatedAt).toLocaleString("id-ID")}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

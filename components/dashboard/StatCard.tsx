import { formatRupiah } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Heart, Users, Target } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: "trending" | "heart" | "users" | "target";
  trend?: { value: number; isPositive: boolean };
}

const ICONS = {
  trending: TrendingUp,
  heart: Heart,
  users: Users,
  target: Target,
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: StatCardProps) {
  const Icon = ICONS[icon];

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink-mid">{title}</p>
            <p className="mt-1 text-2xl font-heading font-bold text-ink-black">
              {typeof value === "number" ? formatRupiah(value) : value}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-ink-mid">{subtitle}</p>
            )}
            {trend && (
              <p
                className={`mt-1 text-xs font-medium ${
                  trend.isPositive ? "text-success" : "text-danger"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% dari
                kemarin
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-ghost">
            <Icon className="h-5 w-5 text-brand-green-deep" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

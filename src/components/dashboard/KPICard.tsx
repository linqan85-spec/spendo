import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subValue, 
  change, 
  changeLabel,
  icon: Icon,
  className 
}: KPICardProps) {
  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;
  const hasNoChange = change !== undefined && change === 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositiveChange && (
              <TrendingUp className="h-3 w-3 text-destructive" />
            )}
            {isNegativeChange && (
              <TrendingDown className="h-3 w-3 text-success" />
            )}
            {hasNoChange && (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(
              "text-xs font-medium",
              isPositiveChange && "text-destructive",
              isNegativeChange && "text-success",
              hasNoChange && "text-muted-foreground"
            )}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntegrationStatus = "active" | "inactive" | "error" | "connecting" | "coming_soon";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  lastSynced?: string | null;
  action?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}

const statusConfig = {
  active: {
    label: "Ansluten",
    variant: "default" as const,
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  inactive: {
    label: "Ej ansluten",
    variant: "secondary" as const,
    icon: <AlertCircle className="h-3 w-3" />,
  },
  error: {
    label: "Fel",
    variant: "destructive" as const,
    icon: <AlertCircle className="h-3 w-3" />,
  },
  connecting: {
    label: "Ansluter...",
    variant: "secondary" as const,
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  coming_soon: {
    label: "Kommer snart",
    variant: "outline" as const,
    icon: <Clock className="h-3 w-3" />,
  },
};

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  lastSynced,
  action,
  children,
  compact = false,
}: IntegrationCardProps) {
  const config = statusConfig[status];
  const isComingSoon = status === "coming_soon";

  return (
    <Card className={cn(isComingSoon && "opacity-60")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              isComingSoon ? "bg-muted" : "bg-secondary"
            )}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-semibold",
                  isComingSoon && "text-muted-foreground"
                )}>
                  {name}
                </h3>
                <Badge variant={config.variant} className="gap-1 text-xs">
                  {config.icon}
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              {status === "active" && lastSynced && (
                <p className="text-xs text-muted-foreground mt-1">
                  Senast synkad: {new Date(lastSynced).toLocaleDateString("sv-SE")}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children && !compact && (
          <div className="mt-4 pt-4 border-t">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple coming soon card
export function ComingSoonIntegrationCard({ 
  name, 
  description 
}: { 
  name: string; 
  description: string;
}) {
  return (
    <IntegrationCard
      name={name}
      description={description}
      icon={<span className="font-bold text-muted-foreground">{name[0]}</span>}
      status="coming_soon"
      compact
    />
  );
}

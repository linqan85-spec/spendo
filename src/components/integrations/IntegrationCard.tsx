import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export type IntegrationStatus = "active" | "inactive" | "error" | "connecting";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  lastSynced?: string | null;
  children: React.ReactNode;
}

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  lastSynced,
  children,
}: IntegrationCardProps) {
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
  };

  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
              {icon}
            </div>
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={config.variant} className="gap-1">
              {config.icon}
              {config.label}
            </Badge>
            {status === "active" && lastSynced && (
              <span className="text-xs text-muted-foreground">
                Senast synkad: {new Date(lastSynced).toLocaleDateString("sv-SE")}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

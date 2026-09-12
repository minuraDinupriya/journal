import { TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
}

export function InsightCard({ type, title, description, action }: InsightCardProps) {
  const getIcon = () => {
    switch(type) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch(type) {
      case 'positive': return "border-l-green-500";
      case 'warning': return "border-l-amber-500";
      case 'info': return "border-l-blue-500";
    }
  };

  return (
    <Card className={cn("border-l-4 overflow-hidden", getBorderColor())}>
      <CardContent className="p-5 flex gap-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          {action && (
            <div className="mt-2 text-sm font-medium pt-2 border-t">
              <span className="text-muted-foreground mr-2">Suggested Action:</span>
              <span>{action}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

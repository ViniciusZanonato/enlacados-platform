import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface InsightCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const InsightCard = ({ title, value, icon: Icon, onClick, isLoading, className, description }: InsightCardProps & { description?: string }) => (
  <Card
    className={cn(
      "hover:bg-muted/50 transition-colors",
      onClick && "cursor-pointer",
      className
    )}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  isLoading: boolean;
  accentColor?: string; // optional tailwind text-* color class
}

const KPICard: React.FC<KPICardProps> = ({ title, value, description, icon, isLoading, accentColor = "text-primary" }) => {
  return (
    <Card className="group relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-elegant hover:-translate-y-0.5">
      {/* Subtle left accent bar */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary/30 group-hover:bg-primary/70 transition-colors duration-300" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-1.5 rounded-lg bg-primary/10 ${accentColor} transition-colors group-hover:bg-primary/20`}>
          {icon}
        </div>
      </CardHeader>

      <CardContent className="pl-5">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-3xl font-black tracking-tight text-foreground">{value}</div>
        )}
        {description && !isLoading && (
          <p className="text-xs text-muted-foreground font-light mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;

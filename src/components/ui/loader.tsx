import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function Loader({ className, size = "md" }: LoaderProps) {
  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary", 
        sizeMap[size],
        className
      )} 
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
      <Loader size="lg" />
      <span className="mt-4 text-muted-foreground animate-pulse font-medium">
        Carregando...
      </span>
    </div>
  );
}

export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Loader size="sm" />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

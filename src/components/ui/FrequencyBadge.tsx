import { Badge } from "./badge";
import { cn } from "../../lib/utils";

interface FrequencyBadgeProps {
  frequency: string;
}

export function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let className = "";

  let displayedFrequency = frequency;
  switch (frequency.toLowerCase()) {
    case "monthly":
    case "mensuel":
      displayedFrequency = "Mensuel";
      className = "bg-blue-100 text-blue-800 hover:bg-blue-100";
      break;
    case "quarterly":
    case "trimestriel":
      displayedFrequency = "Trimestriel";
      className = "bg-green-100 text-green-800 hover:bg-green-100";
      break;
    case "annually":
    case "annuel":
      displayedFrequency = "Annuel";
      className = "bg-purple-100 text-purple-800 hover:bg-purple-100";
      break;
    default:
      variant = "outline";
      break;
  }

  return (
    <Badge variant={variant} className={cn(className)}>
      {displayedFrequency}
    </Badge>
  );
}

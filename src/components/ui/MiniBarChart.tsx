import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface MiniBarChartProps {
  data: { category: string; totalAmount: number; color: string }[];
  height?: string;
  width?: string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  height = "40px",
  width = "80px",
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          width,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75em",
          color: "#9ca3af",
        }}
      >
        Pas de données
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((item) => item.totalAmount));

  return (
    <TooltipProvider>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          height,
          width,
          gap: "2px",
          overflow: "hidden",
        }}
        aria-label="Mini bar chart of charges by category"
      >
        {data.map((item, index) => (
          <Tooltip key={item.category || index}>
            <TooltipTrigger asChild>
              <div
                style={{
                  backgroundColor: item.color,
                  height: `${(item.totalAmount / maxAmount) * 100}%`,
                  width: `${100 / data.length}%`, // Distribute width evenly
                  borderRadius: "4px",
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {item.category}:{" "}
                {item.totalAmount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

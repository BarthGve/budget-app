import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface DashboardSummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactElement<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
  dialogContent?: React.ReactNode;
  dialogTitle?: string;
  className?: string;
  children?: React.ReactNode; // New prop for custom content
  isClickable?: boolean; // New prop to control clickability
}

export function DashboardSummaryCard({
  title,
  value,
  description,
  icon,
  iconBgColor = "bg-gray-100",
  iconColor = "text-gray-600",
  dialogContent,
  dialogTitle,
  className = "",
  children,
  isClickable = false,
}: DashboardSummaryCardProps) {
  const cardContent = (
    <Card
      className={`flex-1 ${
        isClickable ? "cursor-pointer hover:bg-gray-50" : ""
      } ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        <div className={`rounded-full p-2 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {children || (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (isClickable && dialogContent) {
    return (
      <Dialog>
        <DialogTrigger asChild>{cardContent}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${iconBgColor}`}>
                {React.cloneElement(icon, {
                  className: `h-5 w-5 ${iconColor}`,
                })}
              </div>
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  return cardContent;
}

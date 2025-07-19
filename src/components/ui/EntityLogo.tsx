import React from "react";
import { cn } from "../../lib/utils";

interface EntityLogoProps {
  logoUrl: string | null | undefined;
  altText: string;
  fallbackIcon: React.ReactNode;
  className?: string;
}

export const EntityLogo: React.FC<EntityLogoProps> = ({
  logoUrl,
  altText,
  fallbackIcon,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-8 h-8 bg-gray-50 rounded-md flex items-center justify-center",
        className
      )}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={altText}
          className="w-full h-full object-contain rounded-md"
        />
      ) : (
        fallbackIcon
      )}
    </div>
  );
};

import { cn } from "@/lib/utils";

export const MarketingLogo = ({
  className,
  size = 30,
}: {
  className?: string;
  size?: number;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="LuminaWeb"
    >
      <circle cx="15" cy="15" r="14" fill="currentColor" />
      <circle cx="9.5" cy="9.5" r="2" fill="var(--cream, #f0ede4)" />
    </svg>
  );
};

"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 rounded-full bg-gradient-to-r from-[#355b8a] via-[#1e3a5f] to-[#f97316] shadow-[0_0_10px_rgba(30,58,95,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none dark:from-sky-200 dark:via-sky-300 dark:to-orange-300 dark:shadow-[0_0_18px_rgba(125,211,252,0.24)]"
        style={{ transform: `translate3d(-${100 - (value || 0)}%, 0, 0)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

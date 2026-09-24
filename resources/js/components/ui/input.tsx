import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-lg border bg-transparent px-3.5 py-1 text-base shadow-xs transition-[border-color,box-shadow] duration-150 outline-none file:inline-flex file:h-8 file:cursor-pointer file:items-center file:gap-2.5 file:border-0 file:bg-muted file:px-3.5 file:text-sm file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-[#33452A] dark:bg-[#111B0A] dark:placeholder:text-[#7E8F73] dark:hover:bg-[#18240F]",
        "focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/15",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

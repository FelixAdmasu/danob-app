import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 dark:border-[#26331C] dark:bg-[#111B0A] dark:text-[#D4E8C8] dark:[a&]:hover:bg-[#18240F]",
        destructive:
          "border-transparent bg-destructive/10 text-[#B42318] [a&]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:text-white dark:[a&]:hover:bg-destructive/70 dark:focus-visible:ring-destructive/40",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Semantic status variants: premium soft chips (tinted background +
        // readable foreground) in light; dark keeps the palette's green /
        // amber / destructive treatments.
        success:
          "border-transparent bg-primary/10 text-primary [a&]:hover:bg-primary/15 dark:border-[#477158] dark:bg-[#15261C] dark:text-[#95E6B6] dark:[a&]:hover:bg-[#15261C]/80",
        warning:
          "border-[#F0B429]/40 bg-[#F0B429]/15 text-[#92400E] [a&]:hover:bg-[#F0B429]/25 dark:border-[#5C4A16] dark:bg-[#2A2411] dark:text-[#F0B429] dark:[a&]:hover:bg-[#3A3116]",
        cancelled:
          "border-destructive/20 bg-destructive/10 text-[#B42318] [a&]:hover:bg-destructive/20 dark:border-transparent dark:bg-destructive/60 dark:text-white dark:[a&]:hover:bg-destructive/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-neutral-200 animate-pulse rounded-md dark:bg-[#383B3D]", className)}
      {...props}
    />
  )
}

export { Skeleton }

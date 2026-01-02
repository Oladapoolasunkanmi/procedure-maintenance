"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsePartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    partId: string
}

export function UsePartButton({ partId, children, className, ...props }: UsePartButtonProps) {
    const router = useRouter()

    return (
        <Button
            className={cn("shadow-lg bg-background border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-full h-12 px-8 font-semibold", className)}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/work-orders/new?partId=${partId}`)
                props.onClick?.(e)
            }}
            {...props}
        >
            <Wrench className="mr-2 h-5 w-5" />
            {children || "Use in New Work Order"}
        </Button>
    )
}

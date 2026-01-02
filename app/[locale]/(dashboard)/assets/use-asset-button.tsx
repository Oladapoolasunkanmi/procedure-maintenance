"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

interface UseAssetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    assetId: string
}

export function UseAssetButton({ assetId, children, className, ...props }: UseAssetButtonProps) {
    const router = useRouter()

    return (
        <Button
            className={cn("shadow-lg bg-background border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-full h-12 px-8 font-semibold", className)}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/work-orders/new?assetId=${assetId}`)
                props.onClick?.(e)
            }}
            {...props}
        >
            <Briefcase className="mr-2 h-5 w-5" />
            {children || "Use in New Work Order"}
        </Button>
    )
}

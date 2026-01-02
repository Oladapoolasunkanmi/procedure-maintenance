"use client"

import * as React from "react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface SlidingTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
    children: React.ReactNode
}

export const SlidingTabsList = React.forwardRef<React.ElementRef<typeof TabsList>, SlidingTabsListProps>(
    ({ className, children, ...props }, ref) => {
        const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })
        const listRef = React.useRef<React.ElementRef<typeof TabsList>>(null)

        // Combine refs
        React.useImperativeHandle(ref, () => listRef.current!, [])

        const updateIndicator = React.useCallback(() => {
            const list = listRef.current
            if (!list) return

            const activeTrigger = list.querySelector('[data-state="active"]') as HTMLElement
            if (activeTrigger) {
                setIndicatorStyle({
                    left: activeTrigger.offsetLeft,
                    width: activeTrigger.offsetWidth,
                })
            }
        }, [])

        React.useEffect(() => {
            const list = listRef.current
            if (!list) return

            // Initial update
            // Small timeout to allow layout to settle
            const timer = setTimeout(updateIndicator, 50)

            // Observe attribute changes (specifically data-state) in the subtree
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (
                        mutation.type === "attributes" &&
                        mutation.attributeName === "data-state"
                    ) {
                        updateIndicator()
                    }
                })
            })

            observer.observe(list, {
                attributes: true,
                subtree: true,
                attributeFilter: ["data-state"],
            })

            // Also listen for resize events
            window.addEventListener("resize", updateIndicator)

            return () => {
                clearTimeout(timer)
                observer.disconnect()
                window.removeEventListener("resize", updateIndicator)
            }
        }, [updateIndicator])

        return (
            <div className="relative w-full">
                <TabsList
                    ref={listRef}
                    className={cn(
                        "bg-transparent w-full justify-start rounded-none h-auto p-0 flex gap-8 relative",
                        className
                    )}
                    {...props}
                >
                    {children}
                    <div
                        className="absolute bottom-0 h-[2px] bg-orange-600 transition-all duration-300 ease-in-out"
                        style={{
                            left: indicatorStyle.left,
                            width: indicatorStyle.width,
                        }}
                    />
                </TabsList>
            </div>
        )
    }
)
SlidingTabsList.displayName = "SlidingTabsList"

export const SlidingTabsTrigger = React.forwardRef<React.ElementRef<typeof TabsTrigger>, React.ComponentPropsWithoutRef<typeof TabsTrigger>>(
    ({ className, ...props }, ref) => (
        <TabsTrigger
            ref={ref}
            className={cn(
                "rounded-none border-0 bg-transparent px-4 py-3 font-semibold text-muted-foreground shadow-none transition-colors data-[state=active]:text-orange-600 data-[state=active]:shadow-none hover:text-orange-600 flex-none",
                className
            )}
            {...props}
        />
    )
)
SlidingTabsTrigger.displayName = "SlidingTabsTrigger"

"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    MoreVertical,
    Plus,
    Search,
    User as UserIcon,
    XCircle,
    AlertCircle,
    Check,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { requests, Request } from "@/lib/data"
import { cn } from "@/lib/utils"

export function RequestsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const sortedRequests = React.useMemo(() => {
        return [...requests].sort((a, b) => {
            // Sort by status (Pending first)
            if (a.status === "Pending" && b.status !== "Pending") return -1
            if (a.status !== "Pending" && b.status === "Pending") return 1
            // Then by date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    }, [])

    const selectedRequest = React.useMemo(() => {
        return requests.find((r) => r.id === selectedId)
    }, [selectedId])

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("id", id)
        router.replace(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:flex-row">
            {/* List View */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", selectedId ? "hidden w-full md:flex md:w-1/3 lg:w-[400px]" : "w-full md:w-[800px]")}>
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Request
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search Requests" className="pl-8" />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <UserIcon className="mr-2 h-3.5 w-3.5" />
                        Requester
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        Date
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <AlertCircle className="mr-2 h-3.5 w-3.5" />
                        Status
                    </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                    <div className="flex flex-col">
                        {sortedRequests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                selected={request.id === selectedId}
                                onClick={() => handleSelect(request.id)}
                            />
                        ))}
                        {sortedRequests.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No requests found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            {selectedRequest ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <RequestDetail request={selectedRequest} onClose={() => router.replace(pathname)} />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">No Request Selected</h3>
                        <p className="text-sm">Select a request from the list to view details.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function RequestCard({ request, selected, onClick }: { request: Request; selected: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer flex-col gap-2 border-b p-4 transition-all hover:bg-accent last:border-0",
                selected && "bg-accent"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-semibold line-clamp-1">{request.title}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(request.createdAt), "MMM d")}
                </span>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
                {request.description}
            </div>
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserIcon className="h-3 w-3" />
                    {request.requester}
                </div>
                <StatusBadge status={request.status} />
            </div>
        </div>
    )
}

function RequestDetail({ request, onClose }: { request: Request; onClose: () => void }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4 bg-muted/40 text-foreground rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold line-clamp-1">{request.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-4">
                            <StatusBadge status={request.status} size="lg" />
                            <div className="flex flex-col">
                                <span className="font-medium">Request Status</span>
                                <span className="text-sm text-muted-foreground">
                                    Submitted on {format(new Date(request.createdAt), "PPP p")}
                                </span>
                            </div>
                        </div>
                        {request.status === "Pending" && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <X className="mr-2 h-4 w-4" />
                                    Decline
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Requester</h3>
                            <div className="flex items-center gap-2 p-2 rounded-md border bg-card">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{request.requester}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Request ID</h3>
                            <div className="p-2 rounded-md border bg-card font-mono text-sm">
                                {request.id}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <div className="p-4 rounded-lg border bg-card text-sm leading-relaxed">
                            {request.description}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

function StatusBadge({ status, size = "sm" }: { status: "Pending" | "Approved" | "Declined"; size?: "sm" | "lg" }) {
    const variants = {
        "Pending": "text-orange-600 bg-orange-50 border-orange-200",
        "Approved": "text-green-600 bg-green-50 border-green-200",
        "Declined": "text-red-600 bg-red-50 border-red-200",
    }

    const icons = {
        "Pending": Clock,
        "Approved": CheckCircle2,
        "Declined": XCircle,
    }

    const Icon = icons[status]

    return (
        <div className={cn(
            "flex items-center gap-1.5 rounded-full border font-medium",
            variants[status],
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-sm"
        )}>
            <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
            {status}
        </div>
    )
}

import { ArrowLeft } from "lucide-react"

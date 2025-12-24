"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import {
    Plus,
    Search,
    FileText,
    MoreVertical,
    Calendar,
    Users,
    MapPin,
    Box,
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

import { procedures, Procedure } from "@/lib/data"
import { cn } from "@/lib/utils"

export function ProceduresClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const selectedProcedure = React.useMemo(() => {
        return procedures.find((p) => p.id === selectedId)
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
                    <h1 className="text-2xl font-bold tracking-tight">Procedure Library</h1>
                    <Button asChild>
                        <Link href="/procedures/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Procedure Template
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search Procedure Templates" className="pl-8" />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Box className="mr-2 h-3.5 w-3.5" />
                        Category
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Users className="mr-2 h-3.5 w-3.5" />
                        Team
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <MapPin className="mr-2 h-3.5 w-3.5" />
                        Location
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Box className="mr-2 h-3.5 w-3.5" />
                        Asset
                    </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                    <div className="flex flex-col">
                        {procedures.map((procedure) => (
                            <ProcedureCard
                                key={procedure.id}
                                procedure={procedure}
                                selected={procedure.id === selectedId}
                                onClick={() => handleSelect(procedure.id)}
                            />
                        ))}
                        {procedures.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No procedures found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            {selectedProcedure ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <ProcedureDetail procedure={selectedProcedure} onClose={() => router.replace(pathname)} />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">No Procedure Selected</h3>
                        <p className="text-sm">Select a procedure from the list to view details.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function ProcedureCard({ procedure, selected, onClick }: { procedure: Procedure; selected: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-center gap-4 border-b p-4 transition-all hover:bg-accent last:border-0",
                selected && "bg-accent"
            )}
        >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                <span className="font-semibold truncate">{procedure.title}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{procedure.fields.length} fields</span>
                </div>
            </div>
        </div>
    )
}

function ProcedureDetail({ procedure, onClose }: { procedure: Procedure; onClose: () => void }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4 bg-muted/40 text-foreground rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold line-clamp-1">{procedure.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        Edit
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-muted/10">
                <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
                    {/* Fields Preview */}
                    {procedure.fields.map((field) => (
                        <div key={field.id} className="bg-card border rounded-lg p-6 shadow-sm">
                            <h3 className="font-medium mb-4">{field.label}</h3>
                            {field.type === "text" && <Input disabled placeholder="Text will be entered here" />}
                            {field.type === "checkbox" && (
                                <div className="flex gap-4">
                                    <Button variant="outline" className="flex-1" disabled>Yes</Button>
                                    <Button variant="outline" className="flex-1" disabled>No</Button>
                                    <Button variant="outline" className="flex-1" disabled>N/A</Button>
                                </div>
                            )}
                            {field.type === "instruction" && <p className="text-sm text-muted-foreground">Instruction text...</p>}
                            {field.type === "signature" && <div className="h-20 border border-dashed rounded flex items-center justify-center text-muted-foreground text-sm">Signature Pad</div>}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

import { ArrowLeft } from "lucide-react"

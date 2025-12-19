"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
    MapPin,
    Plus,
    Search,
    Users,
    Building2,
    MoreVertical,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

import { locations, Location } from "@/lib/data"
import { cn } from "@/lib/utils"

export function LocationsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const selectedLocation = React.useMemo(() => {
        return locations.find((l) => l.id === selectedId)
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
                    <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
                    <Button asChild>
                        <Link href="/locations/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Location
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search Locations" className="pl-8" />
                    </div>
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                    <div className="flex flex-col">
                        {locations.map((location) => (
                            <LocationCard
                                key={location.id}
                                location={location}
                                selected={location.id === selectedId}
                                onClick={() => handleSelect(location.id)}
                            />
                        ))}
                        {locations.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No locations found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            {selectedLocation ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <LocationDetail location={selectedLocation} onClose={() => router.replace(pathname)} />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <MapPin className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">No Location Selected</h3>
                        <p className="text-sm">Select a location from the list to view details.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function LocationCard({ location, selected, onClick }: { location: Location; selected: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-center gap-4 border-b p-4 transition-all hover:bg-accent last:border-0",
                selected && "bg-accent"
            )}
        >
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {location.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={location.image} alt={location.name} className="h-full w-full object-cover" />
                ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                <span className="font-semibold truncate">{location.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{location.description}</span>
                </div>
            </div>
        </div>
    )
}

function LocationDetail({ location, onClose }: { location: Location; onClose: () => void }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold line-clamp-1">{location.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/locations/${location.id}/edit`}>
                            Edit
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">
                    {/* Header Info */}
                    <div className="flex gap-4">
                        <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
                            {location.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={location.image} alt={location.name} className="h-full w-full object-cover" />
                            ) : (
                                <Building2 className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <h3 className="text-xl font-bold">{location.name}</h3>
                            <p className="text-sm text-muted-foreground">{location.description}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Address</span>
                            <span className="text-sm">{location.address || "No address provided"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Staff Count</span>
                            <span className="text-sm">{location.staffCount || 0}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Sub-Locations Placeholder */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Sub-Locations
                        </h4>
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            No sub-locations found.
                            <Button variant="link" className="h-auto p-0 ml-1">Create Sub-Location</Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Assets Placeholder */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Assets
                        </h4>
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            No assets in this location.
                            <Button variant="link" className="h-auto p-0 ml-1">Add Asset</Button>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

import { ArrowLeft } from "lucide-react"

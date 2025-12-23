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
    Loader2,
    Filter,
    Clock,
    Network,
    Settings,
    Briefcase,
    QrCode,
    FileText,
    History,
    AlertTriangle,
    Box,
    ChevronDown,
    Info,
    ArrowLeft,
    Edit,
    Link as LinkIcon,
    ChevronRight
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { locations, Location, Asset } from "@/lib/data" // We might need to fetch assets too if we want to show assets in location
import { cn } from "@/lib/utils"

const filterOptions = [
    { label: "Teams in Charge", icon: Users },
    { label: "Asset", icon: Network },
    { label: "Part", icon: Settings },
    { label: "Procedure", icon: FileText },
    { label: "Created By", icon: Users },
]

export function LocationsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")
    const [activeFilters, setActiveFilters] = React.useState<string[]>([])

    const [locationsList, setLocationsList] = React.useState<Location[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [nextBlockId, setNextBlockId] = React.useState<string | null>(null)

    const fetchLocations = React.useCallback(async (blockId?: string) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (blockId) params.set('block_id', blockId)

            const res = await fetch(`/api/locations?${params.toString()}`)
            const data = await res.json()

            if (data.items) {
                const mappedItems = data.items.map((item: any) => ({
                    ...item,
                    id: item.id || item._id,
                }))
                setLocationsList(prev => blockId ? [...prev, ...mappedItems] : mappedItems)
                setNextBlockId(data.next_block_id || null)
            }
        } catch (error) {
            console.error("Failed to fetch locations:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchLocations()
    }, [fetchLocations])

    const selectedLocation = React.useMemo(() => {
        return locationsList.find((l) => l.id === selectedId)
    }, [selectedId, locationsList])

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("id", id)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:flex-row">
            {/* List View */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", selectedId ? "hidden w-full md:flex md:w-1/3 lg:w-[450px]" : "w-full md:w-[800px]")}>
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
                    <Button asChild>
                        <Link href="/locations/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Location
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {activeFilters.map((filter) => {
                        const option = filterOptions.find(o => o.label === filter)
                        const Icon = option?.icon || Box
                        return (
                            <Button key={filter} variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground bg-accent/50">
                                <Icon className="mr-2 h-3.5 w-3.5" />
                                {filter}
                                <span
                                    className="ml-2 hover:text-foreground cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveFilters(prev => prev.filter(f => f !== filter))
                                    }}
                                >
                                    &times;
                                </span>
                            </Button>
                        )
                    })}

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary">
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search..." />
                                <CommandList>
                                    <CommandEmpty>No filter found.</CommandEmpty>
                                    <CommandGroup>
                                        {filterOptions.map((option) => (
                                            <CommandItem
                                                key={option.label}
                                                value={option.label}
                                                onSelect={() => {
                                                    if (!activeFilters.includes(option.label)) {
                                                        setActiveFilters([...activeFilters, option.label])
                                                    }
                                                }}
                                            >
                                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {option.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Sort By:</span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground font-bold hover:bg-transparent hover:text-muted-foreground/80">
                        Name: Ascending Order
                        <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md bg-white">
                    <div className="flex flex-col divide-y">
                        {isLoading && locationsList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-muted-foreground animate-pulse">Loading locations...</p>
                            </div>
                        ) : (
                            <>
                                {locationsList.filter(l => !l.parentLocationId).map((location) => {
                                    const calculatedSubLocationsCount = countAllDescendants(location.id, locationsList)
                                    const displayCount = location.subLocationsCount || calculatedSubLocationsCount

                                    return (
                                        <LocationCard
                                            key={location.id}
                                            location={{ ...location, subLocationsCount: displayCount }}
                                            selected={location.id === selectedId}
                                            onClick={() => handleSelect(location.id)}
                                        />
                                    )
                                })}
                                {locationsList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center p-12 text-center">
                                        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                            <MapPin className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">No locations found</h3>
                                        <p className="text-muted-foreground max-w-sm mb-6">
                                            Get started by creating your first location to organize your assets and work orders.
                                        </p>
                                        <Button asChild>
                                            <Link href="/locations/new">
                                                <Plus className="mr-2 h-4 w-4" />
                                                New Location
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                                {nextBlockId && (
                                    <div className="p-4 text-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => fetchLocations(nextBlockId)}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Loading..." : "Load More"}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            {selectedLocation ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <LocationDetail
                        location={selectedLocation}
                        allLocations={locationsList}
                        onClose={() => router.replace(pathname)}
                        onSelect={handleSelect}
                    />
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
                "flex cursor-pointer items-start gap-4 p-4 transition-all hover:bg-accent/50",
                selected && "bg-accent/50 border-l-4 border-l-primary pl-3"
            )}
        >
            <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center shrink-0 border border-primary/2 text-primary/80">
                {location.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={location.image} alt={location.name} className="h-full w-full object-cover rounded-lg" />
                ) : (
                    <MapPin className="h-5 w-5" />
                )}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-base">{location.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{location.description || "No description"}</span>
                </div>
                {(location.subLocationsCount || 0) > 0 && (
                    <div className="mt-1">
                        <span className="text-sm font-bold text-muted-foreground hover:underline cursor-pointer">
                            {location.subLocationsCount} Sub-Locations &gt;
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

function SubLocationTree({ parentId, locations, onSelect }: { parentId: string; locations: Location[]; onSelect: (id: string) => void }) {
    const children = locations.filter(l => l.parentLocationId === parentId)

    if (children.length === 0) return null

    return (
        <div className="pl-4 border-l-2 border-muted ml-1 space-y-1">
            {children.map(child => (
                <SubLocationNode key={child.id} location={child} allLocations={locations} onSelect={onSelect} />
            ))}
        </div>
    )
}

function SubLocationNode({ location, allLocations, onSelect }: { location: Location; allLocations: Location[]; onSelect: (id: string) => void }) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const hasChildren = allLocations.some(l => l.parentLocationId === location.id)

    return (
        <div className="flex flex-col">
            <div
                className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
                <div className="flex items-center gap-2 flex-1">
                    {hasChildren ? (
                        <div
                            className="p-0.5 hover:bg-muted rounded cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsExpanded(!isExpanded)
                            }}
                        >
                            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", !isExpanded && "-rotate-90")} />
                        </div>
                    ) : (
                        <span className="w-4" />
                    )}
                    <div
                        className="flex items-center gap-2 flex-1"
                        onClick={() => onSelect(location.id)}
                    >
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium hover:underline">{location.name}</span>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <SubLocationTree parentId={location.id} locations={allLocations} onSelect={onSelect} />
            )}
        </div>
    )
}

function LocationDetail({ location, allLocations, onClose, onSelect }: { location: Location; allLocations: Location[]; onClose: () => void; onSelect: (id: string) => void }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = React.useState("details")
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })
    const tabsListRef = React.useRef<HTMLDivElement>(null)

    const subLocationsCount = countAllDescendants(location.id, allLocations)

    React.useEffect(() => {
        const updateIndicator = () => {
            const tabsList = tabsListRef.current
            if (!tabsList) return

            const activeTrigger = tabsList.querySelector(`[data-state="active"]`) as HTMLElement
            if (activeTrigger) {
                setIndicatorStyle({
                    left: activeTrigger.offsetLeft,
                    width: activeTrigger.offsetWidth
                })
            }
        }

        const timer = setTimeout(updateIndicator, 10)
        return () => clearTimeout(timer)
    }, [activeTab])

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-0 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onClose}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-2xl font-bold">{location.name}</h2>
                        <LinkIcon className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-primary border-primary/20 hover:bg-primary/5"
                        onClick={() => router.push(`/locations/${location.id}/edit`)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0 mt-6">
                <div className="px-6 border-b shrink-0">
                    <TabsList ref={tabsListRef} className="flex w-full justify-start gap-8 bg-transparent p-0 relative">
                        <TabsTrigger
                            value="details"
                            className="relative h-9 rounded-none border-0 bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex-none"
                        >
                            Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="relative h-9 rounded-none border-0 bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex-none"
                        >
                            History
                        </TabsTrigger>

                        {/* Sliding Indicator */}
                        <div
                            className="absolute bottom-0 h-[2px] bg-primary transition-all duration-300 ease-in-out"
                            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                        />
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <TabsContent value="details" className="m-0 p-6 space-y-8">

                        {/* Description Section */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Description</h3>
                            <p className="text-sm text-muted-foreground">
                                {location.description || "No description provided."}
                            </p>
                        </div>

                        <Separator />

                        {/* Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <h3 className="font-semibold">Address</h3>
                                <p className="text-sm text-muted-foreground">{location.address || "-"}</p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">Teams in Charge</h3>
                                <div className="flex flex-wrap gap-2">
                                    {location.teamsInCharge && location.teamsInCharge.length > 0 ? (
                                        location.teamsInCharge.map(team => (
                                            <Badge key={team} variant="secondary">{team}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">Vendor</h3>
                                <p className="text-sm text-muted-foreground">
                                    {Array.isArray(location.vendors)
                                        ? location.vendors.join(", ")
                                        : (location.vendors || "-")}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">Barcode</h3>
                                <div className="flex items-center gap-2">
                                    <QrCode className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{location.barcode || "-"}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Sub-Locations */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    Sub-Locations ({subLocationsCount})
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary h-auto p-0 hover:bg-transparent hover:text-primary/80"
                                    asChild
                                >
                                    <Link href={`/locations/new?parentId=${location.id}`}>
                                        <Plus className="mr-1 h-3 w-3" />
                                        Create Sub-Location
                                    </Link>
                                </Button>
                            </div>

                            <SubLocationTree parentId={location.id} locations={allLocations} onSelect={onSelect} />
                        </div>

                        <Separator />

                        {/* Assets Placeholder */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Assets
                            </h3>
                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                No assets in this location.
                                <Button variant="link" className="h-auto p-0 ml-1">Add Asset</Button>
                            </div>
                        </div>

                        {/* Created By */}
                        <div className="pt-4 text-xs text-muted-foreground flex items-center gap-1">
                            Created By <span className="font-medium text-foreground">Rafael Boeira</span> on 12/19/2025, 4:33 PM
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function countAllDescendants(parentId: string, allLocations: Location[]): number {
    let count = 0
    const children = allLocations.filter(l => l.parentLocationId === parentId)
    count += children.length
    for (const child of children) {
        count += countAllDescendants(child.id, allLocations)
    }
    return count
}

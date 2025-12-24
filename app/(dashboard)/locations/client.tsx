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
    ChevronRight,
    Printer,
    Download,
    Trash2
} from "lucide-react"
import QRCode from 'qrcode'

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
    const [teams, setTeams] = React.useState<any[]>([])
    const [filterConfig, setFilterConfig] = React.useState({
        name: "",
        asset: "",
        team: "",
        createdBy: ""
    })
    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

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
                    images: item.images || (item.image ? [item.image] : []),
                    files: item.files || []
                }))
                // Local Filtering
                // Note: ideally we should do this on backend, but for now we do client side as per request flow
                // We will filter based on the available data. For 'asset', we need assets data, which we don't fetch globally here.
                // However, the user asked for filtering. 
                // To do asset filtering efficiently without backend changes, we'd need to fetch all assets or rely on backend.
                // Assuming backend filtering isn't readily available for searching by asset name in location, 
                // we might need to fetch assets or just ignore the deep asset search for now and implement name/team/createdby.
                // WAIT, I can fetch all assets for the filtering logic if needed, or better, update the display list based on state.

                setLocationsList(prev => blockId ? [...prev, ...mappedItems] : mappedItems)
                setNextBlockId(data.next_block_id || null)
            }
        } catch (error) {
            console.error("Failed to fetch locations:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch assets for filtering purposes
    const [allAssets, setAllAssets] = React.useState<Asset[]>([])
    React.useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await fetch('/api/assets?limit=2000') // Fetch many for filtering
                const data = await res.json()
                if (data.items) {
                    setAllAssets(data.items.map((a: any) => ({ ...a, id: a._id || a.id })))
                }
            } catch (error) {
                console.error("Failed to fetch assets for filtering:", error)
            }
        }
        fetchAssets()
    }, [])

    const fetchTeams = React.useCallback(async () => {
        try {
            const res = await fetch('/api/teams')
            const data = await res.json()
            if (data.items) {
                setTeams(data.items.map((t: any) => ({ ...t, id: t._id || t.id })))
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error)
        }
    }, [])

    React.useEffect(() => {
        fetchLocations()
        fetchTeams()
    }, [fetchLocations, fetchTeams])

    const filteredLocations = React.useMemo(() => {
        const filtered = locationsList.filter(loc => {
            const matchName = filterConfig.name ? loc.name.toLowerCase().includes(filterConfig.name.toLowerCase()) : true
            const matchTeam = filterConfig.team ? (loc.teamsInCharge || []).some(tId => {
                const t = teams.find(team => team.id === tId)
                return t && t.name.toLowerCase().includes(filterConfig.team.toLowerCase())
            }) : true
            const matchCreatedBy = filterConfig.createdBy ? (loc.createdBy?.name || "").toLowerCase().includes(filterConfig.createdBy.toLowerCase()) : true
            let matchAsset = true
            if (filterConfig.asset) {
                const term = filterConfig.asset.toLowerCase()
                // Find assets that match the term
                const matchingAssets = allAssets.filter(a => a.name.toLowerCase().includes(term))
                // Check if this location contains any of those assets
                // Assuming assets have locationId
                const locationAssetIds = matchingAssets.filter(a => a.locationId === loc.id)
                matchAsset = locationAssetIds.length > 0
            }

            return matchName && matchTeam && matchCreatedBy && matchAsset
        })

        // Sorting
        return filtered.sort((a, b) => {
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
            } else if (sortConfig.key === 'createdAt') {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return sortConfig.direction === 'asc'
                    ? dateA - dateB
                    : dateB - dateA
            }
            return 0
        })
    }, [locationsList, filterConfig, teams, allAssets, sortConfig])

    const selectedLocation = React.useMemo(() => {
        return filteredLocations.find((l) => l.id === selectedId)
    }, [selectedId, filteredLocations])

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
                    <FilterButton label="Name" icon={Box} value={filterConfig.name} onChange={(val) => setFilterConfig(prev => ({ ...prev, name: val }))} />
                    <FilterButton label="Assets" icon={Network} value={filterConfig.asset} onChange={(val) => setFilterConfig(prev => ({ ...prev, asset: val }))} />
                    <FilterButton label="Teams" icon={Users} value={filterConfig.team} onChange={(val) => setFilterConfig(prev => ({ ...prev, team: val }))} />
                    <FilterButton label="Created By" icon={Users} value={filterConfig.createdBy} onChange={(val) => setFilterConfig(prev => ({ ...prev, createdBy: val }))} />

                    {(filterConfig.name || filterConfig.asset || filterConfig.team || filterConfig.createdBy) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterConfig({ name: "", asset: "", team: "", createdBy: "" })}
                            className="h-9 px-2 text-muted-foreground hover:text-foreground"
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Sort By:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground font-bold hover:bg-transparent hover:text-muted-foreground/80 gap-1">
                                {sortConfig.key === 'createdAt'
                                    ? (sortConfig.direction === 'desc' ? "Latest" : "Oldest")
                                    : (sortConfig.direction === 'asc' ? "Name: Ascending" : "Name: Descending")}
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>
                                Name: Ascending Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>
                                Name: Descending Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'createdAt', direction: 'desc' })}>
                                Latest (Default)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                {filteredLocations.filter(l => !l.parentLocationId).map((location) => {
                                    const calculatedSubLocationsCount = countAllDescendants(location.id, filteredLocations)
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
                                {filteredLocations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center p-12 text-center">
                                        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                            <MapPin className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">No locations found</h3>
                                        <p className="text-muted-foreground max-w-sm mb-6">
                                            Try adjusting your filters or create a new location.
                                        </p>
                                        <Button variant="ghost" onClick={() => setFilterConfig({ name: "", asset: "", team: "", createdBy: "" })}>
                                            Clear Filters
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
                        allLocations={filteredLocations}
                        teams={teams}
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

// Helper component for filter buttons
function FilterButton({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: string, onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant={value ? "secondary" : "outline"} size="sm" className="h-9 border-dashed">
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {label}
                    {value && <span className="ml-1 bg-background/50 px-1.5 py-0.5 rounded text-xs font-semibold">{value}</span>}
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold">{label}</Label>
                    <Input
                        placeholder={`Search ${label}...`}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8"
                        autoFocus
                    />
                </div>
            </PopoverContent>
        </Popover>
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

function LocationDetail({ location, allLocations, teams, onClose, onSelect }: { location: Location; allLocations: Location[]; teams: any[]; onClose: () => void; onSelect: (id: string) => void }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = React.useState("details")
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })
    const tabsListRef = React.useRef<HTMLDivElement>(null)
    const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("")
    const [assets, setAssets] = React.useState<Asset[]>([])
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

    const subLocationsCount = countAllDescendants(location.id, allLocations)

    // Fetch assets for this location
    React.useEffect(() => {
        const fetchLocationAssets = async () => {
            // In real app, querying by locationId would be better. For now we can fetch filtered list or all list.
            // We can use the existing /api/assets endpoint with filtering if supported, or just filter in client if we have data.
            // But to be safe and scalable, we should fetch. 
            // Assuming we have an endpoint that accepts ?limit=1000. 
            // Optimally we'd have ?locationId=... supported by backend.
            try {
                const res = await fetch('/api/assets?limit=1000')
                const data = await res.json()
                if (data.items) {
                    const locAssets = data.items.filter((a: any) => (a.locationId === location.id) || (a.locationId === location._id)) // check both IDs
                    setAssets(locAssets.map((a: any) => ({ ...a, id: a._id || a.id })))
                }
            } catch (error) {
                console.error("Failed to fetch location assets", error)
            }
        }
        if (location.id) fetchLocationAssets()
    }, [location.id])

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = `${window.location.origin}/locations?id=${location.id}`
            QRCode.toDataURL(url)
                .then(url => {
                    setQrCodeUrl(url)
                })
                .catch(err => {
                    console.error("Error generating QR code", err)
                })
        }
    }, [location.id])

    const handlePrintQr = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print QR Code - ${location.name}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        h2 { margin-bottom: 20px; font-size: 2em; }
                        img { max-width: 600px; width: 100%; height: auto; }
                        p { margin-top: 10px; font-weight: bold; font-size: 1.5em; }
                    </style>
                </head>
                <body>
                    <h2>${location.name}</h2>
                    <img src="${qrCodeUrl}" id="qr-img" />
                    <p>${location.barcode || location.id}</p>
                    <script>
                        // Wait for image to load before printing
                        document.getElementById('qr-img').onload = function() {
                             setTimeout(function() {
                                window.print();
                             }, 200);
                        }
                    </script>
                </body>
                </html>
             `);
            printWindow.document.close();
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/locations?id=${location.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete")
            // refresh page
            window.location.href = "/locations"
        } catch (error) {
            console.error(error)
            // toast error
        } finally {
            setIsDeleting(false)
        }
    }

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Location
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Location</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete <strong>{location.name}</strong>? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                                        location.teamsInCharge.map(teamId => {
                                            const team = teams.find(t => t.id === teamId)
                                            return team ? (
                                                <Badge key={teamId} variant="secondary">{team.name}</Badge>
                                            ) : (
                                                <Badge key={teamId} variant="outline" className="text-muted-foreground">UNKNOWN TEAM ({teamId})</Badge>
                                            )
                                        })
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
                                <div className="flex items-start gap-4">
                                    {qrCodeUrl ? (
                                        <div className="flex flex-col gap-2">
                                            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 border rounded-md" />
                                            <Button variant="outline" size="sm" onClick={handlePrintQr} className="w-full">
                                                <Printer className="w-3 h-3 mr-2" />
                                                Print
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-muted animate-pulse rounded-md" />
                                    )}
                                    <div className="flex flex-col gap-1 pt-1">
                                        <div className="flex items-center gap-2">
                                            <QrCode className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{location.barcode || (location.id ? `LOC-${location.id.substring(0, 8)}` : "-")}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground max-w-[150px]">
                                            Scan to view location details.
                                        </p>
                                    </div>
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

                        {/* Assets Section - Updated */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Assets ({assets.length})
                            </h3>
                            {assets.length > 0 ? (
                                <div className="space-y-2">
                                    {assets.map(asset => (
                                        <div key={asset.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20 hover:bg-muted/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-background border flex items-center justify-center text-xs font-bold">
                                                    {asset.name.substring(0, 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <Link href={`/assets?id=${asset.id}`} className="text-sm font-medium hover:underline">{asset.name}</Link>
                                                    <span className="text-xs text-muted-foreground">{asset.model || "No model"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn("text-xs font-normal", asset.status === 'Online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                                                    {asset.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-2">
                                        <Button variant="link" className="h-auto p-0 ml-1 text-primary" onClick={() => router.push(`/assets/new?locationId=${location.id}`)}>+ Add another Asset</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                    No assets in this location.
                                    <Button variant="link" className="h-auto p-0 ml-1 text-primary" onClick={() => router.push(`/assets/new?locationId=${location.id}`)}>Add Asset</Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="m-0 p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Activity History</h3>
                            <div className="border rounded-md divide-y">
                                {location.createdAt && (
                                    <div className="p-4 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>Created on {new Date(location.createdAt).toLocaleString()}</span>
                                        </div>
                                        {location.createdBy && (
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="text-[10px]">{location.createdBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span>Created by <span className="font-medium text-foreground">{location.createdBy.name}</span></span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {location.updatedAt && location.updatedAt !== location.createdAt && (
                                    <div className="p-4 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Edit className="h-4 w-4" />
                                            <span>Last updated on {new Date(location.updatedAt).toLocaleString()}</span>
                                        </div>
                                        {location.updatedBy && (
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="text-[10px]">{location.updatedBy.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span>Updated by <span className="font-medium text-foreground">{location.updatedBy.name}</span></span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!location.createdAt && (
                                    <div className="p-4 text-sm text-muted-foreground text-center">
                                        No history data available.
                                    </div>
                                )}
                            </div>
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

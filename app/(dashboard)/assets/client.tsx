"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
    Box,
    Filter,
    MoreVertical,
    Plus,
    Search,
    MapPin,
    QrCode,
    FileText,
    History,
    Settings,
    Network,
    ChevronDown,
    AlertCircle,
    Info,
    ArrowLeft,
    Briefcase,
    Clock,
    AlertTriangle,
    Link as LinkIcon,
    Edit,
    Loader2
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

import { assets, locations, Asset } from "@/lib/data"
import { cn } from "@/lib/utils"

const filterOptions = [
    { label: "Description", icon: FileText },
    { label: "Work Order Recurrence", icon: Clock },
    { label: "Asset", icon: Network },
    { label: "Location", icon: MapPin },
    { label: "Manufacturer", icon: Briefcase },
    { label: "Model", icon: FileText },
    { label: "Part", icon: Settings },
    { label: "Procedure", icon: FileText },
    { label: "Serial Number", icon: QrCode },
    { label: "Teams in Charge", icon: Network },
    { label: "Vendor", icon: Briefcase },
]

export function AssetsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")
    const [activeFilters, setActiveFilters] = React.useState<string[]>([])

    const [assetsList, setAssetsList] = React.useState<Asset[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [nextBlockId, setNextBlockId] = React.useState<string | null>(null)

    const fetchAssets = React.useCallback(async (blockId?: string) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (blockId) params.set('block_id', blockId)

            const res = await fetch(`/api/assets?${params.toString()}`)
            const data = await res.json()
            console.log("API Response:", data) // Debugging log

            if (data.items) {
                const mappedItems = data.items.map((item: any) => ({
                    ...item,
                    id: item.id || item._id, // Ensure ID is present
                    status: item.status || "Online", // Default status
                    subAssetsCount: item.subAssetsCount || 0 // Keep this, but we'll also calculate client-side
                }))
                setAssetsList(prev => blockId ? [...prev, ...mappedItems] : mappedItems)
                setNextBlockId(data.next_block_id || null)
            }
        } catch (error) {
            console.error("Failed to fetch assets:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchAssets()
    }, [fetchAssets])

    const selectedAsset = React.useMemo(() => {
        return assetsList.find((a) => a.id === selectedId)
    }, [selectedId, assetsList])

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("id", id)
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleAssetUpdate = (updatedAsset: Asset) => {
        setAssetsList(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a))
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:flex-row">
            {/* List View */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", selectedId ? "hidden w-full md:flex md:w-1/3 lg:w-[450px]" : "w-full md:w-[800px]")}>

                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
                    <Button asChild>
                        <Link href="/assets/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Asset
                        </Link>
                    </Button>
                </div>

                {/* Info Banner */}
                {assetsList.filter(a => !a.manufacturer || !a.model).length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start justify-between">
                        <div className="flex gap-3">
                            <Network className="h-5 w-5 text-primary/80 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    You have {assetsList.filter(a => !a.manufacturer || !a.model).length} Assets without a Manufacturer or Model
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 h-auto py-0 px-2 font-medium"
                            onClick={() => {
                                // Filter logic: we could add a new filter type or just filter the list locally.
                                // Since the list is client-side filtered for now (mostly), let's just add a special filter state or 
                                // simply filter the visible list. But `assetsList` is the source of truth.
                                // Let's add a "Missing Info" filter to `activeFilters` and handle it in the render loop?
                                // Or simpler: just set a state `showMissingInfoOnly`.
                                // But the user might want to clear it.
                                // Let's add "Missing Info" to activeFilters and handle it.
                                if (!activeFilters.includes("Missing Info")) {
                                    setActiveFilters([...activeFilters, "Missing Info"])
                                }
                            }}
                        >
                            Update Assets
                        </Button>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground">
                        <Network className="mr-2 h-3.5 w-3.5" />
                        Asset Type
                    </Button>

                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground">
                        <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                        Criticality
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground">
                        <Settings className="mr-2 h-3.5 w-3.5" />
                        Status
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground">
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        Downtime Reason
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground">
                        <History className="mr-2 h-3.5 w-3.5" />
                        Downtime Duration
                    </Button>

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
                        {isLoading && assetsList.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">Loading assets...</div>
                        ) : (
                            <>
                                {assetsList.filter(a => !a.parentAssetId).filter(a => {
                                    if (activeFilters.includes("Missing Info")) {
                                        return !a.manufacturer || !a.model
                                    }
                                    return true
                                }).map((asset) => {
                                    // Calculate sub-assets count from the loaded list recursively
                                    const calculatedSubAssetsCount = countAllDescendants(asset.id, assetsList)
                                    const displayCount = asset.subAssetsCount || calculatedSubAssetsCount

                                    return (
                                        <AssetCard
                                            key={asset.id || Math.random().toString()}
                                            asset={{ ...asset, subAssetsCount: displayCount }}
                                            selected={asset.id === selectedId}
                                            onClick={() => handleSelect(asset.id)}
                                        />
                                    )
                                })}
                                {assetsList.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No assets found.
                                    </div>
                                )}
                                {nextBlockId && (
                                    <div className="p-4 text-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => fetchAssets(nextBlockId)}
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
            {selectedAsset ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <AssetDetail
                        asset={selectedAsset}
                        allAssets={assetsList}
                        onClose={() => router.replace(pathname)}
                        onSelect={handleSelect}
                        onUpdate={handleAssetUpdate}
                    />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <Box className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">No Asset Selected</h3>
                        <p className="text-sm">Select an asset from the list to view details.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function AssetCard({ asset, selected, onClick }: { asset: Asset; selected: boolean; onClick: () => void }) {
    const location = locations.find((l) => l.id === asset.locationId)

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-start gap-4 p-4 transition-all hover:bg-accent/50",
                selected && "bg-accent/50 border-l-4 border-l-primary pl-3"
            )}
        >
            <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center shrink-0 border border-primary/2 text-primary/80">
                <Network className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-base">{asset.name}</span>
                    <div className="flex items-center gap-1.5">
                        <div className={cn("h-2 w-2 rounded-full", asset.status === "Online" ? "bg-green-500" : "bg-red-500")} />
                        <span className={cn("text-xs font-medium", asset.status === "Online" ? "text-green-600" : "text-red-600")}>
                            {asset.status}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">At {location?.name || "Unknown Location"}</span>
                </div>
                {(asset.subAssetsCount || 0) > 0 && (
                    <div className="mt-1">
                        <span className="text-sm font-bold text-muted-foreground hover:underline cursor-pointer">
                            {asset.subAssetsCount} Sub-Assets &gt;
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

function SubAssetTree({ parentId, assets, onSelect }: { parentId: string; assets: Asset[]; onSelect: (id: string) => void }) {
    const children = assets.filter(a => a.parentAssetId === parentId)

    if (children.length === 0) return null

    return (
        <div className="pl-4 border-l-2 border-muted ml-1 space-y-1">
            {children.map(child => (
                <SubAssetNode key={child.id} asset={child} allAssets={assets} onSelect={onSelect} />
            ))}
        </div>
    )
}

function SubAssetNode({ asset, allAssets, onSelect }: { asset: Asset; allAssets: Asset[]; onSelect: (id: string) => void }) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const hasChildren = allAssets.some(a => a.parentAssetId === asset.id)

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
                        onClick={() => onSelect(asset.id)}
                    >
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium hover:underline">{asset.name}</span>
                    </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-5", asset.status === "Online" ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200")}>
                    {asset.status}
                </Badge>
            </div>
            {isExpanded && (
                <SubAssetTree parentId={asset.id} assets={allAssets} onSelect={onSelect} />
            )}
        </div>
    )
}

function CreateSubAssetDialog({ parentAsset, open, onOpenChange }: { parentAsset: Asset; open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter()
    const [name, setName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleCreate = async () => {
        if (!name) return
        setIsLoading(true)
        try {
            const res = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    parentAssetId: parentAsset.id,
                    status: "Online",
                    locationId: parentAsset.locationId
                })
            })
            if (res.ok) {
                onOpenChange(false)
                setName("")
                router.refresh()
            }
        } catch (error) {
            console.error("Failed to create sub-asset:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Sub-Asset</DialogTitle>
                    <DialogDescription>
                        Create a new sub-asset for {parentAsset.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Parent Asset</Label>
                        <div className="text-sm text-muted-foreground">{parentAsset.name}</div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Sub-Asset Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter Sub-Asset Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="link"
                        className="w-fit p-0 h-auto text-primary"
                        onClick={() => {
                            onOpenChange(false)
                            router.push(`/assets/new?parentId=${parentAsset.id}&name=${encodeURIComponent(name)}`)
                        }}
                    >
                        Add More Info <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isLoading || !name}>
                        {isLoading ? "Creating..." : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AssetDetail({ asset, allAssets, onClose, onSelect, onUpdate }: { asset: Asset; allAssets: Asset[]; onClose: () => void; onSelect: (id: string) => void; onUpdate: (asset: Asset) => void }) {
    const router = useRouter()
    const location = locations.find((l) => l.id === asset.locationId)
    const [activeTab, setActiveTab] = React.useState("details")
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })
    const tabsListRef = React.useRef<HTMLDivElement>(null)
    const [isSubAssetDialogOpen, setIsSubAssetDialogOpen] = React.useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)

    const subAssetsCount = countAllDescendants(asset.id, allAssets)

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

        // Small timeout to ensure DOM is updated and layout is stable
        const timer = setTimeout(updateIndicator, 10)
        return () => clearTimeout(timer)
    }, [activeTab])

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true)
        try {
            const res = await fetch("/api/assets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: asset.id,
                    status: newStatus
                })
            })
            if (res.ok) {
                const updatedAsset = { ...asset, status: newStatus as any }
                onUpdate(updatedAsset)
                router.refresh()
            }
        } catch (error) {
            console.error("Failed to update status:", error)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Online": return "bg-green-500"
            case "Offline": return "bg-red-500"
            case "Do Not Track": return "bg-gray-500"
            default: return "bg-gray-500"
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "Online": return "bg-green-50 border-green-100 text-green-700"
            case "Offline": return "bg-red-50 border-red-100 text-red-700"
            case "Do Not Track": return "bg-gray-50 border-gray-100 text-gray-700"
            default: return "bg-gray-50 border-gray-100 text-gray-700"
        }
    }

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-0 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onClose}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-2xl font-bold">{asset.name}</h2>
                        <LinkIcon className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-primary border-primary/20 hover:bg-primary/5"
                        onClick={() => router.push(`/assets/${asset.id}/edit`)}
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

                        {/* Status Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    Status
                                    {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                </h3>
                                <Button variant="link" className="h-auto p-0 text-primary">See More &gt;</Button>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" disabled={isUpdatingStatus} className={cn("h-auto py-1.5 px-3 rounded-md border w-auto hover:bg-transparent", getStatusBadgeColor(asset.status))}>
                                        <div className={cn("h-2.5 w-2.5 rounded-full mr-2", getStatusColor(asset.status))} />
                                        <span className="font-medium text-sm">{asset.status}</span>
                                        <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => handleStatusChange("Online")}>
                                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                        Online
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("Offline")}>
                                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                                        Offline
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("Do Not Track")}>
                                        <div className="h-2 w-2 rounded-full bg-gray-500 mr-2" />
                                        Do Not Track
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <p className="text-xs text-muted-foreground">
                                Last updated: MaintainX, 12/20/2025, 3:47 AM
                            </p>
                        </div>

                        <Separator />

                        {/* Description Section */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Description</h3>
                            <p className="text-sm text-muted-foreground">
                                {asset.description || "No description provided."}
                            </p>
                        </div>

                        <Separator />

                        {/* Manufacturer Prompt */}
                        {!asset.manufacturer && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-4">
                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm">Add a Manufacturer and Model</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Help us recommend manuals, procedures, parts, and more for this Asset
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white text-primary border-primary/20 hover:bg-primary/5"
                                        onClick={() => router.push(`/assets/${asset.id}/edit?focus=manufacturer`)}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Fields */}
                        <div className="space-y-6">
                            {asset.manufacturer && (
                                <div className="space-y-1">
                                    <h3 className="font-semibold">Manufacturer</h3>
                                    <p className="text-sm text-muted-foreground">{asset.manufacturer}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <h3 className="font-semibold">Year</h3>
                                <p className="text-sm text-muted-foreground">{asset.year || "-"}</p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">Location</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {location?.name || "Unknown Location"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">Criticality</h3>
                                <p className="text-sm text-muted-foreground">{asset.criticality}</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Sub-Assets */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    Sub-Assets ({subAssetsCount})
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary h-auto p-0 hover:bg-transparent hover:text-primary/80"
                                    onClick={() => setIsSubAssetDialogOpen(true)}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Create Sub-Asset
                                </Button>
                            </div>

                            <SubAssetTree parentId={asset.id} assets={allAssets} onSelect={onSelect} />

                            {subAssetsCount > 0 && (
                                <Button variant="link" className="h-auto p-0 text-primary text-sm">See all &gt;</Button>
                            )}
                        </div>

                        <CreateSubAssetDialog
                            parentAsset={asset}
                            open={isSubAssetDialogOpen}
                            onOpenChange={setIsSubAssetDialogOpen}
                        />

                        <Separator />

                        {/* Automations */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Automations (0)</h3>
                            <div className="rounded-md bg-primary/5 border border-primary/20 p-3 flex items-center gap-2 text-sm text-primary">
                                <Info className="h-4 w-4" />
                                Add a Meter to this Asset to enable Automations.
                            </div>
                            <Button variant="outline" className="w-full justify-start text-primary border-dashed border-primary/30 hover:bg-primary/5">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Meter
                            </Button>
                        </div>

                        {/* Created By */}
                        <div className="pt-4 text-xs text-muted-foreground flex items-center gap-1">
                            Created By <span className="font-medium text-foreground">Rafael Boeira</span> on 12/20/2025, 3:47 AM
                        </div>

                    </TabsContent>

                    <TabsContent value="history" className="m-0 p-6">
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                            <History className="h-12 w-12 opacity-20 mb-4" />
                            <h3 className="text-lg font-semibold">No History</h3>
                            <p className="text-sm">No history events recorded for this asset yet.</p>
                        </div>
                    </TabsContent>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t flex justify-center shrink-0 bg-white z-10">
                    <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5 rounded-full px-6 shadow-sm">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Use in New Work Order
                    </Button>
                </div>
            </Tabs>
        </div>
    )
}

function countAllDescendants(assetId: string, allAssets: Asset[]): number {
    const children = allAssets.filter(a => a.parentAssetId === assetId);
    let count = children.length;
    for (const child of children) {
        count += countAllDescendants(child.id, allAssets);
    }
    return count;
}

"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import {
    Box,
    Filter,
    MoreVertical,
    Plus,
    Search,
    MapPin,
    QrCode as QrCodeIcon,
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
    Loader2,
    Users,
    Trash2,
    Printer
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

import { assets, locations, Asset } from "@/lib/data"
import { cn } from "@/lib/utils"

import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

import { useTranslations } from "next-intl"

export function AssetsClient() {
    const t = useTranslations('Assets')
    const searchParams = useSearchParams()

    const filterOptions = [
        { label: t('filter.asset'), icon: Network, type: "search", key: "asset" }, // Usually parent asset? or just name? User said "Assets" multi-select. I'll treat it as Parent Asset or similar.
        { label: t('filter.location'), icon: MapPin, type: "multi-select", key: "location" },
        { label: t('filter.teams'), icon: Users, type: "multi-select", key: "teams" }, // "Teams in Charge" -> "Teams"
        { label: t('filter.criticality'), icon: AlertTriangle, type: "multi-select", key: "criticality" },
        { label: t('filter.status'), icon: Settings, type: "multi-select", key: "status" },

        // Search filters
        { label: t('filter.name'), icon: Box, type: "search", key: "name" },
        { label: t('filter.model'), icon: FileText, type: "search", key: "model" },
        { label: t('filter.serialNumber'), icon: QrCodeIcon, type: "search", key: "serialNumber" },
        { label: t('filter.manufacturer'), icon: Briefcase, type: "search", key: "manufacturer" },
        { label: t('filter.vendor'), icon: Briefcase, type: "search", key: "vendor" },
    ]
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const [filterConfig, setFilterConfig] = React.useState<any>({
        name: "",
        model: "",
        serialNumber: "",
        manufacturer: "",
        vendor: "",
        location: [],
        teams: [],
        criticality: [],
        status: [],
        asset: "",
        missingInfo: false
    })

    const [activeFilterKeys, setActiveFilterKeys] = React.useState<string[]>([]) // To toggle visibility of filter buttons

    const [assetsList, setAssetsList] = React.useState<Asset[]>([])
    const [locationsList, setLocationsList] = React.useState<any[]>([])
    const [teamsList, setTeamsList] = React.useState<any[]>([])

    const [isLoading, setIsLoading] = React.useState(true)
    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

    // ... Fetch logic ...
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
        const loadData = async () => {
            await fetchAssets()

            // Fetch Locations
            try {
                const res = await fetch('/api/locations?limit=1000')
                const data = await res.json()
                if (data.items) setLocationsList(data.items.map((i: any) => ({ ...i, id: i.id || i._id })))
            } catch (e) { console.error(e) }

            // Fetch Teams
            try {
                const res = await fetch('/api/teams')
                const data = await res.json()
                if (data.items) setTeamsList(data.items.map((i: any) => ({ ...i, id: i.id || i._id })))
            } catch (e) { console.error(e) }
        }
        loadData()
    }, [fetchAssets])

    const filteredAssets = React.useMemo(() => {
        let filtered = assetsList.filter(asset => {
            // Search filters
            if (filterConfig.name && !asset.name.toLowerCase().includes(filterConfig.name.toLowerCase())) return false
            if (filterConfig.model && !asset.model?.toLowerCase().includes(filterConfig.model.toLowerCase())) return false
            if (filterConfig.manufacturer && !asset.manufacturer?.toLowerCase().includes(filterConfig.manufacturer.toLowerCase())) return false
            if (filterConfig.serialNumber && !asset.serialNumber?.toLowerCase().includes(filterConfig.serialNumber.toLowerCase())) return false
            if (filterConfig.vendor && !(asset.vendors || []).some((v: string) => v.toLowerCase().includes(filterConfig.vendor.toLowerCase()))) return false

            // Multi-select filters
            if (filterConfig.location.length > 0 && !filterConfig.location.includes(asset.locationId)) return false
            if (filterConfig.criticality.length > 0 && !filterConfig.criticality.includes(asset.criticality)) return false
            if (filterConfig.status.length > 0 && !filterConfig.status.includes(asset.status)) return false

            // Teams: check if asset.teamsInCharge has overlap with filterConfig.teams
            if (filterConfig.teams.length > 0) {
                const hasTeam = (asset.teamsInCharge || []).some((tId: string) => filterConfig.teams.includes(tId))
                if (!hasTeam) return false
            }

            // Missing Info
            if (filterConfig.missingInfo && (asset.manufacturer && asset.model)) return false

            return true
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
    }, [assetsList, filterConfig, sortConfig])

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
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <Button asChild>
                        <Link href="/assets/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('createAsset')}
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
                                    {t('missingInfoBanner', { count: assetsList.filter(a => !a.manufacturer || !a.model).length })}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 h-auto py-0 px-2 font-medium"
                            onClick={() => {
                                // Just check if filters are already set to find missing info
                                // Simplest way is a special filter or just manually setting them?
                                // Let's set a special "missingInfo" flag in filterConfig if needed, 
                                // or just pre-fill a "status" or something? 
                                // Actually, I should probably add a toggle for "Missing Info" or just filter manually here.
                                // For now, I'll just clear filters and maybe log it, or ideally 
                                // I should add a "missingInfo" boolean to filterConfig.
                                // Let's add it to state first.
                                setFilterConfig((prev: any) => ({ ...prev, missingInfo: true }))
                            }}
                        >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {t('updateAssets')}
                        </Button>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <FilterMultiSelect
                        label={t('filter.location')}
                        icon={MapPin}
                        options={locationsList.map(l => ({ label: l.name, value: l.id }))}
                        value={filterConfig.location}
                        onChange={(val) => setFilterConfig({ ...filterConfig, location: val })}
                    />
                    <FilterMultiSelect
                        label={t('filter.teams')}
                        icon={Users}
                        options={teamsList.map(t => ({ label: t.name, value: t.id }))}
                        value={filterConfig.teams}
                        onChange={(val) => setFilterConfig({ ...filterConfig, teams: val })}
                    />
                    <FilterMultiSelect
                        label={t('filter.criticality')}
                        icon={AlertTriangle}
                        options={["Low", "Medium", "High", "Critical"].map(c => ({ label: c, value: c }))}
                        value={filterConfig.criticality}
                        onChange={(val) => setFilterConfig({ ...filterConfig, criticality: val })}
                    />
                    <FilterMultiSelect
                        label={t('filter.status')}
                        icon={Settings}
                        options={["Online", "Offline", "Do Not Track"].map(s => ({ label: s, value: s }))}
                        value={filterConfig.status}
                        onChange={(val) => setFilterConfig({ ...filterConfig, status: val })}
                    />

                    {/* Dynamic Search Filters */}
                    {activeFilterKeys.map(key => {
                        const option = filterOptions.find(o => o.key === key)
                        if (!option || option.type !== 'search') return null
                        return (
                            <FilterSearch
                                key={key}
                                label={option.label}
                                icon={option.icon}
                                value={filterConfig[key] || ""}
                                onChange={(val) => setFilterConfig({ ...filterConfig, [key]: val })}
                                onRemove={() => {
                                    setFilterConfig({ ...filterConfig, [key]: "" })
                                    setActiveFilterKeys(prev => prev.filter(k => k !== key))
                                }}
                            />
                        )
                    })}

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary">
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                {t('addFilter')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder={t('searchPlaceholder')} />
                                <CommandList>
                                    <CommandEmpty>No filter found.</CommandEmpty>
                                    <CommandGroup>
                                        {filterOptions.filter(o => o.type === 'search' && !activeFilterKeys.includes(o.key)).map((option) => (
                                            <CommandItem
                                                key={option.label}
                                                value={option.label}
                                                onSelect={() => {
                                                    if (!activeFilterKeys.includes(option.key)) {
                                                        setActiveFilterKeys([...activeFilterKeys, option.key])
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

                    {(activeFilterKeys.length > 0 || filterConfig.location.length > 0 || filterConfig.teams.length > 0 || filterConfig.criticality.length > 0 || filterConfig.status.length > 0) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFilterConfig({
                                    name: "", model: "", serialNumber: "", manufacturer: "", vendor: "",
                                    location: [], teams: [], criticality: [], status: [], asset: ""
                                })
                                setActiveFilterKeys([])
                            }}
                            className="h-9 px-2 text-muted-foreground hover:text-foreground"
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            {t('clearFilters')}
                        </Button>
                    )}
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{t('sortBy')}:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground font-bold hover:bg-transparent hover:text-muted-foreground/80 gap-1">
                                {sortConfig.key === 'createdAt'
                                    ? (sortConfig.direction === 'desc' ? t('sortOptions.latest') : t('sortOptions.oldest'))
                                    : (sortConfig.direction === 'asc' ? t('sortOptions.nameAsc') : t('sortOptions.nameDesc'))}
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>
                                {t('sortOptions.nameAsc')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>
                                {t('sortOptions.nameDesc')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'createdAt', direction: 'desc' })}>
                                {t('sortOptions.latest')} (Default)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <ScrollArea className="flex-1 border rounded-md bg-card">
                    <div className="flex flex-col divide-y">
                        {isLoading && assetsList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-muted-foreground animate-pulse">Loading assets...</p>
                            </div>
                        ) : (
                            <>
                                {filteredAssets.filter(a => !a.parentAssetId).map((asset) => { // User filteredAssets instead of assetsList
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
                                    <div className="flex flex-col items-center justify-center p-12 text-center">
                                        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                            <Network className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">{t('noAssets')}</h3>
                                        <p className="text-muted-foreground max-w-sm mb-6">
                                            {t('getStarted')}
                                        </p>
                                        <Button asChild>
                                            <Link href="/assets/new">
                                                <Plus className="mr-2 h-4 w-4" />
                                                {t('createAsset')}
                                            </Link>
                                        </Button>
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
            {
                selectedAsset ? (
                    <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                        <AssetDetail
                            asset={selectedAsset}
                            allAssets={assetsList}
                            onClose={() => router.replace(pathname)}
                            onSelect={handleSelect}
                            onUpdate={handleAssetUpdate}
                            refetch={() => fetchAssets()}
                        />
                    </div>
                ) : (
                    <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                            <Box className="h-12 w-12 opacity-20" />
                            <h3 className="text-lg font-semibold">{t('noSelection')}</h3>
                            <p className="text-sm">{t('selectToView')}</p>
                        </div>
                    </div>
                )
            }
        </div >
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
                            {/* We can't use hook in this component if it's not exported/wrapped or we need to pass t from parent */}
                            {/* But here we are in same file, so we can't easily reuse t unless we pass it down or use hook again */}
                            {/* Best practice is to pass 't' or use hook in each component */}
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

function CreateSubAssetDialog({ parentAsset, open, onOpenChange, onSuccess }: { parentAsset: Asset; open: boolean; onOpenChange: (open: boolean) => void; onSuccess?: () => void }) {
    const t = useTranslations('Assets')
    const tCommon = useTranslations('Common')
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
                if (onSuccess) onSuccess()
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
                    <DialogTitle>{t('newSubAsset')}</DialogTitle>
                    <DialogDescription>
                        {t('createSubAssetDesc', { parentName: parentAsset.name })}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Parent Asset</Label>
                        <div className="text-sm text-muted-foreground">{parentAsset.name}</div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('subAssetName')}</Label>
                        <Input
                            id="name"
                            placeholder={t('enterSubAssetName')}
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
                        {t('addMoreInfo')} <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon('cancel')}</Button>
                    <Button onClick={handleCreate} disabled={isLoading || !name}>
                        {isLoading ? t('creating') : t('create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AssetDetail({ asset, allAssets, onClose, onSelect, onUpdate, refetch }: { asset: Asset; allAssets: Asset[]; onClose: () => void; onSelect: (id: string) => void; onUpdate: (asset: Asset) => void; refetch: () => void }) {
    const t = useTranslations('AssetDetail')
    const tCommon = useTranslations('Common')
    const router = useRouter()
    const location = locations.find((l) => l.id === asset.locationId)
    const [activeTab, setActiveTab] = React.useState("details")
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })
    const tabsListRef = React.useRef<HTMLDivElement>(null)
    const [isSubAssetDialogOpen, setIsSubAssetDialogOpen] = React.useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("")

    const subAssetsCount = countAllDescendants(asset.id, allAssets)

    React.useEffect(() => {
        if (typeof window !== 'undefined' && asset.id) {
            const url = `${window.location.origin}/assets?id=${asset.id}`
            QRCode.toDataURL(url)
                .then(url => {
                    setQrCodeUrl(url)
                })
                .catch(err => {
                    console.error("Error generating QR code", err)
                })
        }
    }, [asset.id])

    const handlePrintQr = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print QR Code - ${asset.name}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        h2 { margin-bottom: 20px; font-size: 2em; }
                        img { max-width: 600px; width: 100%; height: auto; }
                        p { margin-top: 10px; font-weight: bold; font-size: 1.5em; }
                    </style>
                </head>
                <body>
                    <h2>${asset.name}</h2>
                    <img src="${qrCodeUrl}" id="qr-img" />
                    <p>${asset.barcode || asset.id}</p>
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
            const res = await fetch(`/api/assets?id=${asset.id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                // Refresh list and deselect
                onSelect("") // clear selection
                refetch() // Refetch the list
                router.push('/assets') // Go back to list URL
            } else {
                console.error("Failed to delete")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
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
        <div className="flex h-full flex-col bg-card">
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
                        {t('actions.edit')}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('actions.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('dialog.deleteTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('dialog.deleteDesc', { name: asset.name })}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('dialog.cancel')}</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {t('dialog.confirmDelete')}
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
                            {t('tabs.details')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="relative h-9 rounded-none border-0 bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex-none"
                        >
                            {t('tabs.history')}
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
                                    {t('sections.status')}
                                    {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                </h3>
                                <Button variant="link" className="h-auto p-0 text-primary">{t('actions.seeMore')} &gt;</Button>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" disabled={isUpdatingStatus} className={cn("h-auto py-1.5 px-3 rounded-md border w-auto hover:bg-transparent", getStatusBadgeColor(asset.status))}>
                                        <div className={cn("h-2.5 w-2.5 rounded-full mr-2", getStatusColor(asset.status))} />
                                        <span className="font-medium text-sm">{t(`status.${asset.status}` as any)}</span>
                                        <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => handleStatusChange("Online")}>
                                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                        {t('status.Online')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("Offline")}>
                                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                                        {t('status.Offline')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("Do Not Track")}>
                                        <div className="h-2 w-2 rounded-full bg-gray-500 mr-2" />
                                        {t('status.Do Not Track')}
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
                            <h3 className="font-semibold">{t('sections.description')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {asset.description || tCommon('noDescription') || "No description provided."}
                            </p>
                        </div>

                        <Separator />

                        {/* Manufacturer Prompt */}
                        {!asset.manufacturer && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-4">
                                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm">{t('prompt.addManModel')}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {t('prompt.addManModelDesc')}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white text-primary border-primary/20 hover:bg-primary/5"
                                        onClick={() => router.push(`/assets/${asset.id}/edit?focus=manufacturer`)}
                                    >
                                        {t('actions.add')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Fields */}
                        <div className="space-y-6">
                            {asset.manufacturer && (
                                <div className="space-y-1">
                                    <h3 className="font-semibold">{t('sections.manufacturer')}</h3>
                                    <p className="text-sm text-muted-foreground">{asset.manufacturer}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <h3 className="font-semibold">{t('sections.year')}</h3>
                                <p className="text-sm text-muted-foreground">{asset.year || "-"}</p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">{t('sections.location')}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {location?.name || "Unknown Location"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">{t('sections.criticality')}</h3>
                                <p className="text-sm text-muted-foreground">{asset.criticality}</p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">{t('sections.barcode')}</h3>
                                <div className="flex items-start gap-4">
                                    {qrCodeUrl ? (
                                        <div className="flex flex-col gap-2">
                                            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 border rounded-md" />
                                            <Button variant="outline" size="sm" onClick={handlePrintQr} className="w-full">
                                                <Printer className="w-3 h-3 mr-2" />
                                                {t('actions.print')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-muted animate-pulse rounded-md" />
                                    )}
                                    <div className="flex flex-col gap-1 pt-1">
                                        <div className="flex items-center gap-2">
                                            <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{asset.barcode || (asset.id ? `AST-${asset.id.substring(0, 8)}` : "-")}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground max-w-[150px]">
                                            Scan to view asset details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Images & Files */}
                        {(asset.images?.length || 0) > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold">{t('sections.pictures')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {asset.images?.map((url, i) => (
                                        <div key={i} className="aspect-video rounded-lg border bg-muted overflow-hidden">
                                            <img src={url} alt={`Asset ${i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                            </div>
                        )}

                        {(asset.files?.length || 0) > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold">{t('sections.files')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {asset.files?.map((file, i) => (
                                        <Button key={i} variant="outline" className="h-auto py-2 px-3 gap-2" asChild>
                                            <a href={file} target="_blank" rel="noopener noreferrer">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="max-w-[150px] truncate">{file.split('/').pop() || "File"}</span>
                                            </a>
                                        </Button>
                                    ))}
                                </div>
                                <Separator />
                            </div>
                        )}

                        {/* Sub-Assets */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    {t('sections.subAssets')} ({subAssetsCount})
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary h-auto p-0 hover:bg-transparent hover:text-primary/80"
                                    onClick={() => setIsSubAssetDialogOpen(true)}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    {t('actions.createSubAsset')}
                                </Button>
                            </div>

                            <SubAssetTree parentId={asset.id} assets={allAssets} onSelect={onSelect} />

                            {/* {subAssetsCount > 0 && (
                                <Button variant="link" className="h-auto p-0 text-primary text-sm">See all &gt;</Button>
                            )} */}
                        </div>

                        <CreateSubAssetDialog
                            parentAsset={asset}
                            open={isSubAssetDialogOpen}
                            onOpenChange={setIsSubAssetDialogOpen}
                            onSuccess={refetch}
                        />

                        <Separator />

                        <Separator />
                    </TabsContent>

                    <TabsContent value="history" className="m-0 p-6">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-green-100 p-2 rounded-full">
                                    <Plus className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{t('history.created')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('history.by', { user: asset.createdBy?.name || "Unknown User", date: asset.createdAt ? new Date(asset.createdAt).toLocaleString() : "Unknown Date" })}
                                    </p>
                                </div>
                            </div>

                            {asset.updatedAt && (
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-blue-100 p-2 rounded-full">
                                        <Edit className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{t('history.updated')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('history.by', { user: asset.updatedBy?.name || "Unknown User", date: new Date(asset.updatedAt).toLocaleString() })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(!asset.createdAt && !asset.updatedAt) && (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                                    <History className="h-12 w-12 opacity-20 mb-4" />
                                    <h3 className="text-lg font-semibold">{t('history.noHistory')}</h3>
                                    <p className="text-sm">{t('history.noHistoryDesc')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t flex justify-center shrink-0 bg-white z-10">
                    <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5 rounded-full px-6 shadow-sm">
                        <Briefcase className="mr-2 h-4 w-4" />
                        {t('actions.useInWorkOrder')}
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

function FilterMultiSelect({
    label,
    icon: Icon,
    options,
    value,
    onChange
}: {
    label: string;
    icon: any;
    options: { label: string; value: string }[];
    value: string[];
    onChange: (val: string[]) => void;
}) {
    const isActive = value.length > 0

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 border-dashed text-muted-foreground", isActive && "bg-accent text-accent-foreground border-solid")}>
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {label}
                    {isActive && (
                        <div className="ml-1 flex items-center">
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {value.length}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {value.length > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {value.length} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => value.includes(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Filter by {label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                    {options.map((option) => {
                        const isSelected = value.includes(option.value)
                        return (
                            <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={isSelected}
                                onCheckedChange={() => {
                                    if (isSelected) {
                                        onChange(value.filter((val) => val !== option.value))
                                    } else {
                                        onChange([...value, option.value])
                                    }
                                }}
                            >
                                <span className={cn(isSelected ? "font-medium" : "")}>{option.label}</span>
                            </DropdownMenuCheckboxItem>
                        )
                    })}
                </ScrollArea>
                {isActive && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onChange([])}
                            className="justify-center text-center"
                        >
                            Clear filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function FilterSearch({
    label,
    icon: Icon,
    value,
    onChange,
    onRemove
}: {
    label: string;
    icon: any;
    value: string;
    onChange: (val: string) => void;
    onRemove: () => void;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 border-dashed text-muted-foreground", value && "bg-accent text-accent-foreground border-solid")}>
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {label}
                    {value && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <span className="font-normal">{value}</span>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-2" align="start">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        {label}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`Search ${label}...`}
                            className="h-8"
                            autoFocus
                        />
                        {value && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

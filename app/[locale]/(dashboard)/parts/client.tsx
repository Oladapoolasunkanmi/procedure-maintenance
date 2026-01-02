"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import {
    Plus,
    Search,
    ChevronDown,
    Trash2,
    Loader2,
    MapPin,
    Box,
    FileText,
    MoreVertical,
    Factory,
    QrCode as QrCodeIcon,
    RefreshCw,
    Edit,
    ExternalLink,
    Printer,
    Minus,
    Upload,
    CloudUpload
} from "lucide-react"
import QRCode from "qrcode"

import { UsePartButton } from "./use-part-button"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { TreeSelect, buildTree } from "@/components/ui/tree-select"

// Types
type Part = {
    id: string
    name: string
    unitCost: number
    description?: string
    barcode?: string
    partType?: string
    locationConfig?: { locationId: string, area: string, quantity: number, minStock: number }[]
    assetIds?: string[]
    assignedTeamIds?: string[]
    vendorIds?: string[]
    files?: string[]
    createdAt?: string
}

import { useTranslations } from "next-intl"

export function PartsClient() {
    const t = useTranslations('Parts')
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const [selectedId, setSelectedId] = React.useState<string | null>(searchParams.get("id"))

    const [partsList, setPartsList] = React.useState<Part[]>([])
    const [locations, setLocations] = React.useState<any[]>([])
    const [locationsTree, setLocationsTree] = React.useState<any[]>([])
    const [assets, setAssets] = React.useState<any[]>([])
    const [vendors, setVendors] = React.useState<any[]>([])
    const [teams, setTeams] = React.useState<any[]>([])
    const [partTypes, setPartTypes] = React.useState<string[]>([])

    const [isLoading, setIsLoading] = React.useState(true)

    // Filters
    const [filterName, setFilterName] = React.useState("")
    const [filterType, setFilterType] = React.useState<string>("all")
    const [filterLocation, setFilterLocation] = React.useState<string>("all")
    const [filterAsset, setFilterAsset] = React.useState<string>("all")
    const [filterVendor, setFilterVendor] = React.useState<string>("all")
    const [filterArea, setFilterArea] = React.useState("")

    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch Parts
                const pRes = await fetch('/api/parts?limit=1000')
                const pData = await pRes.json()
                if (pData.items) {
                    // Normalize ID to be 'id' (CosmosDB) primarily
                    setPartsList(pData.items.map((p: any) => ({ ...p, id: p.id || p._id })))
                }

                // Fetch Locations
                const lRes = await fetch('/api/locations?limit=1000')
                const lData = await lRes.json()
                if (lData.items) {
                    setLocations(lData.items)
                    setLocationsTree(buildTree(lData.items))
                }

                // Fetch Assets
                const aRes = await fetch('/api/assets?limit=1000')
                const aData = await aRes.json()
                if (aData.items) setAssets(aData.items)

                // Fetch Vendors
                const vRes = await fetch('/api/vendors?limit=1000')
                const vData = await vRes.json()
                if (vData.items) setVendors(vData.items)

                // Fetch Teams
                const tRes = await fetch('/api/teams?limit=1000')
                const tData = await tRes.json()
                if (tData.items) setTeams(tData.items)

                // Fetch Part Types
                const ptRes = await fetch('/api/part-types?limit=1000')
                const ptData = await ptRes.json()
                if (ptData.items) setPartTypes(ptData.items.map((t: any) => t.name))

            } catch (error) {
                console.error("Failed to fetch data", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Update selectedId from URL changes
    React.useEffect(() => {
        setSelectedId(searchParams.get("id"))
    }, [searchParams])

    const filteredParts = React.useMemo(() => {
        let filtered = partsList.filter(p => {
            if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false
            if (filterType !== "all" && p.partType !== filterType) return false

            // Location Filter (check if any location config matches)
            if (filterLocation !== "all" && !(p.locationConfig || []).some(lc => lc.locationId === filterLocation)) return false

            // Asset Filter
            if (filterAsset !== "all" && !(p.assetIds || []).includes(filterAsset)) return false

            // Vendor Filter
            if (filterVendor !== "all" && !(p.vendorIds || []).includes(filterVendor)) return false

            // Area Filter
            if (filterArea && !(p.locationConfig || []).some(lc => lc.area?.toLowerCase().includes(filterArea.toLowerCase()))) return false

            return true
        })

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
    }, [partsList, filterName, filterType, filterLocation, filterAsset, filterVendor, filterArea, sortConfig])

    const selectedPart = React.useMemo(() => {
        return partsList.find(p => p.id === selectedId)
    }, [selectedId, partsList])

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("id", id)
        router.push(`${pathname}?${params.toString()}`)
    }

    // Helper to sum stock
    const getTotalStock = (part: Part) => {
        return (part.locationConfig || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0)
    }

    const hasActiveFilters = filterName || filterType !== "all" || filterLocation !== "all" || filterAsset !== "all" || filterVendor !== "all" || filterArea

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:flex-row">
            {/* List View */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", selectedId ? "hidden w-full md:flex md:w-1/3 lg:w-[450px]" : "w-full md:w-[800px]")}>
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <Button asChild onClick={() => router.push('/parts/new')}>
                        <Link href="/parts/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('create')}
                        </Link>
                    </Button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex flex-row items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {/* Part Type Filter */}
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filters.type')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                                {partTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Location Filter */}
                        <Select value={filterLocation} onValueChange={setFilterLocation}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filters.location')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filters.allLocations')}</SelectItem>
                                {locations.map((l: any) => (
                                    <SelectItem key={l._id || l.id} value={l._id || l.id}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Area Filter */}
                        <Input
                            placeholder={t('filters.area')}
                            value={filterArea}
                            onChange={(e) => setFilterArea(e.target.value)}
                            className="w-[120px] shrink-0"
                        />

                        {/* Asset Filter */}
                        <Select value={filterAsset} onValueChange={setFilterAsset}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filters.asset')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filters.allAssets')}</SelectItem>
                                {assets.map((a: any) => (
                                    <SelectItem key={a._id || a.id} value={a._id || a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Vendor Filter */}
                        <Select value={filterVendor} onValueChange={setFilterVendor}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filters.vendor')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filters.allVendors')}</SelectItem>
                                {vendors.map((v: any) => (
                                    <SelectItem key={v._id || v.id} value={v._id || v.id}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFilterName("")
                                    setFilterType("all")
                                    setFilterLocation("all")
                                    setFilterAsset("all")
                                    setFilterVendor("all")
                                    setFilterArea("")
                                }}
                                className="shrink-0 h-9"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t('filters.clear')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>{t('sortBy.label')}:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground font-bold hover:bg-transparent hover:text-muted-foreground/80 gap-1">
                                    {sortConfig.key === 'createdAt'
                                        ? (sortConfig.direction === 'desc' ? t('sortBy.newest') : t('sortBy.oldest'))
                                        : (sortConfig.direction === 'asc' ? t('sortBy.nameAsc') : t('sortBy.nameDesc'))}
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>{t('sortBy.nameAsc')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>{t('sortBy.nameDesc')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'createdAt', direction: 'desc' })}>{t('sortBy.newest')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'createdAt', direction: 'asc' })}>{t('sortBy.oldest')}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <span className="text-xs">{t('results', { count: filteredParts.length })}</span>
                </div>

                <ScrollArea className="flex-1 border rounded-md bg-card">
                    <div className="flex flex-col divide-y">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : filteredParts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Box className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">{t('empty.title')}</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">{t('empty.description')}</p>
                            </div>
                        ) : (
                            filteredParts.map(part => (
                                <PartCard
                                    key={part.id}
                                    part={part}
                                    selected={part.id === selectedId}
                                    onClick={() => handleSelect(part.id)}
                                    totalStock={getTotalStock(part)}
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border-none bg-background shadow-none transition-all duration-300", !selectedId && "hidden md:flex")}>
                {selectedPart ? (
                    <PartDetail
                        part={selectedPart}
                        onClose={() => router.replace(pathname)}
                        locations={locations}
                        locationTree={locationsTree}
                        assets={assets}
                        teams={teams}
                        vendors={vendors}
                        totalStock={getTotalStock(selectedPart)}
                    />
                ) : (
                    <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                            <Box className="h-12 w-12 opacity-20" />
                            <h3 className="text-lg font-semibold">No Part Selected</h3>
                            <p className="text-sm">Select a part to view details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function PartCard({ part, selected, onClick, totalStock }: { part: Part; selected: boolean; onClick: () => void; totalStock: number }) {
    const t = useTranslations('Parts')
    return (
        <div
            className={cn(
                "flex items-start gap-4 p-4 transition-all hover:bg-accent/50 group cursor-pointer",
                selected && "bg-accent/50 border-l-4 border-l-primary pl-3"
            )}
            onClick={onClick}
        >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border bg-muted font-bold text-muted-foreground`}>
                {part.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-base">{part.name}</span>
                    <Badge variant={totalStock > 0 ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5">
                        {totalStock} {t('card.inStock')}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                    {part.partType && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                            {part.partType}
                        </Badge>
                    )}
                </div>
                {part.description && (
                    <p className="text-xs text-muted-foreground truncate">{part.description}</p>
                )}
            </div>
        </div>
    )
}

function PartDetail({ part, onClose, locations, locationTree, assets, teams, vendors, totalStock }: { part: Part; onClose: () => void; locations: any[]; locationTree: any[]; assets: any[]; teams: any[]; vendors: any[]; totalStock: number }) {
    const router = useRouter()
    const t = useTranslations('Parts')
    const { toast } = useToast()
    const [qrDataUrl, setQrDataUrl] = React.useState<string>("")

    // Restock State
    const [restockOpen, setRestockOpen] = React.useState(false)
    const [restockAmount, setRestockAmount] = React.useState(0)
    const [restockLocation, setRestockLocation] = React.useState<string>("")
    const [restockNote, setRestockNote] = React.useState("")
    const [restockFiles, setRestockFiles] = React.useState<string[]>([])
    const [restockLoading, setRestockLoading] = React.useState(false)
    const [isUploadingRestock, setIsUploadingRestock] = React.useState(false)

    // Initialize default Restock Location if available
    React.useEffect(() => {
        if (part.locationConfig && part.locationConfig.length > 0) {
            setRestockLocation(part.locationConfig[0].locationId)
        }
    }, [part, restockOpen])

    React.useEffect(() => {
        if (part.barcode) {
            QRCode.toDataURL(part.barcode)
                .then(url => setQrDataUrl(url))
                .catch(err => console.error(err))
        }
    }, [part.barcode])

    const handleDelete = async () => {
        try {
            await fetch(`/api/parts?id=${part.id}`, { method: 'DELETE' })
            onClose()
            window.location.reload()
        } catch (error) {
            console.error("Failed to delete part", error)
        }
    }

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>Print QR Code - ${part.name}</title></head>
                    <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
                        <h1>${part.name}</h1>
                        <img src="${qrDataUrl}" width="300" />
                        <p>${part.barcode}</p>
                    </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }

    const handleRestockFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploadingRestock(true)
        try {
            const newUrls: string[] = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)
                const timestamp = Date.now()
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                formData.append('path', `parts/restock/${timestamp}_${cleanName}`)

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    if (data.url) newUrls.push(data.url)
                    else if (data.path) newUrls.push(`/api/image?path=${encodeURIComponent(data.path)}`)
                }
            }
            setRestockFiles(prev => [...prev, ...newUrls])
        } catch (error) {
            console.error("Upload failed", error)
            toast({ title: "Upload failed", variant: "destructive" })
        } finally {
            setIsUploadingRestock(false)
        }
    }

    const handleRestock = async () => {
        if (!restockLocation) {
            toast({ title: "Please select a location", variant: "destructive" })
            return
        }

        setRestockLoading(true)
        try {
            // Optimistic Update kind of logic (in real world should be a dedicated transaction endpoint)
            const updatedConfig = part.locationConfig ? [...part.locationConfig] : []
            const locIndex = updatedConfig.findIndex(l => l.locationId === restockLocation)

            if (locIndex >= 0) {
                updatedConfig[locIndex] = {
                    ...updatedConfig[locIndex],
                    quantity: (updatedConfig[locIndex].quantity || 0) + restockAmount
                }
            } else {
                // Should not theoretically happen if we select from existing, but safety first
                updatedConfig.push({ locationId: restockLocation, area: "", quantity: restockAmount, minStock: 0 })
            }

            // Prepare payload: strip system fields and update
            const { id: _id, _rid, _self, _etag, _attachments, _ts, ...cleanPart } = part as any

            // Re-construct part with safe fields
            const payloadPart = {
                ...cleanPart,
                // Ensure ID is present if it was in 'id' or '_id'
                id: part.id,
                locationConfig: updatedConfig,
                files: [...(cleanPart.files || []), ...restockFiles]
            }

            console.log(payloadPart)

            const res = await fetch('/api/parts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadPart)
            })

            if (!res.ok) throw new Error("Failed to update stock")

            toast({ title: "Stock updated successfully" })
            setRestockOpen(false)
            setRestockAmount(0)
            setRestockNote("")
            setRestockFiles([]) // Clear uploaded files

            // To refresh content, we might reload or router.refresh
            router.refresh()
            window.location.reload()

        } catch (error) {
            console.error(error)
            toast({ title: "Failed to update stock", variant: "destructive" })
        } finally {
            setRestockLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b shrink-0 bg-background z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <Search className="h-4 w-4" />
                    </Button>
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-muted font-bold text-lg">
                        {part.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg leading-none">{part.name}</h2>
                        {totalStock > 0 ? (
                            <p className="text-sm text-muted-foreground mt-1">{totalStock} {t('card.inStock')}</p>
                        ) : (
                            <p className="text-sm text-destructive mt-1">{t('card.outOfStock')}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden md:flex">
                                <Plus className="mr-2 h-3.5 w-3.5" /> {t('detail.restock')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('detail.restockDialog.title')}</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-6 py-4">
                                {/* Quantity Control */}
                                <div className="flex justify-center items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 rounded-full border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setRestockAmount(prev => prev - 1)}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        className="w-24 text-center text-lg h-10"
                                        value={restockAmount}
                                        onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 rounded-full border-green-200 text-green-500 hover:text-green-600 hover:bg-green-50"
                                        onClick={() => setRestockAmount(prev => prev + 1)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Location Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('detail.restockDialog.location')}</label>
                                    <TreeSelect
                                        data={locationTree}
                                        selectedIds={restockLocation ? [restockLocation] : []}
                                        onSelect={(ids) => setRestockLocation(ids[0] || "")}
                                        placeholder={t('detail.restockDialog.selectLocation')}
                                        singleSelect
                                    />
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('detail.restockDialog.notePlaceholder')}</label>
                                    <Textarea
                                        placeholder={t('detail.restockDialog.note')}
                                        value={restockNote}
                                        onChange={(e) => setRestockNote(e.target.value)}
                                        className="resize-none"
                                    />
                                </div>

                                {/* File Upload Custom Style (Orange) */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {restockFiles.map((url, idx) => (
                                            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                                <span className="max-w-[100px] truncate">{url.split('/').pop()}</span>
                                                <button onClick={() => setRestockFiles(restockFiles.filter((_, i) => i !== idx))} className="ml-1 hover:text-destructive">
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="border-2 border-dashed border-orange-200 rounded-lg p-6 flex flex-col items-center justify-center bg-orange-50/20 hover:bg-orange-50/50 transition-colors cursor-pointer group relative">
                                        <input
                                            type="file"
                                            multiple
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleRestockFileUpload}
                                            disabled={isUploadingRestock}
                                        />
                                        <div className="bg-orange-100 p-3 rounded-full mb-3 group-hover:bg-orange-200 transition-colors">
                                            {isUploadingRestock ? (
                                                <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                                            ) : (
                                                <CloudUpload className="h-6 w-6 text-orange-500" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-orange-500">
                                            {isUploadingRestock ? t('detail.restockDialog.uploading') : t('detail.restockDialog.upload')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost">{t('detail.restockDialog.cancel')}</Button>
                                </DialogClose>
                                <Button onClick={handleRestock} disabled={restockLoading || isUploadingRestock}>
                                    {(restockLoading || isUploadingRestock) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('detail.restockDialog.confirm')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" asChild className="hidden md:flex">
                        <Link href={`/parts/${part.id}/edit`}>
                            <Edit className="mr-2 h-3.5 w-3.5" /> {t('detail.edit')}
                        </Link>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRestockOpen(true)} className="md:hidden">Restock</DropdownMenuItem>
                            <DropdownMenuItem asChild className="md:hidden">
                                <Link href={`/parts/${part.id}/edit`} className="w-full flex items-center">
                                    Edit Part
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Dialog>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                        {t('detail.delete')}
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('detail.deleteDialog.title')}</DialogTitle>
                                        <DialogDescription>
                                            {t('detail.deleteDialog.description', { name: part.name })}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">{t('detail.deleteDialog.cancel')}</Button>
                                        </DialogClose>
                                        <Button variant="destructive" onClick={handleDelete}>
                                            {t('detail.deleteDialog.confirm')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8 pb-24">
                    {/* Details Header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b">
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('detail.sections.minStock')}</h4>
                            <p className="text-sm font-medium">
                                {part.locationConfig?.reduce((acc, curr) => acc + (curr.minStock || 0), 0) || 0} units
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('detail.sections.unitCost')}</h4>
                            <p className="text-sm font-medium">${part.unitCost?.toFixed(2)}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('detail.sections.partType')}</h4>
                            <p className="text-sm font-medium text-orange-500">{part.partType || "General"}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('detail.sections.available')}</h4>
                            <p className="text-sm font-medium">{totalStock} units</p>
                        </div>
                    </div>

                    {/* Locations Table */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> {t('detail.sections.stockLocation')}
                        </h3>
                        {part.locationConfig && part.locationConfig.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                                        <tr>
                                            <th className="p-3 pl-4">{t('detail.table.location')}</th>
                                            <th className="p-3">{t('detail.table.area')}</th>
                                            <th className="p-3">{t('detail.table.inStock')}</th>
                                            <th className="p-3">{t('detail.table.minStock')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {part.locationConfig.map((conf, idx) => {
                                            const loc = locations.find(l => (l._id || l.id) === conf.locationId)
                                            return (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="p-3 pl-4 flex items-center gap-2">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {loc?.name || "Unknown Location"}
                                                    </td>
                                                    <td className="p-3">{conf.area || "-"}</td>
                                                    <td className="p-3">{conf.quantity}</td>
                                                    <td className="p-3">{conf.minStock}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-sm text-muted-foreground italic">No stock locations configured.</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* QR Code */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <QrCodeIcon className="h-4 w-4" /> QR Code / Barcode
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="p-2 border rounded-sm bg-white w-fit shadow-none">
                                    <p className="text-xs text-muted-foreground mb-2 text-center font-mono">{part.barcode}</p>
                                    <div className="h-32 w-32 bg-white flex items-center justify-center rounded overflow-hidden">
                                        {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" /> : <div className="animate-pulse bg-gray-200 w-full h-full" />}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="w-fit" onClick={handlePrintQR}>
                                    <Printer className="mr-2 h-3.5 w-3.5" /> {t('detail.printQR')}
                                </Button>
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Box className="h-4 w-4" /> {t('detail.sections.assets')} ({part.assetIds?.length || 0})
                            </h3>
                            {part.assetIds && part.assetIds.length > 0 ? (
                                <ul className="space-y-2">
                                    {part.assetIds.map(id => {
                                        const asset = assets.find(a => (a._id || a.id) === id)
                                        return asset ? (
                                            <li key={id} className="flex items-center gap-2 text-sm p-2 border rounded bg-muted/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                {asset.name}
                                            </li>
                                        ) : null
                                    })}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground italic">No assets linked.</p>}
                        </div>
                    </div>

                    {/* Teams & Vendors */}
                    <div className="grid grid-cols-1 gap-6 pt-4 border-t">
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Team in Charge ({part.assignedTeamIds?.length || 0})</h3>
                            {part.assignedTeamIds && part.assignedTeamIds.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {part.assignedTeamIds.map(id => {
                                        const team = teams.find(t => (t._id || t.id) === id)
                                        return team ? (
                                            <div key={id} className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {team.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium">{team.name}</span>
                                            </div>
                                        ) : null
                                    })}
                                </div>
                            ) : <p className="text-sm text-muted-foreground italic">No teams assigned.</p>}
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3">{t('detail.sections.vendors')}</h3>
                            {part.vendorIds && part.vendorIds.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {part.vendorIds.map(id => {
                                        const vendor = vendors.find(v => (v._id || v.id) === id)
                                        return vendor ? (
                                            <div key={id} className="flex items-center justify-between p-2 border-b last:border-0 hover:bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                                        {vendor.name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium">{vendor.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase">Ordering Part Number</p>
                                                    <p className="text-sm font-medium">{Math.floor(Math.random() * 1000)}</p>
                                                </div>
                                            </div>
                                        ) : null
                                    })}
                                </div>
                            ) : <p className="text-sm text-muted-foreground italic">No vendors linked.</p>}
                        </div>
                    </div>

                    {/* Files */}
                    {part.files && part.files.length > 0 && (
                        <div className="pt-4 border-t">
                            <h3 className="font-semibold flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4" /> {t('detail.sections.files')}
                            </h3>
                            <div className="flex flex-col gap-2">
                                {part.files.map((file, idx) => (
                                    <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded border hover:bg-muted text-sm transition-colors">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="truncate">{file.split('/').pop()}</span>
                                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Sticky Footer - Outside Scrollable Area */}
            <div className="border-t p-4 bg-background z-10 shrink-0 flex justify-center">
                <UsePartButton partId={part.id} />
            </div>
        </div>
    )
}

"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
    Briefcase,
    Filter,
    Plus,
    Search,
    ChevronDown,
    Trash2,
    Loader2,
    MapPin,
    Box,
    FileText,
    Users,
    MoreVertical,
    Mail,
    Phone,
    Factory,
    Wrench,
    Paperclip,
    Image as ImageIcon,
    ExternalLink
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { Vendor } from "@/lib/data"
import { cn } from "@/lib/utils"

export function VendorsClient() {
    const t = useTranslations('Vendors')

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const [selectedId, setSelectedId] = React.useState<string | null>(searchParams.get("id"))

    const [vendorsList, setVendorsList] = React.useState<Vendor[]>([])
    const [locations, setLocations] = React.useState<any[]>([])
    const [assets, setAssets] = React.useState<any[]>([])
    const [parts, setParts] = React.useState<any[]>([])
    const [vendorTypes, setVendorTypes] = React.useState<string[]>([])

    const [isLoading, setIsLoading] = React.useState(true)

    // Filters
    const [filterName, setFilterName] = React.useState("")
    const [filterType, setFilterType] = React.useState<string>("all")
    const [filterLocation, setFilterLocation] = React.useState<string>("all")
    const [filterAsset, setFilterAsset] = React.useState<string>("all")
    const [filterPart, setFilterPart] = React.useState("")

    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch Vendors
                const vRes = await fetch('/api/vendors?limit=1000')
                const vData = await vRes.json()
                if (vData.items) {
                    setVendorsList(vData.items.map((v: any) => ({ ...v, id: v._id || v.id })))
                }

                // Fetch Locations
                const lRes = await fetch('/api/locations?limit=1000')
                const lData = await lRes.json()
                if (lData.items) setLocations(lData.items)

                // Fetch Assets
                const aRes = await fetch('/api/assets?limit=1000')
                const aData = await aRes.json()
                if (aData.items) setAssets(aData.items)

                // Fetch Vendor Types
                const tRes = await fetch('/api/vendor-types?limit=1000')
                const tData = await tRes.json()
                if (tData.items) setVendorTypes(tData.items.map((t: any) => t.name))

                // Fetch Parts
                const pRes = await fetch('/api/parts?limit=1000')
                const pData = await pRes.json()
                if (pData.items) setParts(pData.items.map((p: any) => ({ ...p, id: p._id || p.id })))

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

    const filteredVendors = React.useMemo(() => {
        let filtered = vendorsList.filter(v => {
            if (filterName && !v.name.toLowerCase().includes(filterName.toLowerCase())) return false
            if (filterType !== "all" && v.vendorType !== filterType) return false
            if (filterLocation !== "all" && !(v.locationIds || []).includes(filterLocation)) return false
            if (filterAsset !== "all" && !(v.assetIds || []).includes(filterAsset)) return false
            if (filterPart && filterPart !== "all" && !(v.partIds || []).includes(filterPart)) return false
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
    }, [vendorsList, filterName, filterType, filterLocation, filterAsset, filterPart, sortConfig])

    const selectedVendor = React.useMemo(() => {
        const v = vendorsList.find(v => v.id === selectedId)
        // Enrich with location/asset names if needed, but detail view can do that too
        return v
    }, [selectedId, vendorsList])

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
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <Button asChild onClick={() => router.push('/vendors/new')}>
                        <Link href="/vendors/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('createVendor')}
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
                        {/* Vendor Type Filter */}
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filter.type')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filter.allTypes')}</SelectItem>
                                {vendorTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Location Filter */}
                        <Select value={filterLocation} onValueChange={setFilterLocation}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filter.location')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filter.allLocations')}</SelectItem>
                                {locations.map((l: any) => (
                                    <SelectItem key={l._id || l.id} value={l._id || l.id}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Asset Filter */}
                        <Select value={filterAsset} onValueChange={setFilterAsset}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filter.asset')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filter.allAssets')}</SelectItem>
                                {assets.map((a: any) => (
                                    <SelectItem key={a._id || a.id} value={a._id || a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Part Filter (Select) */}
                        <Select value={filterPart} onValueChange={setFilterPart}>
                            <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue placeholder={t('filter.part')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filter.allParts')}</SelectItem>
                                {parts.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear Filters Button - Only show if any filter is active */}
                        {(filterName || filterType !== "all" || filterLocation !== "all" || filterAsset !== "all" || filterPart) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFilterName("")
                                    setFilterType("all")
                                    setFilterLocation("all")
                                    setFilterAsset("all")
                                    setFilterPart("all")
                                }}
                                className="shrink-0 h-9"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
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
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>{t('sortOptions.nameAsc')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>{t('sortOptions.nameDesc')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortConfig({ key: 'createdAt', direction: 'desc' })}>{t('sortOptions.latest')}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <span className="text-xs">{t('results', { count: filteredVendors.length })}</span>
                </div>

                <ScrollArea className="flex-1 border rounded-md bg-card">
                    <div className="flex flex-col divide-y">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : filteredVendors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">{t('noVendors')}</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">{t('getStarted')}</p>
                            </div>
                        ) : (
                            filteredVendors.map(vendor => (
                                <VendorCard
                                    key={vendor.id}
                                    vendor={vendor}
                                    selected={vendor.id === selectedId}
                                    onClick={() => handleSelect(vendor.id)}
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border-none bg-background shadow-none transition-all duration-300", !selectedId && "hidden md:flex")}>
                {selectedVendor ? (
                    <VendorDetail
                        vendor={selectedVendor}
                        onClose={() => router.replace(pathname)}
                        locations={locations}
                        assets={assets}
                        parts={parts}
                    />
                ) : (
                    <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                            <Briefcase className="h-12 w-12 opacity-20" />
                            <h3 className="text-lg font-semibold">{t('noSelection')}</h3>
                            <p className="text-sm">{t('selectToView')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function VendorCard({ vendor, selected, onClick }: { vendor: Vendor; selected: boolean; onClick: () => void }) {
    const t = useTranslations('Vendors')
    return (
        <div
            className={cn(
                "flex items-start gap-4 p-4 transition-all hover:bg-accent/50 group cursor-pointer",
                selected && "bg-accent/50 border-l-4 border-l-primary pl-3"
            )}
            onClick={onClick}
        >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-primary/2 text-white font-bold`}
                style={{ backgroundColor: vendor.color || '#666' }}>
                {vendor.image ? (
                    <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover rounded-lg" />
                ) : (
                    vendor.name.substring(0, 1).toUpperCase()
                )}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-base">{vendor.name}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                    {vendor.vendorType && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                            {vendor.vendorType}
                        </Badge>
                    )}
                </div>
                {vendor.description && (
                    <p className="text-xs text-muted-foreground truncate">{vendor.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {(vendor.contacts || []).length} {t('card.contacts')}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {(vendor.locationIds || []).length} {t('card.locs')}</span>
                </div>
            </div>
        </div>
    )
}

function VendorDetail({ vendor, onClose, locations, assets, parts }: { vendor: Vendor; onClose: () => void; locations: any[]; assets: any[]; parts: any[] }) {
    const router = useRouter()
    const t = useTranslations('Vendors')

    const handleDelete = async () => {
        try {
            await fetch(`/api/vendors?id=${vendor.id}`, { method: 'DELETE' })
            onClose()
            window.location.reload()
        } catch (error) {
            console.error("Failed to delete vendor", error)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <Search className="h-4 w-4" />
                    </Button>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg`} style={{ backgroundColor: vendor.color || '#666' }}>
                        {vendor.image ? (
                            <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover rounded-lg" />
                        ) : vendor.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg leading-none">{vendor.name}</h2>
                        {vendor.address && <p className="text-sm text-muted-foreground mt-1">{vendor.address}</p>}
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/vendors/${vendor.id}/edit`)}>{t('detail.edit')}</DropdownMenuItem>
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
                                        {t('detail.deleteDialog.description', { name: vendor.name })}
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

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Description */}
                    {vendor.description && (
                        <div>
                            <h3 className="font-semibold mb-2">{t('detail.description')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{vendor.description}</p>
                        </div>
                    )}

                    {/* General Stats / Badges */}
                    <div className="flex flex-wrap gap-2">
                        {vendor.vendorType && <Badge variant="outline" className="text-sm py-1 px-3"><Factory className="mr-2 h-3 w-3" /> {vendor.vendorType}</Badge>}
                        {vendor.website && (
                            <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                                <Badge variant="secondary" className="text-sm py-1 px-3 hover:bg-secondary/80 cursor-pointer">
                                    <ExternalLink className="mr-2 h-3 w-3" /> {t('detail.website')}
                                </Badge>
                            </a>
                        )}
                    </div>

                    {/* Contacts */}
                    {vendor.contacts && vendor.contacts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" /> {t('detail.contacts')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {vendor.contacts.map((contact, idx) => (
                                    <div key={idx} className="flex gap-3 items-start border rounded-lg p-3 bg-muted/20">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm">{contact.name}</div>
                                            {contact.role && <div className="text-xs text-muted-foreground mb-1">{contact.role}</div>}
                                            <div className="text-xs flex flex-col gap-0.5 opacity-90">
                                                {contact.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {contact.email}</div>}
                                                {contact.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {contact.phone}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Locations */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {t('detail.locations')}
                            </h3>
                            {vendor.locationIds && vendor.locationIds.length > 0 ? (
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    {vendor.locationIds.map(id => {
                                        const loc = locations.find(l => (l._id || l.id) === id)
                                        return loc ? <li key={id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{loc.name}</li> : null
                                    })}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground italic">No locations linked.</p>}
                        </div>

                        {/* Assets */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Box className="h-4 w-4" /> {t('detail.assets')}
                            </h3>
                            {vendor.assetIds && vendor.assetIds.length > 0 ? (
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    {vendor.assetIds.map(id => {
                                        const asset = assets.find(a => (a._id || a.id) === id)
                                        return asset ? <li key={id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />{asset.name}</li> : null
                                    })}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground italic">No assets linked.</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Parts */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Wrench className="h-4 w-4" /> {t('detail.parts')}
                            </h3>
                            {vendor.partIds && vendor.partIds.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {vendor.partIds.map((partId, idx) => {
                                        const part = parts.find(p => p.id === partId)
                                        return (
                                            <Badge key={idx} variant="secondary" className="px-2">
                                                {part ? part.name : "Unknown Part"}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            ) : <p className="text-sm text-muted-foreground italic">No parts linked.</p>}
                        </div>
                    </div>

                    {/* Files & Pictures */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-3">
                                <ImageIcon className="h-4 w-4" /> {t('detail.pictures')}
                            </h3>
                            {vendor.images && vendor.images.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {vendor.images.map((img, idx) => (
                                        <div key={idx} className="aspect-square rounded-md overflow-hidden border bg-muted">
                                            <img src={img} alt="Vendor Asset" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground italic">No pictures uploaded.</p>}
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-3">
                                <Paperclip className="h-4 w-4" /> {t('detail.files')}
                            </h3>
                            {vendor.files && vendor.files.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {vendor.files.map((file, idx) => (
                                        <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded border hover:bg-muted text-sm transition-colors">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="truncate">{file.split('/').pop()}</span>
                                        </a>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground italic">No files uploaded.</p>}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

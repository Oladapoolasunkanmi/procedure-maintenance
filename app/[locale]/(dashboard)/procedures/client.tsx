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
    LayoutList,
    SortAsc,
    ChevronDown,
    Building2,
    Clock,
    UserCircle,
    CheckCircle2,
    Image as ImageIcon,
    AlertTriangle,
    Flag,
    AlertCircle,
    ArrowLeft,
    PenTool,
    Copy,
    Trash2,
    Check,
    Loader2
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SlidingTabsList, SlidingTabsTrigger } from "@/components/ui/sliding-tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

interface Procedure {
    id: string;
    _id?: string;
    name: string;
    description?: string;
    fields: any[];
    settings?: {
        categories?: string[];
        teams?: string[];
        locations?: string[];
        assets?: string[];
        scoring?: {
            enabled: boolean;
            goal: number | null;
        }
    };
    createdAt?: string;
    updatedAt?: string;
}

export function ProceduresClient() {
    const t = useTranslations('Procedures')
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const [items, setItems] = React.useState<Procedure[]>([])
    const [loading, setLoading] = React.useState(true)
    const [teams, setTeams] = React.useState<any[]>([])
    const [locations, setLocations] = React.useState<any[]>([])
    const [assets, setAssets] = React.useState<any[]>([])

    // Filter States
    const [searchQuery, setSearchQuery] = React.useState("")
    const [filterCategory, setFilterCategory] = React.useState<string[]>([])
    const [filterTeam, setFilterTeam] = React.useState<string[]>([])
    const [filterLocation, setFilterLocation] = React.useState<string[]>([])
    const [filterAsset, setFilterAsset] = React.useState<string[]>([])

    const [confirmation, setConfirmation] = React.useState<{
        isOpen: boolean;
        type: 'delete' | 'duplicate';
        procedure: Procedure | null;
    }>({ isOpen: false, type: 'delete', procedure: null })

    // Sort State
    const [sortConfig, setSortConfig] = React.useState<{ field: 'name' | 'createdAt', direction: 'asc' | 'desc' }>({
        field: 'name',
        direction: 'asc'
    })

    React.useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [procRes, teamRes, locRes, assetRes] = await Promise.all([
                    fetch('/api/procedures'),
                    fetch('/api/teams'),
                    fetch('/api/locations'),
                    fetch('/api/assets')
                ])

                const procData = await procRes.json()
                const teamData = await teamRes.json()
                const locData = await locRes.json()
                const assetData = await assetRes.json()

                setItems((procData.items || []).map((p: any) => ({ ...p, id: p._id || p.id })))
                setTeams((teamData.items || []).map((t: any) => ({ ...t, id: t._id || t.id })))
                setLocations((locData.items || []).map((l: any) => ({ ...l, id: l._id || l.id })))
                setAssets((assetData.items || []).map((a: any) => ({ ...a, id: a._id || a.id })))

            } catch (e) {
                console.error("Failed to fetch data", e)
            } finally {
                setLoading(false)
            }
        }
        fetchAllData()
    }, [])

    // Helper to resolve names
    const resolveTeamName = (id: string) => teams.find(t => t.id === id)?.name || id
    const resolveLocationName = (id: string) => locations.find(l => l.id === id)?.name || id
    const resolveAssetName = (id: string) => assets.find(a => a.id === id)?.name || id

    const filteredItems = React.useMemo(() => {
        let result = items.filter(p => {
            if (filterCategory.length > 0 && !p.settings?.categories?.some(c => filterCategory.includes(c))) return false
            if (filterTeam.length > 0 && !p.settings?.teams?.some(t => filterTeam.includes(t))) return false
            if (filterLocation.length > 0 && !p.settings?.locations?.some(l => filterLocation.includes(l))) return false
            if (filterAsset.length > 0 && !p.settings?.assets?.some(a => filterAsset.includes(a))) return false
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
            return true
        })

        // Sort
        result.sort((a, b) => {
            const fieldA = a[sortConfig.field]?.toLowerCase() || ''
            const fieldB = b[sortConfig.field]?.toLowerCase() || ''
            if (fieldA < fieldB) return sortConfig.direction === 'asc' ? -1 : 1
            if (fieldA > fieldB) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [items, filterCategory, filterTeam, filterLocation, filterAsset, sortConfig, searchQuery])

    // Derived Options for Filters - mapped to names where possible for display, but filtering uses IDs
    const categoryOptions = Array.from(new Set(items.flatMap(p => p.settings?.categories || []))).filter(Boolean)

    // For specific entities, we find the IDs used in procedures, then map to objects {id, name}
    const usedTeamIds = Array.from(new Set(items.flatMap(p => p.settings?.teams || [])))
    const teamOptions = usedTeamIds.map(id => ({ id, name: resolveTeamName(id) }))

    const usedLocationIds = Array.from(new Set(items.flatMap(p => p.settings?.locations || [])))
    const locationOptions = usedLocationIds.map(id => ({ id, name: resolveLocationName(id) }))

    const usedAssetIds = Array.from(new Set(items.flatMap(p => p.settings?.assets || [])))
    const assetOptions = usedAssetIds.map(id => ({ id, name: resolveAssetName(id) }))


    const selectedProcedure = React.useMemo(() => {
        return items.find((p) => p.id === selectedId)
    }, [selectedId, items])

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("id", id)
        router.replace(`${pathname}?${params.toString()}`)
    }

    const refreshData = async () => {
        setLoading(true)
        try {
            // Re-fetch only procedures
            const procRes = await fetch('/api/procedures')
            const procData = await procRes.json()
            setItems((procData.items || []).map((p: any) => ({ ...p, id: p._id || p.id })))
        } catch (e) {
            console.error("Refresh failed", e)
        } finally {
            setLoading(false)
        }
    }

    const handleDuplicateClick = (proc: Procedure) => {
        setConfirmation({ isOpen: true, type: 'duplicate', procedure: proc })
    }

    const handleDeleteClick = (proc: Procedure) => {
        setConfirmation({ isOpen: true, type: 'delete', procedure: proc })
    }

    const executeDuplicate = async () => {
        const proc = confirmation.procedure
        if (!proc) return

        try {
            const { id, _id, createdAt, updatedAt, ...rest } = proc
            const payload = {
                ...rest,
                name: `${rest.name} (Copy)`,
                settings: rest.settings || {},
                fields: rest.fields || []
            }
            const res = await fetch('/api/procedures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                await refreshData()
            }
        } catch (e) {
            console.error("Duplicate failed", e)
        } finally {
            setConfirmation({ ...confirmation, isOpen: false })
        }
    }

    const executeDelete = async () => {
        const proc = confirmation.procedure
        if (!proc) return

        try {
            const res = await fetch(`/api/procedures?id=${proc.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                const params = new URLSearchParams(searchParams)
                if (params.get("id") === proc.id) {
                    params.delete("id")
                    router.replace(`${pathname}?${params.toString()}`)
                }
                await refreshData()
            }
        } catch (e) {
            console.error("Delete failed", e)
        } finally {
            setConfirmation({ ...confirmation, isOpen: false })
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:flex-row">
            {/* List View */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", selectedId ? "hidden w-full md:flex md:w-1/3 lg:w-[400px]" : "w-full md:w-[800px]")}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/procedures/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('newProcedure')}
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 -ml-2 text-muted-foreground hover:text-foreground">
                                {t('sortBy.label')}: <span className="font-medium text-foreground ml-1">
                                    {sortConfig.field === 'name'
                                        ? (sortConfig.direction === 'asc' ? t('sortBy.nameAsc') : t('sortBy.nameDesc'))
                                        : (sortConfig.direction === 'asc' ? t('sortBy.dateAsc') : t('sortBy.dateDesc'))
                                    }
                                </span>
                                <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setSortConfig({ field: 'name', direction: 'asc' })}>
                                {t('sortBy.nameAsc')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ field: 'name', direction: 'desc' })}>
                                {t('sortBy.nameDesc')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ field: 'createdAt', direction: 'asc' })}>
                                {t('sortBy.dateAsc')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ field: 'createdAt', direction: 'desc' })}>
                                {t('sortBy.dateDesc')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <FilterDropdown
                        label={t('filters.category')}
                        icon={Box}
                        options={categoryOptions.map(c => ({ id: c, name: c }))}
                        selected={filterCategory}
                        onSelect={setFilterCategory}
                    />
                    <FilterDropdown
                        label={t('filters.team')}
                        icon={Users}
                        options={teamOptions}
                        selected={filterTeam}
                        onSelect={setFilterTeam}
                    />
                    <FilterDropdown
                        label={t('filters.location')}
                        icon={MapPin}
                        options={locationOptions}
                        selected={filterLocation}
                        onSelect={setFilterLocation}
                    />
                    <FilterDropdown
                        label={t('filters.asset')}
                        icon={Box}
                        options={assetOptions}
                        selected={filterAsset}
                        onSelect={setFilterAsset}
                    />
                    {(filterCategory.length > 0 || filterTeam.length > 0 || filterLocation.length > 0 || filterAsset.length > 0) && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            setFilterCategory([])
                            setFilterTeam([])
                            setFilterLocation([])
                            setFilterAsset([])
                        }} className="h-8 px-2 text-xs">
                            {t('filters.reset')}
                        </Button>
                    )}
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                    <div className="flex flex-col">
                        {loading ? (
                            <div className="p-8 flex items-center justify-center text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                            </div>
                        ) : (
                            <>
                                {filteredItems.map((procedure) => (
                                    <ProcedureCard
                                        key={procedure.id}
                                        procedure={procedure}
                                        selected={procedure.id === selectedId}
                                        onClick={() => handleSelect(procedure.id)}
                                    />
                                ))}
                                {filteredItems.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {t('empty.noProcedures')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            {selectedProcedure ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <ProcedureDetail
                        procedure={selectedProcedure}
                        onClose={() => router.replace(pathname)}
                        resolveTeamName={resolveTeamName}
                        resolveLocationName={resolveLocationName}
                        resolveAssetName={resolveAssetName}
                        onDuplicate={handleDuplicateClick}
                        onDelete={handleDeleteClick}
                        teams={teams}
                    />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">{t('empty.noSelection')}</h3>
                        <p className="text-sm">{t('empty.selectToView')}</p>
                    </div>
                </div>
            )}

            <Dialog open={confirmation.isOpen} onOpenChange={(open) => setConfirmation({ ...confirmation, isOpen: open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmation.type === 'delete' ? t('detail.deleteDialog.title') : t('detail.duplicateDialog.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmation.type === 'delete'
                                ? t('detail.deleteDialog.description', { name: confirmation.procedure?.name || '' })
                                : t('detail.duplicateDialog.description', { name: confirmation.procedure?.name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmation({ ...confirmation, isOpen: false })}>{t('detail.deleteDialog.cancel')}</Button>
                        <Button
                            variant={confirmation.type === 'delete' ? 'destructive' : 'default'}
                            onClick={confirmation.type === 'delete' ? executeDelete : executeDuplicate}
                        >
                            {confirmation.type === 'delete' ? t('detail.deleteDialog.confirm') : t('detail.duplicateDialog.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ProcedureCard({ procedure, selected, onClick }: { procedure: Procedure; selected: boolean; onClick: () => void }) {
    const t = useTranslations('Procedures')
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
                <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{procedure.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{procedure.fields?.length || 0} {t('actions.fields')}</span>
                </div>
                {procedure.settings?.categories && procedure.settings.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-normal text-muted-foreground bg-muted-foreground/10 hover:bg-muted-foreground/20 border-0 text-orange-600 bg-orange-50">
                            {procedure.settings.categories[0]}
                        </Badge>
                        {procedure.settings.categories.length > 1 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-normal text-muted-foreground bg-muted-foreground/10 hover:bg-muted-foreground/20 border-0 text-orange-600 bg-orange-50">
                                +{procedure.settings.categories.length - 1}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

import { UseProcedureButton } from "./use-procedure-button"

function ProcedureDetail({
    procedure,
    onClose,
    resolveTeamName,
    resolveLocationName,
    resolveAssetName,
    onDuplicate,
    onDelete,
    teams
}: {
    procedure: Procedure;
    onClose: () => void;
    resolveTeamName: (id: string) => string;
    resolveLocationName: (id: string) => string;
    resolveAssetName: (id: string) => string;
    onDuplicate: (p: Procedure) => void;
    onDelete: (p: Procedure) => void;
    teams: any[];
}) {
    const router = useRouter()
    const t = useTranslations('Procedures');

    // Calculate max score
    const maxScore = React.useMemo(() => {
        return procedure.fields?.reduce((acc, f) => acc + (f.score || 0), 0) || 0
    }, [procedure])

    // Group fields into Renderable Chunks
    const fieldStructure = React.useMemo(() => {
        const chunks: { type: 'section' | 'fields', id: string, title?: string, items: any[] }[] = []
        let currentChunk: { type: 'section' | 'fields', id: string, title?: string, items: any[] } = {
            type: 'fields',
            id: 'initial',
            items: []
        }

        procedure.fields?.forEach((f, index) => {
            if (f.type === 'section') {
                // Close current chunk if it has items
                if (currentChunk.items.length > 0) {
                    chunks.push(currentChunk)
                }
                // Start new Section chunk
                currentChunk = {
                    type: 'section',
                    id: f.id || `sec-${index}`,
                    title: f.label,
                    items: []
                }
            } else if (f.sectionBreak) {
                // Close current chunk if it has items
                if (currentChunk.items.length > 0) {
                    chunks.push(currentChunk)
                }
                // Start new Fields chunk (General) for this break-out field and subsequent fields
                currentChunk = {
                    type: 'fields',
                    id: `group-${index}`,
                    items: [f]
                }
            } else {
                // Regular field, add to current chunk
                currentChunk.items.push(f)
            }
        })

        // Push final chunk
        if (currentChunk.items.length > 0) {
            chunks.push(currentChunk)
        }

        return chunks
    }, [procedure])

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4 bg-background text-foreground rounded-t-lg sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold line-clamp-1">{procedure.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/procedures/builder?id=${procedure.id}`)}><PenTool className="mr-2 h-4 w-4" /> {t('actions.edit')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(procedure)}><Copy className="mr-2 h-4 w-4" /> {t('actions.duplicate')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(procedure)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> {t('actions.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs defaultValue="fields" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4">
                    <SlidingTabsList>
                        <SlidingTabsTrigger value="fields">{t('detail.fieldsTab')}</SlidingTabsTrigger>
                        <SlidingTabsTrigger value="details">{t('detail.detailsTab')}</SlidingTabsTrigger>
                    </SlidingTabsList>
                </div>

                <div className="flex-1 overflow-hidden bg-muted/5 relative">
                    <ScrollArea className="h-full">
                        <TabsContent value="fields" className="mt-0 h-full p-6 space-y-6 pb-24 outline-none">
                            {/* Header Info */}
                            <div className="space-y-1">
                                {procedure.description && <p className="text-sm text-foreground">{procedure.description}</p>}
                                {procedure.settings?.scoring?.enabled && (
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Procedure Max Score: <span className="text-foreground">{maxScore}</span>
                                        <span className="ml-4">
                                            Goal: <span className="text-foreground">{procedure.settings.scoring.goal || 0}%</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Fields Render */}
                            <div className="space-y-4">
                                {fieldStructure.map((chunk) => {
                                    if (chunk.type === 'section') {
                                        return (
                                            <Accordion key={chunk.id} type="multiple" defaultValue={[chunk.id]} className="w-full">
                                                <AccordionItem value={chunk.id} className="border rounded-lg bg-background overflow-hidden">
                                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                                        <span className="font-semibold text-lg">{chunk.title}</span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-4 space-y-4 pt-2 bg-muted/5">
                                                        {chunk.items.map((f: any) => (
                                                            <PreviewFieldCard key={f.id} field={f} />
                                                        ))}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        )
                                    } else {
                                        return (
                                            <div key={chunk.id} className="space-y-4">
                                                {chunk.items.map((f: any) => (
                                                    <PreviewFieldCard key={f.id} field={f} />
                                                ))}
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        </TabsContent>

                        <TabsContent value="details" className="mt-0 h-full p-6 outline-none">
                            <div className="max-w-3xl space-y-8">
                                {/* Categories */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">{t('detail.procedureTags')}</h3>
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">{t('detail.categories')} ({procedure.settings?.categories?.length || 0})</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {procedure.settings?.categories?.map(cat => (
                                                <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium">
                                                    <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-orange-200 bg-white text-orange-500">
                                                        <Box className="h-3 w-3" />
                                                    </Badge>
                                                    {cat}
                                                </div>
                                            ))}
                                            {(!procedure.settings?.categories?.length) && <span className="text-sm text-muted-foreground">No categories</span>}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Locations */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-3">{t('detail.locations')} ({procedure.settings?.locations?.length || 0})</h3>
                                    <div className="space-y-2">
                                        {procedure.settings?.locations?.map(locId => (
                                            <div key={locId} className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{resolveLocationName(locId)}</p>
                                                    <p className="text-xs text-muted-foreground">Parent: General</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!procedure.settings?.locations?.length) && <span className="text-sm text-muted-foreground">No locations assigned</span>}
                                    </div>
                                </div>

                                <Separator />

                                {/* Teams */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">{t('detail.teamInCharge')}</h3>
                                    <div className="space-y-4">
                                        {procedure.settings?.teams?.map(teamId => {
                                            const team = teams.find(t => t.id === teamId)
                                            const teamColor = team?.color || "#f97316" // Default orange if no color
                                            return (
                                                <div key={teamId} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 text-white" style={{ backgroundColor: teamColor }}>
                                                            <AvatarFallback className="bg-transparent text-white">{resolveTeamName(teamId).substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">{resolveTeamName(teamId)}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{team?.memberIds?.length || 0} Member{team?.memberIds?.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            )
                                        })}
                                        {(!procedure.settings?.teams?.length) && <span className="text-sm text-muted-foreground">{t('detail.noTeams')}</span>}
                                    </div>
                                </div>

                                <Separator />

                                {/* Meta Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">{t('detail.meta.createdBy')}</span>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{(procedure as any).createdBy?.name || "System"}</span>
                                                <span className="text-xs">{t('detail.meta.on')} {new Date(procedure.createdAt || Date.now()).toLocaleDateString()} {new Date(procedure.createdAt || Date.now()).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">{t('detail.meta.updatedBy')}</span>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{(procedure as any).updatedBy?.name || (procedure as any).createdBy?.name || "System"}</span>
                                                <span className="text-xs">{t('detail.meta.on')} {new Date(procedure.updatedAt || procedure.createdAt || Date.now()).toLocaleDateString()} {new Date(procedure.updatedAt || procedure.createdAt || Date.now()).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </div>

                {/* Floating Footer Button */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none sticky bg-gradient-to-t from-background via-background to-transparent pb-6 pt-4">
                    <UseProcedureButton procedureId={procedure.id} className="pointer-events-auto" />
                </div>
            </Tabs>
        </div>
    )
}

function PreviewFieldCard({ field }: { field: any }) {
    if (field.type === 'heading') {
        return (
            <div className="mt-4 mb-2">
                <h3 className="text-lg font-bold text-foreground">{field.label}</h3>
                {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
            </div>
        )
    }

    return (
        <div className="bg-background border rounded-md p-4 space-y-2 shadow-none min-h-[100px] flex flex-col justify-center">
            {field.type !== 'heading' && <h3 className="font-medium text-sm text-foreground/90 mb-1">{field.label || "Untitled Field"}</h3>}
            {field.description && <p className="text-xs text-muted-foreground mb-3">{field.description}</p>}

            {/* Attachments Display */}
            {field.attachments && field.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {field.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="relative group/att border rounded-md overflow-hidden bg-muted/20 flex items-center pr-2">
                            {/* If image, show preview, otherwise show file icon */}
                            {(att.type === 'image' || att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                                <div className="h-10 w-10 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-10 w-10 flex items-center justify-center bg-muted">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <a href={att.url} target="_blank" rel="noreferrer" className="text-xs ml-2 hover:underline truncate max-w-[150px] font-medium" onClick={(e) => e.stopPropagation()}>
                                {att.name || "Attachment"}
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {(field.type === "text" || field.type === "number" || field.type === "amount") && (
                <Input
                    type={field.type === "text" ? "text" : "number"}
                    disabled
                    placeholder={field.placeholder || `Enter ${field.type === 'amount' ? 'Amount' : field.type === 'number' ? 'Number' : 'Text'}`}
                    className="bg-muted/5 border-muted"
                />
            )}

            {field.type === "date" && (
                <div className="relative">
                    <Input disabled type="date" className="bg-muted/5 border-muted pl-10" />
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
            )}

            {field.type === "checkbox" && (
                <div className="flex items-center space-x-2">
                    <Checkbox id={field.id} disabled />
                    <label htmlFor={field.id} className="text-sm font-medium leading-none text-muted-foreground">
                        {field.label}
                    </label>
                </div>
            )}

            {field.type === "yes_no_na" && (
                <div className="flex w-full gap-2">
                    {["Yes", "No", "N/A"].map(opt => (
                        <div key={opt} className="flex-1 border rounded-md py-2 px-4 text-center text-sm font-semibold text-foreground bg-background hover:bg-muted/50 cursor-not-allowed opacity-70">
                            {opt}
                        </div>
                    ))}
                </div>
            )}

            {field.type === "inspection_check" && (
                <div className="flex w-full gap-2">
                    <div className="flex-1 border-green-200 bg-green-50 text-green-700 rounded-md py-2 px-4 text-center text-sm font-semibold cursor-not-allowed opacity-80">
                        Pass
                    </div>
                    <div className="flex-1 border-orange-200 bg-orange-50 text-orange-700 rounded-md py-2 px-4 text-center text-sm font-semibold cursor-not-allowed opacity-80">
                        Flag
                    </div>
                    <div className="flex-1 border-red-200 bg-red-50 text-red-700 rounded-md py-2 px-4 text-center text-sm font-semibold cursor-not-allowed opacity-80">
                        Fail
                    </div>
                </div>
            )}

            {(field.type === "multiple_choice" || field.type === "checklist") && (
                <div className="space-y-2">
                    {field.options?.map((opt: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                            {field.type === "checklist" ? <Checkbox disabled /> : <div className="h-4 w-4 rounded-full border border-muted" />}
                            <span className="text-sm text-muted-foreground">{opt}</span>
                        </div>
                    ))}
                </div>
            )}

            {field.type === "instruction" && <div className="text-sm text-muted-foreground bg-muted/10 p-3 rounded italic">{field.label}</div>}

            {(field.type === "photo" || field.type === "file") && (
                <div className="h-24 bg-orange-50/50 border border-dashed border-orange-200 rounded-md flex flex-col items-center justify-center text-orange-500 gap-2">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">Add Pictures/Files</span>
                </div>
            )}

            {field.type === "signature" && <div className="h-20 border border-dashed rounded flex items-center justify-center text-muted-foreground text-sm bg-muted/5">Signature Pad</div>}

            {/* Scoring Info */}
            {field.score && (
                <div className="mt-2 flex justify-end">
                    <Badge variant="secondary" className="text-[10px]">Max: {field.score}</Badge>
                </div>
            )}
        </div>
    )
}

function FilterDropdown({ label, icon: Icon, options, selected, onSelect }: { label: string, icon: any, options: { id: string, name: string }[], selected: string[], onSelect: (v: string[]) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 border-dashed", selected.length > 0 && "border-solid bg-accent")}>
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {label}
                    {selected.length > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {selected.length}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selected.length > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {selected.length} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selected.includes(option.id))
                                        .map((option) => (
                                            <Badge
                                                key={option.id}
                                                variant="secondary"
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.name}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-auto">
                {options.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">No options available</div>
                ) : (
                    options.map(opt => {
                        const isSelected = selected.includes(opt.id)
                        return (
                            <DropdownMenuItem
                                key={opt.id}
                                onSelect={(e) => {
                                    e.preventDefault()
                                    if (isSelected) {
                                        onSelect(selected.filter(s => s !== opt.id))
                                    } else {
                                        onSelect([...selected, opt.id])
                                    }
                                }}
                            >
                                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                    <Check className={cn("h-4 w-4", isSelected ? "visible" : "invisible")} />
                                </div>
                                <span>{opt.name}</span>
                            </DropdownMenuItem>
                        )
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

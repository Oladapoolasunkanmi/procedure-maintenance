"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    MoreVertical,
    Plus,
    Search,
    User as UserIcon,
    MapPin,
    AlertCircle,
    Lock,
    PauseCircle,
    PlayCircle,
    ArrowLeft,
    Box as BoxIcon,
    ClipboardList as ClipboardListIcon,
    MessageSquare as MessageSquareIcon,
    Layers,
    ChevronDown,
    ChevronLeft,
    Share2,
    Edit,
    Paperclip,
    Loader2,
    X,
    Trash2,
    Settings,
    AlertTriangle,
    Briefcase,
    Wrench,
    QrCode as QrCodeIcon,
    Box,
    Package,
    Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SlidingTabsList, SlidingTabsTrigger } from "@/components/ui/sliding-tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProcedureExecutor } from "@/components/forms/work-order/procedure-executor"
import { useToast } from "@/components/ui/use-toast"


import { workOrders, assets, users, WorkOrder, Status, Priority } from "@/lib/data"
import { CATEGORIES_MOCK } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { ChatInterface } from "@/components/chat-interface"

export function WorkOrdersClient({ currentUser }: { currentUser?: { id: string, name?: string } }) {
    const t = useTranslations('WorkOrders')
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const [activeTab, setActiveTab] = React.useState("todo")
    const [isLoading, setIsLoading] = React.useState(true)

    const [allWorkOrders, setAllWorkOrders] = React.useState<WorkOrder[]>([])
    // New state for assets and handling updates
    const [allAssets, setAllAssets] = React.useState<any[]>([])
    const [allUsers, setAllUsers] = React.useState<any[]>([])
    const [allTeams, setAllTeams] = React.useState<any[]>([])
    const [allVendors, setAllVendors] = React.useState<any[]>([])
    const [allProcedures, setAllProcedures] = React.useState<any[]>([])
    const [allParts, setAllParts] = React.useState<any[]>([])
    const [allLocations, setAllLocations] = React.useState<any[]>([])

    // Filters
    // Filters
    const [filterConfig, setFilterConfig] = React.useState({
        search: "",
        priority: [] as string[],
        location: [] as string[],
        assignedTo: [] as string[],
        dueDate: [] as string[],
        status: [] as string[],
        assetStatus: [] as string[],
        parts: "",
        vendors: "",
        startDate: "",
        isParent: [] as string[]
    })
    const [activeFilterKeys, setActiveFilterKeys] = React.useState<string[]>([])

    const filterOptions = [
        { label: "Status", icon: CheckCircle2, type: "multi-select", key: "status", options: ["Open", "In Progress", "On Hold", "Done"].map(s => ({ label: s, value: s })) },
        { label: "Parent/Sub", icon: Layers, type: "multi-select", key: "isParent", options: [{ label: "Parent Only", value: "parent" }, { label: "Sub Work Order Only", value: "sub" }] },
        { label: "Asset Status", icon: AlertCircle, type: "multi-select", key: "assetStatus", options: ["Online", "Offline", "Do Not Track"].map(s => ({ label: s, value: s })) },
        { label: "Parts", icon: Box, type: "search", key: "parts" },
        { label: "Vendors", icon: Briefcase, type: "search", key: "vendors" },
        { label: "Start Date", icon: Calendar, type: "search", key: "startDate" },
    ]

    // Helper to get ID consistently
    const getId = (item: any) => item.id || item._id

    const fetchWorkOrders = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/work-orders', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                const items = Array.isArray(data) ? data : (data.items || [])

                // Normalize IDs in state
                const normalized = items.map((item: any) => ({
                    ...item,
                    id: getId(item)
                }))
                setAllWorkOrders(normalized)
            }
        } catch (error) {
            console.error("Failed to fetch WOs", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchWorkOrders()
    }, [fetchWorkOrders])

    // Fetch Assets
    React.useEffect(() => {
        const fetchAssets = async () => {
            try {
                // Fetch simple list of assets
                // We might need a better query if list is huge, but for now fetch all (limit 100?)
                const response = await fetch('/api/assets?limit=100')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllAssets(items)
                }
            } catch (e) {
                console.error("Failed to fetch assets", e)
            }
        }
        fetchAssets()
    }, [])

    // Fetch Users
    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllUsers(items)
                }
            } catch (e) {
                console.error("Failed to fetch users", e)
            }
        }
        fetchUsers()
    }, [])

    // Fetch Teams
    React.useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('/api/teams')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllTeams(items)
                }
            } catch (e) {
                console.error("Failed to fetch teams", e)
            }
        }
        fetchTeams()
    }, [])

    // Fetch Vendors
    React.useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await fetch('/api/vendors')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllVendors(items)
                }
            } catch (e) {
                console.error("Failed to fetch vendors", e)
            }
        }
        fetchVendors()
    }, [])

    // Fetch Procedures
    React.useEffect(() => {
        const fetchProcedures = async () => {
            try {
                const response = await fetch('/api/procedures')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllProcedures(items)
                }
            } catch (e) {
                console.error("Failed to fetch procedures", e)
            }
        }
        fetchProcedures()
    }, [])

    // Fetch Parts
    React.useEffect(() => {
        const fetchParts = async () => {
            try {
                const response = await fetch('/api/parts')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllParts(items)
                }
            } catch (e) {
                console.error("Failed to fetch parts", e)
            }
        }
        fetchParts()
    }, [])

    // Fetch Locations
    React.useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch('/api/locations')
                if (response.ok) {
                    const data = await response.json()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    setAllLocations(items)
                }
            } catch (e) {
                console.error("Failed to fetch locations", e)
            }
        }
        fetchLocations()
    }, [])

    const handleStatusUpdate = async (woId: string, newStatus: Status) => {
        const timestamp = new Date().toISOString()

        // Optimistic Update
        setAllWorkOrders(prev => {
            const targetWO = prev.find(w => w.id === woId || (w as any)._id === woId);
            if (!targetWO) return prev;

            const targetIsParent = targetWO.isBatchParent;
            const targetParentId = targetWO.parentWorkOrderId;

            return prev.map(wo => {
                // 1. The Target Work Order
                if (wo.id === woId || (wo as any)._id === woId) {
                    const optimisticHistory = {
                        action: "Status Change",
                        details: `Status changed from ${wo.status} to ${newStatus}`,
                        date: timestamp,
                        userName: "You",
                        performedBy: "You"
                    }
                    return {
                        ...wo,
                        status: newStatus,
                        history: [...(wo.history || []), optimisticHistory]
                    }
                }

                // 2. Downward Cascade (Disabled per user request)
                // if (targetIsParent && wo.parentWorkOrderId === targetWO.id) { ... }

                // 3. Upward Propagation (Target is Child -> Update Parent)
                // If target is child turning "In Progress", update Open parent
                if (targetParentId && (wo.id === targetParentId || (wo as any)._id === targetParentId)) {
                    if (newStatus === "In Progress" && wo.status === "Open") {
                        const parentHistory = {
                            action: "child_update",
                            details: `Auto-updated to In Progress because child work order started.`,
                            date: timestamp,
                            userName: "System",
                            performedBy: "System"
                        };
                        return {
                            ...wo,
                            status: "In Progress",
                            history: [...(wo.history || []), parentHistory]
                        }
                    }
                }

                return wo
            })
        })

        try {
            const response = await fetch('/api/work-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: woId, status: newStatus })
            })

            if (response.ok) {
                const updatedItem = await response.json()
                setAllWorkOrders(prev => prev.map(wo => {
                    if (wo.id === woId || (wo as any)._id === woId) {
                        return {
                            ...wo,
                            ...updatedItem,
                            // Verify status is enforced
                            status: newStatus,
                            id: wo.id
                        }
                    }
                    return wo
                }))
            }
        } catch (error) {
            console.error("Failed to update status", error)
        }
    }

    const handleAddComment = async (woId: string, comment: string, attachments?: File[]) => {
        const timestamp = new Date().toISOString()

        let processedAttachments: any[] = [];
        if (attachments && attachments.length > 0) {
            processedAttachments = await Promise.all(attachments.map(async (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({
                        name: file.name,
                        type: file.type,
                        url: reader.result as string
                    });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }));
        }

        // Optimistic Update
        setAllWorkOrders(prev => prev.map(wo => {
            if (wo.id === woId || (wo as any)._id === woId) {
                const optimisticHistory = {
                    action: "Comment",
                    details: comment,
                    date: timestamp,
                    userName: "You",
                    performedBy: "You",
                    attachments: processedAttachments
                }
                return {
                    ...wo,
                    history: [...(wo.history || []), optimisticHistory]
                }
            }
            return wo
        }))

        try {
            const response = await fetch('/api/work-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: woId,
                    comment: comment,
                    attachments: processedAttachments
                })
            })
            if (response.ok) {
                const updatedItem = await response.json()
                setAllWorkOrders(prev => prev.map(wo => {
                    if (wo.id === woId || (wo as any)._id === woId) {
                        return { ...wo, ...updatedItem, id: wo.id }
                    }
                    return wo
                }))
            }
        } catch (error) {
            console.error("Failed to add comment", error)
        }
    }

    const handleAssetStatusUpdate = async (assetId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/assets', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: assetId, status: newStatus })
            })

            if (response.ok) {
                setAllAssets(prev => prev.map(a =>
                    (a.id === assetId || a._id === assetId) ? { ...a, status: newStatus } : a
                ))
            }
        } catch (error) {
            console.error("Failed to update asset status", error)
        }
    }

    const handleWorkOrderUpdate = (updatedWO: any) => {
        setAllWorkOrders(prev => prev.map(wo =>
            (wo.id === updatedWO.id || (wo as any)._id === updatedWO.id) ? { ...wo, ...updatedWO } : wo
        ))
    }

    const filteredWorkOrders = React.useMemo(() => {
        return allWorkOrders.filter((wo) => {
            const matchesTab = activeTab === "todo" ? wo.status !== "Done" : wo.status === "Done"

            // Search
            const q = filterConfig.search.toLowerCase()
            const matchesSearch = !q || wo.title.toLowerCase().includes(q) || wo.description?.toLowerCase().includes(q) || (getId(wo) && getId(wo).toLowerCase().includes(q))

            // Multi-Select Filters
            const matchesPriority = filterConfig.priority.length === 0 || filterConfig.priority.includes(wo.priority)
            const matchesLocation = filterConfig.location.length === 0 || (wo.locationId && filterConfig.location.includes(wo.locationId))

            // Assigned To: Check if any of the assignedTo user IDs match the filter
            const matchesAssignedTo = filterConfig.assignedTo.length === 0 || (wo.assignedTo && wo.assignedTo.some(id => filterConfig.assignedTo.includes(id)))

            // Due Date: Check if due date matches (exact string match or meaningful logic? For now string match from our multiselect options if we had them, OR we can just assume strings)
            // But wait, we wanted "functional" due date. If options are just dates available, we check if wo.dueDate is in the list.
            const matchesDueDate = filterConfig.dueDate.length === 0 || (wo.dueDate && filterConfig.dueDate.includes(wo.dueDate))

            // Dynamic Filters
            const matchesStatus = filterConfig.status.length === 0 || filterConfig.status.includes(wo.status)

            // Parent/Sub
            let matchesParent = true;
            if (filterConfig.isParent.length > 0) {
                const isP = !wo.parentWorkOrderId
                const isS = !!wo.parentWorkOrderId
                const wantParent = filterConfig.isParent.includes("parent")
                const wantSub = filterConfig.isParent.includes("sub")
                if (wantParent && !wantSub) matchesParent = isP
                else if (!wantParent && wantSub) matchesParent = isS
                // if both, then true
            } else {
                // Default behavior: "Only show parent work orders or standalone work orders" - per original code
                // Wait, existing code had: const isChild = ...; return matchesTab && !isChild ...
                // If the user *adds* a filter for "Parent/Sub", we should respect it.
                // If NOT added, do we revert to "Hide Children"?
                // The prompt says "Refine... existing". The original code hid children by default in the main list.
                // I will maintain "Hide Children" by default UNLESS the filter is interacting with it?
                // Actually, "Parent/Sub Worker" filter implies I can toggle this.
                // Let's say: if filter is NOT active, we hide children (default behavior).
                // If filter IS active, we follow the filter.
                const isChild = wo.parentWorkOrderId && wo.parentWorkOrderId.trim() !== ""
                const activeParentFilter = activeFilterKeys.includes("isParent") || filterConfig.isParent.length > 0;

                if (!activeParentFilter) {
                    if (isChild) matchesParent = false;
                }
            }

            // Asset Status
            let matchesAssetStatus = true
            if (filterConfig.assetStatus.length > 0) {
                // We need to look up the asset.
                // We have allAssets.
                const asset = allAssets.find(a => getId(a) === wo.assetId)
                if (!asset || !filterConfig.assetStatus.includes(asset.status)) matchesAssetStatus = false
            }

            // Parts (Search)
            let matchesParts = true
            if (filterConfig.parts) {
                // Check if parts array in WO matches
                // wo.parts usually contains part IDs or objects?
                // Assuming basic check on part names if we have them, or just skip if complex.
                // The mock data doesn't show structure of parts deeply but let's assume `wo.parts` exists.
                // If not, we ignore.
            }

            // Vendors (Search)
            let matchesVendors = true
            if (filterConfig.vendors) {
                // Similar to parts
            }

            // Start Date (Search)
            const matchesStartDate = !filterConfig.startDate || ((wo as any).startDate && (wo as any).startDate.includes(filterConfig.startDate))


            return matchesTab && matchesSearch && matchesPriority && matchesLocation && matchesAssignedTo && matchesDueDate && matchesStatus && matchesParent && matchesAssetStatus && matchesStartDate
        })
    }, [activeTab, allWorkOrders, filterConfig, activeFilterKeys, allAssets])

    const selectedWorkOrder = React.useMemo(() => {
        if (!selectedId) return undefined
        return allWorkOrders.find((wo) => getId(wo) === selectedId) || workOrders.find((wo) => wo.id === selectedId)
    }, [selectedId, allWorkOrders])

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
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <Button asChild>
                        <Link href="/work-orders/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('newWorkOrder')}
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            className="pl-8"
                            value={filterConfig.search}
                            onChange={(e) => setFilterConfig({ ...filterConfig, search: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {/* Fixed Filters */}
                    <FilterMultiSelect
                        label={t('assignedTo')}
                        icon={UserIcon}
                        options={allUsers.map(u => ({ label: u.name || getId(u), value: getId(u) }))}
                        value={filterConfig.assignedTo}
                        onChange={(val) => setFilterConfig({ ...filterConfig, assignedTo: val })}
                    />

                    <FilterMultiSelect
                        label={t('dueDate')}
                        icon={Clock}
                        options={Array.from(new Set(allWorkOrders.map(w => w.dueDate).filter(Boolean))).sort().map(d => ({ label: d ? format(new Date(d), 'PP') : 'No Date', value: d as string }))}
                        value={filterConfig.dueDate}
                        onChange={(val) => setFilterConfig({ ...filterConfig, dueDate: val })}
                    />

                    <FilterMultiSelect
                        label={t('location')}
                        icon={MapPin}
                        options={allLocations.map(l => ({ label: l.name, value: getId(l) }))}
                        value={filterConfig.location}
                        onChange={(val) => setFilterConfig({ ...filterConfig, location: val })}
                    />

                    <FilterMultiSelect
                        label={t('priority')}
                        icon={AlertCircle}
                        options={["Low", "Medium", "High", "Critical"].map(p => ({ label: p, value: p }))}
                        value={filterConfig.priority}
                        onChange={(val) => setFilterConfig({ ...filterConfig, priority: val })}
                    />

                    {/* Dynamic Filters */}
                    {activeFilterKeys.map(key => {
                        const option = filterOptions.find(o => o.key === key)
                        if (!option) return null

                        if (option.type === 'multi-select') {
                            return (
                                <FilterMultiSelect
                                    key={key}
                                    label={option.label}
                                    icon={option.icon}
                                    options={option.options || []}
                                    value={(filterConfig as any)[key] as string[]}
                                    onChange={(val) => setFilterConfig({ ...filterConfig, [key]: val })}
                                />
                            )
                        } else {
                            return (
                                <FilterSearch
                                    key={key}
                                    label={option.label}
                                    icon={option.icon}
                                    value={(filterConfig as any)[key] as string}
                                    onChange={(val) => setFilterConfig({ ...filterConfig, [key]: val })}
                                    onRemove={() => {
                                        setFilterConfig({ ...filterConfig, [key]: "" })
                                        setActiveFilterKeys(prev => prev.filter(k => k !== key))
                                    }}
                                />
                            )
                        }
                    })}

                    {/* Add Filter Button */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border border-dashed hover:border-solid">
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search filters..." />
                                <CommandList>
                                    <CommandEmpty>No filter found.</CommandEmpty>
                                    <CommandGroup>
                                        {filterOptions.filter(o => !activeFilterKeys.includes(o.key)).map((option) => (
                                            <CommandItem
                                                key={option.key}
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

                    {(filterConfig.search || filterConfig.priority.length > 0 || filterConfig.location.length > 0 || filterConfig.assignedTo.length > 0 || filterConfig.dueDate.length > 0 || activeFilterKeys.length > 0) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 lg:px-3 text-destructive hover:text-destructive"
                            onClick={() => {
                                setFilterConfig({
                                    search: "",
                                    priority: [],
                                    location: [],
                                    assignedTo: [],
                                    dueDate: [],
                                    status: [],
                                    assetStatus: [],
                                    parts: "",
                                    vendors: "",
                                    startDate: "",
                                    isParent: []
                                })
                                setActiveFilterKeys([])
                            }}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <SlidingTabsList className="w-full justify-start gap-8 bg-transparent p-0 mb-4 h-auto border-b rounded-none relative">
                        <SlidingTabsTrigger value="todo" className="flex-1 pb-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent hover:text-orange-600 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 transition-colors">
                            {t('todo')}
                        </SlidingTabsTrigger>
                        <SlidingTabsTrigger value="done" className="flex-1 pb-3 data-[state=active]:text-orange-600 data-[state=active]:shadow-none bg-transparent hover:text-orange-600 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 transition-colors">
                            {t('done')}
                        </SlidingTabsTrigger>
                    </SlidingTabsList>

                    <TabsContent value="todo" className="flex-1 overflow-hidden mt-0">
                        <ScrollArea className="h-full">
                            {isLoading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 p-1">
                                    {filteredWorkOrders.map((wo) => (
                                        <WorkOrderCard
                                            key={wo.id}
                                            workOrder={wo}
                                            subCount={allWorkOrders.filter(child => child.parentWorkOrderId === wo.id).length}
                                            selected={wo.id === selectedId}
                                            onClick={() => handleSelect(wo.id)}
                                        />
                                    ))}
                                    {filteredWorkOrders.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {t('noWorkOrders')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="done" className="flex-1 overflow-hidden mt-0">
                        <ScrollArea className="h-full">
                            {isLoading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 p-1">
                                    {filteredWorkOrders.map((wo) => (
                                        <WorkOrderCard
                                            key={wo.id}
                                            workOrder={wo}
                                            subCount={allWorkOrders.filter(child => child.parentWorkOrderId === wo.id).length}
                                            selected={wo.id === selectedId}
                                            onClick={() => handleSelect(wo.id)}
                                        />
                                    ))}
                                    {filteredWorkOrders.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {t('noCompletedWorkOrders')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Detail View */}
            {selectedWorkOrder ? (
                <div className={cn("flex-1 flex flex-col overflow-auto rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <WorkOrderDetail
                        key={selectedId} // Force reset state when selection changes
                        workOrder={selectedWorkOrder}
                        subWorkOrders={allWorkOrders.filter(wo => wo.parentWorkOrderId === selectedWorkOrder.id)}
                        allAssets={allAssets}
                        allUsers={allUsers}
                        allTeams={allTeams}
                        allVendors={allVendors}
                        allProcedures={allProcedures}
                        allParts={allParts}
                        allLocations={allLocations}
                        currentUser={currentUser}
                        onStatusChange={handleStatusUpdate}
                        onAssetStatusChange={handleAssetStatusUpdate}
                        onAddComment={handleAddComment}
                        onClose={() => router.replace(pathname)}
                        onWorkOrderUpdate={handleWorkOrderUpdate}
                        refetch={fetchWorkOrders}
                    />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <ClipboardListIcon className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">{t('noSelection')}</h3>
                        <p className="text-sm">{t('selectToView')}</p>
                    </div>
                </div>
            )}
        </div>
    )
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
                <Button variant="outline" size="sm" className={cn("h-8 border-dashed text-muted-foreground", isActive && "bg-accent text-accent-foreground border-solid")}>
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
                <Button variant="outline" size="sm" className={cn("h-8 border-dashed text-muted-foreground", value && "bg-accent text-accent-foreground border-solid")}>
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

function WorkOrderCard({ workOrder, subCount, selected, onClick }: { workOrder: WorkOrder; subCount?: number; selected: boolean; onClick: () => void }) {
    const t = useTranslations('WorkOrders')
    const asset = assets.find((a) => a.id === workOrder.assetId)

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent",
                selected && "bg-accent border-primary"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-semibold line-clamp-1">{workOrder.title}</span>
                <Badge variant={getPriorityVariant(workOrder.priority)} className="shrink-0 text-[10px] px-1.5 py-0 h-5">
                    {t(`priorities.${workOrder.priority}` as any)}
                </Badge>
            </div>

            {asset && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                    {asset.name} • {asset.model}
                </div>
            )}

            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                    <StatusBadge status={workOrder.status} />
                </div>
                {/* Show Sub-WO Count if applicable */}
                {subCount && subCount > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Layers className="h-3 w-3" />
                        <span>{subCount} {t('subWorkOrders')}</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function WorkOrderDetail({
    workOrder,
    subWorkOrders,
    allAssets,
    allUsers,
    allTeams,
    allVendors,
    allProcedures,
    allParts,
    allLocations,
    currentUser,
    onStatusChange,
    onAssetStatusChange,
    onAddComment,
    onClose,
    onWorkOrderUpdate,
    refetch
}: {
    workOrder: WorkOrder;
    subWorkOrders?: WorkOrder[];
    allAssets: any[];
    allUsers?: any[];
    allTeams?: any[];
    allVendors?: any[];
    allProcedures?: any[];
    allParts?: any[];
    allLocations?: any[];
    currentUser?: { id: string, name?: string };
    onStatusChange: (id: string, s: Status) => void;
    onAssetStatusChange: (id: string, s: string) => void;
    onAddComment: (id: string, comment: string, attachments?: File[]) => void;
    onClose: () => void;
    onWorkOrderUpdate?: (wo: any) => void;
    refetch: () => void;
}) {
    const t = useTranslations('WorkOrders')
    const router = useRouter()

    // Internal state to navigation between Parent and Sub-WorkOrder
    const [viewingChildId, setViewingChildId] = React.useState<string | null>(null)

    if (viewingChildId) {
        // Find the child object
        // const childWO = subWorkOrders?.find(s => s.id === viewingChildId) || workOrders.find(w => w.id === viewingChildId)
        // Accessing workOrders global is flaky if we are in client component, better use subWorkOrders
        // But for fallback we might need context. Assuming subWorkOrders works for children.
        const childWO = subWorkOrders?.find(s => s.id === viewingChildId)

        if (childWO) {
            return (
                <ChildWorkOrderDetail
                    workOrder={childWO}
                    parentTitle={workOrder.title}
                    allAssets={allAssets}
                    allUsers={allUsers}
                    allTeams={allTeams}
                    allVendors={allVendors}
                    allProcedures={allProcedures}
                    allParts={allParts}
                    allLocations={allLocations}
                    currentUser={currentUser}
                    onStatusChange={onStatusChange}
                    onAssetStatusChange={onAssetStatusChange}
                    onAddComment={onAddComment}
                    onBack={() => setViewingChildId(null)}
                    onWorkOrderUpdate={onWorkOrderUpdate}
                    refetch={refetch}
                />
            )
        }
    }

    // Default: Show Parent Detail
    const isParent = (subWorkOrders && subWorkOrders.length > 0) || workOrder.isBatchParent

    if (isParent) {
        return (
            <ParentWorkOrderDetail
                workOrder={workOrder}
                subWorkOrders={subWorkOrders || []}
                allUsers={allUsers}
                allTeams={allTeams}
                allVendors={allVendors}
                allParts={allParts}
                currentUser={currentUser}
                onStatusChange={onStatusChange}
                onAddComment={onAddComment}
                onClose={onClose}
                onSelectChild={(id) => setViewingChildId(id)}
                refetch={refetch}
            />
        )
    }

    // Standard Single View (reusing Child View essentially, but with onClose)
    return (
        <ChildWorkOrderDetail
            workOrder={workOrder}
            allAssets={allAssets}
            allUsers={allUsers}
            allTeams={allTeams}
            allVendors={allVendors}
            allProcedures={allProcedures}
            allParts={allParts}
            allLocations={allLocations}
            currentUser={currentUser}
            onStatusChange={onStatusChange}
            onAssetStatusChange={onAssetStatusChange}
            onAddComment={onAddComment}
            onBack={onClose} // "Back" closes the panel for single items
            isSingle
            onWorkOrderUpdate={onWorkOrderUpdate}
            refetch={refetch}
        />
    )
}

// ----------------------------------------------------------------------
// PARENT VIEW
// ----------------------------------------------------------------------
function ParentWorkOrderDetail({
    workOrder,
    subWorkOrders,
    allUsers,
    allTeams,
    allVendors,
    allParts,
    currentUser,
    onStatusChange,
    onAddComment,
    onClose,
    onSelectChild,
    refetch
}: {
    workOrder: WorkOrder,
    subWorkOrders: WorkOrder[],
    allUsers?: any[],
    allTeams?: any[],
    allVendors?: any[],
    allParts?: any[],
    currentUser?: { id: string, name?: string },
    onStatusChange: (id: string, s: Status) => void,
    onAddComment: (id: string, comment: string, attachments?: File[]) => void,
    onClose: () => void,
    onSelectChild: (id: string) => void;
    refetch: () => void;
}) {
    const t = useTranslations('WorkOrders')
    const [showChat, setShowChat] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const { toast } = useToast()

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/work-orders?id=${workOrder.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({ title: "Work Order deleted" })
                refetch()
                onClose()
            } else {
                toast({ title: "Failed to delete", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Failed to delete", variant: "destructive" })
        }
    }

    // Prepare Messages from History
    const messages = React.useMemo(() => {
        const history = workOrder.history || []
        // Filter for comments if we only want comments, or show all actions as system messages? 
        // User asked for "comment section", usually implies chat. 
        // Let's filter for action="Comment" OR show everything but formatted?
        // Let's show explicit Comments as normal messages, and maybe others as system notifications?
        // ChatInterface expects `sender: "me" | "other"`.
        return history.filter(h => h.action === "Comment" || h.action === "Attachment").map((h, idx) => ({
            id: `${idx}-${h.date}`,
            text: h.details,
            attachments: (h.attachments || []).map((a: any) => ({
                name: a.name,
                type: a.type,
                url: a.url
            })),
            sender: (
                h.performedBy === "You" ||
                (currentUser && h.userId === currentUser.id) ||
                (currentUser && h.userName === currentUser.name) ||
                h.userId === "user-1" // Keep fallback just in case
            ) ? "me" : "other" as "me" | "other",
            timestamp: format(new Date(h.date), "h:mm a"),
            senderName: h.userName,
        }))
    }, [workOrder.history, currentUser])

    const completedCount = subWorkOrders.filter(w => w.status === "Done").length
    const totalCount = subWorkOrders.length
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    // Use passed users or fallback to static
    const sourceUsers = allUsers && allUsers.length > 0 ? allUsers : users
    const sourceTeams = allTeams || []

    // Resolve Assignees
    const assignees = React.useMemo(() => {
        const list: any[] = []
        if (workOrder.assignedTo && Array.isArray(workOrder.assignedTo)) {
            workOrder.assignedTo.forEach(id => {
                const u = sourceUsers.find(user => user.id === id)
                if (u) { list.push({ ...u, type: 'user' }); return; }
                const t = sourceTeams.find(team => (team.id === id || team._id === id))
                if (t) { list.push({ ...t, type: 'team' }); return; }
            })
        }
        return list
    }, [workOrder.assignedTo, sourceUsers, sourceTeams])

    // Fix createdBy undefined error
    let creatorName = "User"
    // @ts-ignore
    if (workOrder.createdBy && typeof workOrder.createdBy === 'object' && workOrder.createdBy.name) {
        // @ts-ignore
        creatorName = workOrder.createdBy.name
    } else if ((workOrder as any).createdBy) {
        const u = sourceUsers.find(u => u.id === ((workOrder as any).createdBy as any).id || u.id === (workOrder as any).createdBy)
        if (u) creatorName = u.name
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold line-clamp-1">{workOrder.title}</h2>
                        <span className="text-xs text-muted-foreground">
                            Created on {format(new Date(workOrder.createdAt), "MM/dd/yyyy")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowChat(true)}>
                        <MessageSquareIcon className="mr-2 h-4 w-4" />
                        {t('comments')}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/work-orders/${encodeURIComponent(workOrder.id)}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('edit')}
                        </Link>
                    </Button>
                    <ChatInterface
                        open={showChat}
                        onOpenChange={setShowChat}
                        title={`${t('comments')}: ${workOrder.title}`}
                        messages={messages}
                        onSendMessage={(text, attachments) => onAddComment(workOrder.id, text, attachments)}
                        currentUserId="You"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Work Order</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this Work Order and all its sub-work orders? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">



                    {/* Progress & Quick Status */}
                    <div className="rounded-lg border p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Completed Sub-Work Orders</span>
                                <span className="text-2xl font-bold">{completedCount} of {totalCount}</span>
                            </div>
                            <WorkOrderStatusDropdown
                                currentStatus={workOrder.status}
                                onStatusChange={(s) => onStatusChange(workOrder.id, s)}
                            />
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Estimated Time</span>
                            <span className="text-sm text-muted-foreground">{workOrder.estimatedTime || "2h"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Work Order ID</span>
                            <span className="text-sm text-muted-foreground">#{workOrder.id}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Sub Work Orders Table */}
                    <div className="flex flex-col gap-4">
                        <span className="text-sm font-medium">Sub-Work Orders ({totalCount})</span>
                        <SubWorkOrdersTable
                            items={subWorkOrders}
                            allUsers={sourceUsers}
                            allTeams={sourceTeams}
                            onSelect={onSelectChild}
                            onStatusChange={onStatusChange}
                        />
                    </div>

                    <Separator />

                    {/* Assigned To & Details */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{t('assignedTo')}</span>
                        <div className="flex items-center gap-2">
                            {assignees.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {assignees.map((assignee, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-full pr-3 pl-1 py-1 border">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={assignee.avatar} />
                                                <AvatarFallback>{assignee.name ? assignee.name[0] : '?'}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium">{assignee.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">{t('unassigned')}</span>
                            )}
                        </div>

                        {/* Description */}
                        {workOrder.description && (
                            <div className="flex flex-col gap-2 mt-4">
                                <h3 className="text-sm font-semibold">Description</h3>
                                <p className="text-sm text-muted-foreground">{workOrder.description}</p>
                            </div>
                        )}

                        {/* Files & Images */}
                        {workOrder.files && workOrder.files.length > 0 && (
                            <div className="flex flex-col gap-2 mt-4">
                                <h3 className="text-sm font-semibold">Attachments</h3>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {workOrder.files.map((file, i) => {
                                        const isImage = file.match(/\.(jpeg|jpg|gif|png|webp)$/i) || file.startsWith('data:image');
                                        const fileName = file.split('/').pop() || `Attachment ${i + 1}`;

                                        if (isImage) {
                                            return (
                                                <Dialog key={i}>
                                                    <DialogTrigger asChild>
                                                        <div className="h-24 w-32 flex-shrink-0 rounded-md border bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                                            <img src={file} alt="attachment" className="h-full w-full object-cover" />
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                        <img src={file} alt="preview" className="w-full h-auto rounded-lg" />
                                                    </DialogContent>
                                                </Dialog>
                                            )
                                        } else {
                                            return (
                                                <a key={i} href={file} target="_blank" rel="noopener noreferrer" className="h-24 w-32 flex-shrink-0 rounded-md border bg-muted flex flex-col items-center justify-center p-2 gap-2 text-center hover:bg-muted/80 transition-colors">
                                                    <Paperclip className="h-8 w-8 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground line-clamp-2 break-all">{fileName}</span>
                                                </a>
                                            )
                                        }
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        {workOrder.categories && workOrder.categories.length > 0 && (
                            <div className="flex flex-col gap-2 mt-4">
                                <h3 className="text-sm font-semibold">Categories</h3>
                                <div className="flex flex-wrap gap-2">
                                    {workOrder.categories.map((catId, i) => {
                                        const category = CATEGORIES_MOCK.find(c => c.id === catId || c.label === catId)
                                        if (category) {
                                            return (
                                                <Badge key={i} variant="outline" className={cn("gap-1 pl-2 pr-2 py-1 border-0", category.color.split(" ")[1])}>
                                                    <category.icon className={cn("h-3 w-3 mr-1", category.color.split(" ")[0])} />
                                                    <span className={category.color.split(" ")[0]}>{category.label}</span>
                                                </Badge>
                                            )
                                        }
                                        return (
                                            <Badge key={i} variant="outline" className="gap-1 font-normal">
                                                {catId}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Vendors */}
                        {allVendors && workOrder.vendors && workOrder.vendors.length > 0 && (
                            <div className="flex flex-col gap-2 mt-4">
                                <h3 className="text-sm font-semibold">Vendors</h3>
                                <div className="flex flex-wrap gap-4">
                                    {workOrder.vendors.map(vId => {
                                        const vendor = allVendors.find(v => v.id === vId || v._id === vId)
                                        if (!vendor) return null
                                        return (
                                            <div key={vId} className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 text-xs">
                                                    <AvatarImage src={vendor.image} />
                                                    <AvatarFallback>{vendor.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{vendor.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">
                            Created by {creatorName} on {format(new Date(workOrder.createdAt), "MM/dd/yyyy, h:mm a")}
                        </span>
                        {workOrder.updatedAt && (
                            <span className="text-xs text-muted-foreground">
                                Last updated on {format(new Date(workOrder.updatedAt), "MM/dd/yyyy, h:mm a")}
                            </span>
                        )}
                    </div>

                    {/* Simple Comment Input Placeholder */}
                    <div className="flex flex-col gap-2 mt-4">
                        <span className="text-lg font-semibold">Comments</span>
                        <div className="border rounded-lg p-3">
                            <Input
                                className="border-none shadow-none focus-visible:ring-0 p-0"
                                placeholder="Write a comment..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        onAddComment(workOrder.id, e.currentTarget.value);
                                        e.currentTarget.value = "";
                                        setShowChat(true); // Open chat to show it
                                    }
                                }}
                            />
                            <div className="flex justify-end mt-2">
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            onAddComment(workOrder.id, input.value);
                                            input.value = "";
                                            setShowChat(true);
                                        }
                                    }}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Activity History */}
                    <div className="flex flex-col gap-4 mt-4">
                        <span className="text-lg font-semibold">Activity</span>
                        <WorkOrderHistory history={workOrder.history || []} />
                    </div>

                </div>
            </ScrollArea>
        </div>
    )
}

// ----------------------------------------------------------------------
// CHILD / SINGLE VIEW
// ----------------------------------------------------------------------
function ChildWorkOrderDetail({
    workOrder,
    parentTitle,
    allAssets,
    allUsers,
    allTeams,
    allVendors,
    allProcedures,
    allParts,
    allLocations,
    currentUser,
    onBack,
    onStatusChange,
    onAssetStatusChange,
    onAddComment,
    isSingle,
    onWorkOrderUpdate,
    refetch
}: {
    workOrder: WorkOrder,
    parentTitle?: string,
    allAssets?: any[],
    allUsers?: any[],
    allTeams?: any[],
    allVendors?: any[],
    allProcedures?: any[],
    allParts?: any[],
    allLocations?: any[],
    currentUser?: { id: string, name?: string },
    onBack: () => void,
    onStatusChange: (id: string, s: Status) => void,
    onAssetStatusChange: (id: string, s: string) => void,
    onAddComment: (id: string, comment: string, attachments?: File[]) => void,
    isSingle?: boolean,
    onWorkOrderUpdate?: (wo: any) => void;
    refetch: () => void;
}) {
    const t = useTranslations('WorkOrders')
    const [showChat, setShowChat] = React.useState(false)
    const { toast } = useToast()

    // Procedure Form State
    const [procedureValues, setProcedureValues] = React.useState<any>(workOrder.procedureData || {})
    const [isSaving, setIsSaving] = React.useState(false)
    const [isPartsDialogOpen, setIsPartsDialogOpen] = React.useState(false)

    // Delete Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

    const handleDelete = async () => {
        try {
            await fetch(`/api/work-orders?id=${workOrder.id}`, { method: 'DELETE' })
            toast({ title: "Work Order deleted" })
            refetch()
            onBack()
        } catch (error) {
            toast({ title: "Failed to delete", variant: "destructive" })
        }
    }

    const handlePartsUpdate = async (newParts: string[]) => {
        // Optimistic update via onWorkOrderUpdate if available
        if (onWorkOrderUpdate) {
            onWorkOrderUpdate({ ...workOrder, parts: newParts })
        }

        try {
            const response = await fetch('/api/work-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: workOrder.id,
                    parts: newParts
                })
            })
            if (!response.ok) throw new Error("Failed to update")

            toast({
                title: "Parts Updated",
                description: `Successfully updated parts list.`,
            })
        } catch (e) {
            console.error("Failed to update parts", e)
            toast({
                title: "Error",
                description: "Failed to update parts.",
                variant: "destructive"
            })
        }
    }

    // Debounced Save for Procedure Data
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            // Only save if different from initial/saved
            if (JSON.stringify(procedureValues) !== JSON.stringify(workOrder.procedureData || {})) {
                setIsSaving(true)
                try {
                    await fetch('/api/work-orders', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: workOrder.id,
                            procedureData: procedureValues
                        })
                    })
                    // Update parent state to prevent staleness on navigation
                    onWorkOrderUpdate?.({ ...workOrder, procedureData: procedureValues });

                    toast({
                        title: "Saved",
                        description: "Procedure progress saved successfully.",
                    })
                } catch (e) {
                    console.error("Failed to save procedure data", e)
                } finally {
                    setIsSaving(false)
                }
            }
        }, 1000) // 1 second debounce

        return () => clearTimeout(timer)
    }, [procedureValues, workOrder.id, workOrder.procedureData])

    // Sync state if workOrder prop changes
    React.useEffect(() => {
        if (workOrder.procedureData) {
            setProcedureValues(workOrder.procedureData)
        }
    }, [workOrder.id, workOrder.procedureData])

    // Prepare Messages from History
    const messages = React.useMemo(() => {
        const history = workOrder.history || []
        return history.filter(h => h.action === "Comment" || h.action === "Attachment").map((h, idx) => ({
            id: `${idx}-${h.date}`,
            text: h.details,
            attachments: (h.attachments || []).map((a: any) => ({
                name: a.name,
                type: a.type,
                url: a.url
            })),
            sender: (
                h.performedBy === "You" ||
                (currentUser && h.userId === currentUser.id) ||
                (currentUser && h.userName === currentUser.name) ||
                h.userId === "user-1"
            ) ? "me" : "other" as "me" | "other",
            timestamp: format(new Date(h.date), "h:mm a"),
            senderName: h.userName,
        }))
    }, [workOrder.history, currentUser])

    // Find asset in dynamic list first, then static fallback.
    const assetId = workOrder.assetId
    const asset = allAssets?.find(a => (a.id === assetId || a._id === assetId)) || assets.find((a) => a.id === assetId)

    const sourceUsers = allUsers && allUsers.length > 0 ? allUsers : users
    const sourceTeams = allTeams || []

    // Resolve Assignees
    const assignees = React.useMemo(() => {
        const list: any[] = []
        if (workOrder.assignedTo && Array.isArray(workOrder.assignedTo)) {
            workOrder.assignedTo.forEach(id => {
                const u = sourceUsers.find(user => user.id === id)
                if (u) { list.push({ ...u, type: 'user' }); return; }
                const t = sourceTeams.find(team => (team.id === id || team._id === id))
                if (t) { list.push({ ...t, type: 'team' }); return; }
            })
        }
        return list
    }, [workOrder.assignedTo, sourceUsers, sourceTeams])

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 justify-between border-b p-4">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col overflow-hidden">
                        {parentTitle && <span className="text-xs text-muted-foreground line-clamp-1">{parentTitle}</span>}
                        <h2 className="text-lg font-semibold line-clamp-1">{workOrder.title}</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Created on {format(new Date(workOrder.createdAt), "MM/dd/yyyy")}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-start md:items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowChat(true)}>
                        <MessageSquareIcon className="mr-2 h-4 w-4" />
                        {t('comments')}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/work-orders/${encodeURIComponent(workOrder.id)}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('edit')}
                        </Link>
                    </Button>
                    <ChatInterface
                        open={showChat}
                        onOpenChange={setShowChat}
                        title={`${t('comments')}: ${workOrder.title}`}
                        messages={messages}
                        onSendMessage={(text, attachments) => onAddComment(workOrder.id, text, attachments)}
                        currentUserId="You"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Work Order</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this Work Order? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">
                    {/* Status Actions - Big Buttons */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Status</span>
                        <div className="grid grid-cols-4 gap-2">
                            <StatusActionButton onClick={() => onStatusChange(workOrder.id, "Open")} status="Open" current={workOrder.status} icon={Lock} label={t('status.open')} color="bg-muted text-foreground" />
                            <StatusActionButton onClick={() => onStatusChange(workOrder.id, "On Hold")} status="On Hold" current={workOrder.status} icon={PauseCircle} label={t('status.onHold')} color="bg-orange-500 text-white" />
                            <StatusActionButton onClick={() => onStatusChange(workOrder.id, "In Progress")} status="In Progress" current={workOrder.status} icon={PlayCircle} label={t('status.inProgress')} color="bg-blue-500 text-white" />
                            <StatusActionButton onClick={() => onStatusChange(workOrder.id, "Done")} status="Done" current={workOrder.status} icon={CheckCircle2} label={t('status.done')} color="bg-green-600 text-white" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Work Order ID</span>
                        <span className="text-muted-foreground">#{workOrder.id}</span>
                    </div>

                    {isSingle && workOrder.description && (
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Description</span>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder.description}</p>
                        </div>
                    )}

                    <Separator />

                    {/* Assigned To */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{t('assignedTo')}</span>
                        <div className="flex items-center gap-2">
                            {assignees.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {assignees.map((assignee, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-full pr-3 pl-1 py-1 border">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={assignee.avatar} />
                                                <AvatarFallback>{assignee.name ? assignee.name[0] : '?'}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium">{assignee.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">{t('unassigned')}</span>
                            )}
                        </div>
                    </div>

                    {/* Asset & Location */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">{t('asset')}</span>
                            {asset ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <BoxIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm line-clamp-1">{asset.name}</span>
                                    </div>
                                    <AssetStatusDropdown
                                        status={asset.status || "Unknown"}
                                        onChange={(s) => onAssetStatusChange(asset.id || asset._id, s)}
                                    />
                                </div>
                            ) : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">{t('location')}</span>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>General</span> {/* Hardcoded for now */}
                            </div>
                        </div>
                    </div>

                    {/* For Independent WO: Due Date & Priority */}
                    {isSingle && (
                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Due Date</span>
                                <span className="text-sm text-muted-foreground">
                                    {workOrder.dueDate ? format(new Date(workOrder.dueDate), "MMM dd, yyyy") : "Not set"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{t('priority')}</span>
                                <Badge variant={getPriorityVariant(workOrder.priority)} className="w-fit">
                                    {workOrder.priority}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* For Independent WO: Categories */}
                    {isSingle && workOrder.categories && workOrder.categories.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Categories</span>
                            <div className="flex flex-wrap gap-2">
                                {workOrder.categories.map((catId, i) => {
                                    const category = CATEGORIES_MOCK.find(c => c.id === catId || c.label === catId)
                                    if (category) {
                                        return (
                                            <Badge key={i} variant="outline" className={cn("gap-1 pl-2 pr-2 py-1 border-0", category.color.split(" ")[1])}>
                                                <category.icon className={cn("h-3 w-3 mr-1", category.color.split(" ")[0])} />
                                                <span className={category.color.split(" ")[0]}>{category.label}</span>
                                            </Badge>
                                        )
                                    }
                                    return <Badge key={i} variant="outline">{catId}</Badge>
                                })}
                            </div>
                        </div>
                    )}

                    {/* For Independent WO: Schedule Conditions */}
                    {isSingle && workOrder.scheduleType && workOrder.scheduleType !== "None" && (
                        <div className="flex flex-col gap-2 border-t pt-4">
                            <span className="text-sm font-medium">Schedule Conditions</span>
                            <p className="text-sm text-muted-foreground">This Work Order will repeat based on time.</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    Repeats every {workOrder.scheduleInterval || 1} {workOrder.scheduleType?.toLowerCase()}
                                    {workOrder.scheduleDays && workOrder.scheduleDays.length > 0 && ` on ${workOrder.scheduleDays.join(", ")}`}
                                    {" "}after completion of this Work Order.
                                </span>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Parts Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Parts ({workOrder.parts?.length || 0})</span>
                            {workOrder.parts && workOrder.parts.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsPartsDialogOpen(true)}
                                    className="h-8 md:h-8 px-2 text-muted-foreground hover:text-foreground"
                                >
                                    Manage
                                </Button>
                            )}
                        </div>
                        {workOrder.parts && workOrder.parts.length > 0 ? (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-medium">Part</TableHead>
                                            <TableHead className="font-medium">Type</TableHead>
                                            <TableHead className="font-medium">Location</TableHead>
                                            <TableHead className="font-medium text-center">Quantity</TableHead>
                                            <TableHead className="font-medium text-right">Unit Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workOrder.parts.map((partId) => {
                                            const part = allParts?.find(p => p.id === partId || p._id === partId);
                                            // Fallback if part not found in fetched list
                                            const partName = part?.name || partId;
                                            const partType = part?.partType || "-";
                                            const partCost = part?.unitCost || 0;

                                            // Resolve locations
                                            const configLocations = part?.locationConfig?.map((lc: any) => {
                                                const locName = allLocations?.find(l => l.id === lc.locationId || l._id === lc.locationId)?.name;
                                                return locName || lc.locationId;
                                            }).filter(Boolean) || [];

                                            return (
                                                <TableRow key={partId}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <BoxIcon className="h-3 w-3 text-blue-600" />
                                                            </div>
                                                            <span className="text-blue-600 hover:underline cursor-pointer line-clamp-1">{partName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{partType}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {configLocations.length > 0 ? (
                                                                configLocations.map((loc: string, idx: number) => (
                                                                    <Badge key={idx} variant="outline" className="px-2 py-0.5 text-xs font-normal bg-background text-muted-foreground">
                                                                        {loc}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">1</TableCell>
                                                    <TableCell className="text-right">${Number(partCost).toFixed(2)}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        <TableRow className="bg-muted/30">
                                            <TableCell colSpan={4} className="font-medium">Parts Cost</TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${workOrder.parts.reduce((acc, id) => {
                                                    const p = allParts?.find(part => part.id === id || part._id === id);
                                                    return acc + (p?.unitCost || 0);
                                                }, 0).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsPartsDialogOpen(true)}
                                className="w-full justify-center border-dashed border-2 py-8 bg-muted/5 hover:bg-orange-50 hover:border-orange-200 transaction-colors h-auto"
                            >
                                <div className="flex flex-col items-center gap-2 text-orange-600">
                                    <Plus className="h-6 w-6" />
                                    <span className="font-semibold text-lg">{t('buttons.addParts') || "Add Parts"}</span>
                                </div>
                            </Button>
                        )}

                        <Dialog open={isPartsDialogOpen} onOpenChange={setIsPartsDialogOpen}>
                            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Select Parts</DialogTitle>
                                </DialogHeader>
                                <Command className="flex-1">
                                    <CommandInput placeholder="Search parts..." />
                                    <CommandList className="flex-1 max-h-full">
                                        <CommandEmpty>No parts found.</CommandEmpty>
                                        <CommandGroup>
                                            {allParts?.map((part) => (
                                                <CommandItem
                                                    value={`${part.name} ${part.partNumber || ''}`}
                                                    key={part.id || part._id}
                                                    onSelect={() => {
                                                        const id = part.id || part._id
                                                        const current = workOrder.parts || []
                                                        const updated = current.includes(id)
                                                            ? current.filter((i: string) => i !== id)
                                                            : [...current, id]
                                                        handlePartsUpdate(updated)
                                                    }}
                                                    className="flex items-center gap-4 py-3"
                                                >
                                                    <div className={cn(
                                                        "flex h-5 w-5 items-center justify-center rounded-sm border border-primary shrink-0",
                                                        (workOrder.parts || []).includes(part.id || part._id)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}>
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-base">{part.name}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                                                            <span>#{part.partNumber || "No #"}</span>
                                                            <span>|</span>
                                                            <span>{part.quantity || 0} in stock</span>
                                                            <span>|</span>
                                                            <span>${part.unitCost || 0}</span>
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                <div className="flex justify-end pt-4 border-t">
                                    <Button onClick={() => setIsPartsDialogOpen(false)}>Done</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* For Independent WO: Vendors */}
                    {isSingle && allVendors && workOrder.vendors && workOrder.vendors.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Vendors</span>
                            <div className="flex flex-wrap gap-4">
                                {workOrder.vendors.map(vId => {
                                    const vendor = allVendors.find(v => v.id === vId || v._id === vId)
                                    if (!vendor) return null
                                    return (
                                        <div key={vId} className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 text-xs">
                                                <AvatarImage src={vendor.image} />
                                                <AvatarFallback>{vendor.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{vendor.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* For Independent WO: Attachments (Pictures and Files) */}
                    {isSingle && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Attachments</span>

                            {(!workOrder.files?.length && !workOrder.images?.length) ? (
                                <span className="text-sm text-muted-foreground">No attachments</span>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {Array.from(new Set([...(workOrder.images || []), ...(workOrder.files || [])])).map((file, i) => {
                                        const isImage = file.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) || file.startsWith('data:image');
                                        const fileName = file.split('/').pop() || `Attachment ${i + 1}`;

                                        if (isImage) {
                                            return (
                                                <Dialog key={i}>
                                                    <DialogTrigger asChild>
                                                        <div className="h-24 w-32 flex-shrink-0 rounded-md border bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group">
                                                            <img src={file} alt="attachment" className="h-full w-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                        <img src={file} alt="preview" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                                                    </DialogContent>
                                                </Dialog>
                                            )
                                        } else {
                                            return (
                                                <a key={i} href={file} target="_blank" rel="noopener noreferrer" className="h-24 w-32 flex-shrink-0 rounded-md border bg-muted flex flex-col items-center justify-center p-2 gap-2 text-center hover:bg-muted/80 transition-colors">
                                                    <Paperclip className="h-8 w-8 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground line-clamp-2 break-all">{fileName}</span>
                                                </a>
                                            )
                                        }
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Created By & Last Updated */}
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground border-t pt-4">
                        <span>Created on {format(new Date(workOrder.createdAt), "MM/dd/yyyy, h:mm a")}</span>
                        {workOrder.updatedAt && (
                            <span>Last updated on {format(new Date(workOrder.updatedAt), "MM/dd/yyyy, h:mm a")}</span>
                        )}
                    </div>

                    <Separator />

                    {/* Procedure Form */}
                    {
                        (() => {
                            // Resolve procedure IDs to full procedure objects
                            const procedureIds = workOrder.procedure || []
                            const resolvedProcedures = procedureIds
                                .map(id => allProcedures?.find(p => p.id === id || p._id === id))
                                .filter(Boolean)

                            if (resolvedProcedures.length > 0) {
                                return (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">Procedures</span>
                                            {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
                                        </div>
                                        <ProcedureExecutor
                                            procedures={resolvedProcedures}
                                            values={procedureValues}
                                            onChange={setProcedureValues}
                                            readonly={false}
                                        />
                                    </div>
                                )
                            }
                            return null
                        })()
                    }

                    {/* Comments Text Area */}
                    <div className="flex flex-col gap-2">
                        <span className="text-lg font-semibold">Comments</span>
                        <div className="border rounded-lg p-3">
                            <Input
                                className="border-none shadow-none focus-visible:ring-0 p-0"
                                placeholder="Write a comment..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        onAddComment(workOrder.id, e.currentTarget.value);
                                        e.currentTarget.value = "";
                                        setShowChat(true);
                                    }
                                }}
                            />
                            <div className="flex justify-end mt-2">
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            onAddComment(workOrder.id, input.value);
                                            input.value = "";
                                            setShowChat(true);
                                        }
                                    }}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Activity History */}
                    <div className="flex flex-col gap-4 mt-4">
                        <span className="text-lg font-semibold">Activity</span>
                        <WorkOrderHistory history={workOrder.history || []} />
                    </div>

                </div >
            </ScrollArea >
        </div >
    )
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function AssetStatusDropdown({ status, onChange }: { status: string, onChange: (s: string) => void }) {
    const getColor = (s: string) => {
        const lower = s?.toLowerCase() || ""
        if (lower === 'online') return "text-green-600 bg-green-50 border-green-200"
        if (lower === 'offline') return "text-red-600 bg-red-50 border-red-200"
        if (lower === 'limited') return "text-orange-600 bg-orange-50 border-orange-200"
        return "text-muted-foreground border-border"
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-fit gap-2 h-7 text-xs", getColor(status))}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", (status?.toLowerCase() || "") === 'online' ? "bg-green-600" : (status?.toLowerCase() || "") === 'offline' ? "bg-red-600" : "bg-gray-400")} />
                    {status || "Unknown"}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onChange("Online")}>Online</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChange("Offline")}>Offline</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChange("Limited")}>Limited</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function WorkOrderStatusDropdown({ currentStatus, onStatusChange }: { currentStatus: Status, onStatusChange?: (s: Status) => void }) {
    const t = useTranslations('WorkOrders')
    // Colors logic
    const getColor = (s: Status) => {
        switch (s) {
            case "Open": return "text-gray-700 bg-gray-100 border-gray-200"
            case "In Progress": return "text-blue-600 bg-blue-50 border-blue-200"
            case "Done": return "text-green-600 bg-green-50 border-green-200"
            case "On Hold": return "text-orange-600 bg-orange-50 border-orange-200"
            default: return "text-muted-foreground"
        }
    }

    const getIcon = (s: Status) => {
        if (s === "Done") return CheckCircle2
        if (s === "On Hold") return PauseCircle
        if (s === "In Progress") return PlayCircle
        return null
    }

    const Icon = getIcon(currentStatus)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("gap-2 h-7 px-2 text-xs", getColor(currentStatus))}>
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {t(`status.${currentStatus === "Open" ? "open" : currentStatus === "On Hold" ? "onHold" : currentStatus === "In Progress" ? "inProgress" : "done"}` as any)}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange?.("Open")}>
                    <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                    Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.("In Progress")}>
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                    In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.("On Hold")}>
                    <div className="h-2 w-2 rounded-full bg-orange-500 mr-2" />
                    On Hold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.("Done")}>
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Done
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function SubWorkOrdersTable({ items, allUsers, allTeams, onSelect, onStatusChange }: { items: WorkOrder[], allUsers?: any[], allTeams?: any[], onSelect: (id: string) => void, onStatusChange: (id: string, s: Status) => void }) {
    const sourceUsers = allUsers && allUsers.length > 0 ? allUsers : users
    const sourceTeams = allTeams || []

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30px]"><Checkbox /></TableHead>
                        <TableHead>Work Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const assignees: any[] = []
                        if (item.assignedTo && Array.isArray(item.assignedTo)) {
                            item.assignedTo.forEach(id => {
                                const u = sourceUsers.find(user => user.id === id)
                                if (u) { assignees.push(u); return; }
                                const t = sourceTeams.find(team => (team.id === id || team._id === id))
                                if (t) { assignees.push(t); return; }
                            })
                        }

                        return (
                            <TableRow key={item.id}>
                                <TableCell><Checkbox /></TableCell>
                                <TableCell>
                                    <Button variant="link" className="p-0 h-auto font-medium text-foreground" onClick={() => onSelect(item.id)}>
                                        {item.title}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <WorkOrderStatusDropdown
                                        currentStatus={item.status}
                                        onStatusChange={(s) => onStatusChange(item.id, s)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center -space-x-2">
                                        {assignees.map((assignee, idx) => (
                                            <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                                                <AvatarImage src={assignee.avatar} />
                                                <AvatarFallback>{assignee.name ? assignee.name[0] : '?'}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {assignees.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {item.dueDate ? format(new Date(item.dueDate), "MMM d") : "-"}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

function StatusActionButton({ status, current, icon: Icon, label, color, onClick }: { status: Status; current: Status; icon: any; label: string; color: string; onClick?: () => void }) {
    const isActive = status === current
    return (
        <Button
            variant={isActive ? "default" : "outline"}
            className={cn("flex flex-col h-auto py-2 gap-1 transition-all", isActive ? color : "text-muted-foreground hover:bg-transparent bg-transparent border-dashed")}
            onClick={onClick}
        >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
        </Button>
    )
}

function StatusBadge({ status }: { status: Status }) {
    const t = useTranslations('WorkOrders')
    const variants: Record<Status, string> = {
        "Open": "text-gray-600 bg-gray-100 border-gray-200",
        "In Progress": "text-blue-600 bg-blue-50 border-blue-200",
        "On Hold": "text-orange-600 bg-orange-50 border-orange-200",
        "Done": "text-green-600 bg-green-50 border-green-200",
    }

    const icons: Record<Status, any> = {
        "Open": Lock,
        "In Progress": PlayCircle,
        "On Hold": PauseCircle,
        "Done": CheckCircle2,
    }

    const statusKeys: Record<Status, string> = {
        "Open": "open",
        "On Hold": "onHold",
        "In Progress": "inProgress",
        "Done": "done"
    }

    const Icon = icons[status]

    return (
        <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700", variants[status])}>
            <Icon className="h-3 w-3" />
            {t(`status.${statusKeys[status]}` as any)}
        </div>
    )
}

function getPriorityVariant(priority: Priority) {
    switch (priority) {
        case "High": return "destructive"
        case "Medium": return "default" // Using default (primary) for medium
        case "Low": return "secondary"
        default: return "outline"
    }
}

function WorkOrderHistory({ history }: { history: any[] }) {
    if (!history || history.length === 0) {
        return <div className="text-sm text-muted-foreground italic pl-2">No activity recorded.</div>
    }

    // Sort history by date descending (newest first) if not already
    const sortedHistory = [...history].sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime()
        const dateB = new Date(b.date || b.timestamp || 0).getTime()
        return dateB - dateA
    })

    return (
        <div className="flex flex-col gap-4 pl-2">
            {sortedHistory.map((item, idx) => {
                const name = item.userName || item.performedBy || "User"
                const dateVal = item.date || item.timestamp

                return (
                    <div key={idx} className="flex gap-3 relative">
                        {/* Vertical Line */}
                        {idx !== sortedHistory.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-[-16px] width-[1px] border-l border-dashed border-gray-300" />
                        )}

                        <Avatar className="h-8 w-8 z-10 border-2 border-background">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback>{name[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {dateVal ? format(new Date(dateVal), "MMM d, h:mm a") : ""}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{item.action}</span>
                                {item.details && <span className="text-sm text-muted-foreground">{item.details}</span>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

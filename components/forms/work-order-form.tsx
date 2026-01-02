"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, Upload, X, Plus, FileText, Paperclip, Package, Zap, Wrench, RefreshCw, Snowflake, ShieldCheck, CheckCircle2, Loader2, Trash2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"

import { CATEGORIES_MOCK } from "@/lib/mock-data"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { TreeSelect, buildTree } from "@/components/ui/tree-select"
import { AssetSelectionControl } from "@/components/forms/work-order/asset-selection-control"
import { ProcedureSelector } from "@/components/forms/work-order/procedure-selector"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const formSchema = z.object({
    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }),
    description: z.string().optional(),
    procedure: z.array(z.string()).default([]),
    locationIds: z.array(z.string()).min(1, { message: "Please select at least one location." }),
    assetIds: z.array(z.string()).optional(),
    priority: z.enum(["None", "Low", "Medium", "High"]),
    criticality: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
    dueDate: z.date().optional(),
    startDate: z.date().optional(),
    assignedTo: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    vendors: z.array(z.string()).default([]),
    parts: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    files: z.array(z.string()).default([]),
    scheduleType: z.enum(["None", "Daily", "Weekly", "Monthly", "Yearly"]).default("None"),
    scheduleInterval: z.coerce.number().min(1).default(1),
    scheduleDays: z.array(z.string()).default([]),
    scheduleMonthDay: z.string().optional(),
    estimatedDuration: z.object({
        hours: z.coerce.number().min(0).default(0),
        minutes: z.coerce.number().min(0).max(59).default(0)
    }).optional(),
})

const SCHEDULE_TYPES = ["None", "Daily", "Weekly", "Monthly", "Yearly"]
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface WorkOrderFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
    workOrderId?: string
}

export function WorkOrderForm({ initialData, isEditing = false, workOrderId }: WorkOrderFormProps) {
    const t = useTranslations('WorkOrderForm')
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [isPartsDialogOpen, setIsPartsDialogOpen] = useState(false)

    // State for options
    const [users, setUsers] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [assets, setAssets] = useState<any[]>([])
    const [procedures, setProcedures] = useState<any[]>([])
    const [parts, setParts] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [assignedProcedures, setAssignedProcedures] = useState<Record<string, string>>({})

    // Upload State
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isUploadingFile, setIsUploadingFile] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            title: "",
            procedure: [],
            priority: "None",
            assignedTo: [],
            locationIds: [],
            assetIds: [],
            scheduleType: "None",
            scheduleInterval: 1,
            scheduleDays: [],
            scheduleMonthDay: "1",
            categories: [],
            vendors: [],
            parts: [],
            images: [],
            files: [],
            estimatedDuration: { hours: 0, minutes: 0 },
        },
    })

    const scheduleType = form.watch("scheduleType")
    const selectedAssetIds = form.watch("assetIds") || []
    const showMainProcedure = selectedAssetIds.length <= 1

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, teamsRes, locRes, assetsRes, proceduresRes, partsRes, vendorsRes] = await Promise.all([
                    axios.get('/api/users'),
                    axios.get('/api/teams'),
                    axios.get('/api/locations'),
                    axios.get('/api/assets'),
                    axios.get('/api/procedures'),
                    axios.get('/api/parts'),
                    axios.get('/api/vendors')
                ])
                setUsers(Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || []))
                setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.items || []))
                setLocations(Array.isArray(locRes.data) ? locRes.data : (locRes.data.items || []))
                setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : (assetsRes.data.items || []))
                setProcedures(Array.isArray(proceduresRes.data) ? proceduresRes.data : (proceduresRes.data.items || []))
                setParts(Array.isArray(partsRes.data) ? partsRes.data : (partsRes.data.items || []))
                setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : (vendorsRes.data.items || []))
            } catch (error) {
                console.error("Failed to fetch form data options", error)
            }
        }
        fetchData()
    }, [])

    // Handle Schedule Defaults
    useEffect(() => {
        if (scheduleType === "Daily") {
            form.setValue("scheduleDays", DAYS_OF_WEEK)
        } else if (scheduleType === "Weekly") {
            const currentDays = form.getValues("scheduleDays")
            if (currentDays.length === 0 || currentDays.length === 7) {
                form.setValue("scheduleDays", ["Wed"])
            }
        }
    }, [scheduleType, form])

    // Handle Procedure URL Param
    useEffect(() => {
        const procedureId = searchParams.get('procedureId')
        if (procedureId && procedures.length > 0) {
            const current = form.getValues('procedure')
            if (current.length === 0) {
                // Check if procedure exists (optional but good)
                const exists = procedures.some(p => (p.id || p._id) === procedureId)
                if (exists) {
                    form.setValue('procedure', [procedureId])
                }
            }
        }
    }, [searchParams, procedures, form])

    // Handle Part URL Param
    useEffect(() => {
        const partId = searchParams.get('partId')
        if (partId && parts.length > 0) {
            const current = form.getValues('parts')
            if (current.length === 0) {
                const exists = parts.some(p => (p.id || p._id) === partId)
                if (exists) {
                    form.setValue('parts', [partId])
                }
            }
        }
    }, [searchParams, parts, form])

    // Handle Asset URL Param
    useEffect(() => {
        const assetId = searchParams.get('assetId')
        if (assetId && assets.length > 0) {
            const current = form.getValues('assetIds')
            if (!current || current.length === 0) {
                const exists = assets.some(a => (a.id || a._id) === assetId)
                if (exists) {
                    form.setValue('assetIds', [assetId])
                }
            }
        }
    }, [searchParams, assets, form])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const setIsUploading = type === 'image' ? setIsUploadingImage : setIsUploadingFile
        const fieldName = type === 'image' ? 'images' : 'files'

        setIsUploading(true)
        try {
            const newUrls: string[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)
                const timestamp = Date.now()
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                formData.append('path', `work-orders/${timestamp}_${cleanName}`)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    if (data.url) {
                        newUrls.push(data.url)
                    } else if (data.path) {
                        newUrls.push(`/api/image?path=${encodeURIComponent(data.path)}`)
                    }
                } else {
                    console.error("Upload failed", await uploadRes.text())
                    toast({ title: "Error", description: "Could not upload file.", variant: "destructive" })
                }
            }

            const current = form.getValues(fieldName as any) || []
            form.setValue(fieldName as any, [...current, ...newUrls])
        } catch (error) {
            console.error("Upload failed", error)
            toast({ title: "Error", variant: "destructive" })
        } finally {
            setIsUploading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Transform date objects to strings if needed, though JSON.stringify does this automatically.
            // Include assignedProcedures (map of assetId -> procedureId) for multi-asset work orders
            const payload = {
                ...values,
                assignedProcedures
            }

            if (isEditing && workOrderId) {
                await axios.put('/api/work-orders', { id: workOrderId, ...payload })

                toast({
                    title: t('messages.updated') || "Work Order Updated",
                    description: "Successfully updated work order.",
                })
            } else {
                await axios.post('/api/work-orders', payload)

                toast({
                    title: t('messages.created') || "Work Order Created",
                    description: "Successfully created work order.",
                })
            }

            router.push("/work-orders")
        } catch (error) {
            console.error("Failed to create work order", error)
            toast({
                title: "Error",
                description: t('messages.error') || "Failed to create work order.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-24">
            <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? t('editTitle') : t('newTitle')}</h1>
                <p className="text-muted-foreground">{isEditing ? t('editDesc') : t('newDesc')}</p>
            </div>

            <Card className="border rounded-lg shadow-none w-full">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form id="work-order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* 1. Name */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.name')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('placeholders.name')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 2. Photos (Drag/Add) */}
                            <div className="space-y-2">
                                <FormLabel>{t('labels.pictures')}</FormLabel>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {form.watch("images")?.map((url, index) => (
                                        <div key={index} className="relative aspect-video rounded-lg border bg-muted overflow-hidden group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`Work Order ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = form.getValues("images") || []
                                                    form.setValue("images", current.filter((_, i) => i !== index))
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-lg border border-dashed text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer relative bg-muted/5">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'image')}
                                        disabled={isUploadingImage}
                                    />
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground px-8 py-10">
                                        {isUploadingImage ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <Upload className="h-8 w-8" />
                                        )}
                                        <span className="text-sm font-medium">{isUploadingImage ? t('buttons.uploading') : t('buttons.addPicture')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.description')}</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder={t('placeholders.description')} className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 4. Location */}
                            <FormField
                                control={form.control}
                                name="locationIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.location')}</FormLabel>
                                        <FormControl>
                                            <TreeSelect
                                                data={buildTree(locations, 'parentLocationId')}
                                                selectedIds={field.value || []}
                                                onSelect={(ids) => field.onChange(ids)}
                                                placeholder={t('placeholders.selectLocation')}
                                            />
                                        </FormControl>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((id) => {
                                                const loc = locations.find((l) => (l.id || l._id) === id)
                                                return loc ? (
                                                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                                        {loc.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((i) => i !== id))
                                                            }}
                                                        />
                                                    </Badge>
                                                ) : null
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 5. Asset */}
                            <FormField
                                control={form.control}
                                name="assetIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.asset')}</FormLabel>
                                        <FormControl>
                                            <AssetSelectionControl
                                                assets={assets}
                                                procedures={procedures}
                                                selectedAssetIds={field.value || []}
                                                onAssetsChange={field.onChange}
                                                assignedProcedures={assignedProcedures}
                                                onProceduresChange={setAssignedProcedures}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 6. Procedure (Only visible if 0 or 1 asset selected) */}
                            {showMainProcedure && (
                                <FormField
                                    control={form.control}
                                    name="procedure"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.procedure')}</FormLabel>
                                            <FormControl>
                                                <ProcedureSelector
                                                    procedures={procedures}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* 7. Assign To */}
                            <FormField
                                control={form.control}
                                name="assignedTo"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('labels.assignTo')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between bg-background",
                                                            !(field.value || []).length && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {(field.value || []).length > 0
                                                            ? t('messages.selected', { count: (field.value || []).length })
                                                            : t('placeholders.selectTeam')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder={t('placeholders.searchUser')} />
                                                    <CommandList>
                                                        <CommandEmpty>No results found.</CommandEmpty>
                                                        <CommandGroup heading="Teams">
                                                            {teams.map((team) => (
                                                                <CommandItem
                                                                    value={team.name}
                                                                    key={team.id}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        const updated = current.includes(team.id)
                                                                            ? current.filter((id: string) => id !== team.id)
                                                                            : [...current, team.id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                        (field.value || []).includes(team.id)
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "opacity-50 [&_svg]:invisible"
                                                                    )}>
                                                                        <Check className={cn("h-4 w-4")} />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">
                                                                            {team.name.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                        <span>{team.name}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                        <CommandGroup heading="Users">
                                                            {users.map((user) => (
                                                                <CommandItem
                                                                    value={user.name}
                                                                    key={user.id}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        const updated = current.includes(user.id)
                                                                            ? current.filter((id: string) => id !== user.id)
                                                                            : [...current, user.id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                        (field.value || []).includes(user.id)
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "opacity-50 [&_svg]:invisible"
                                                                    )}>
                                                                        <Check className={cn("h-4 w-4")} />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                            {user.name.charAt(0)}
                                                                        </div>
                                                                        {user.name}
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((id) => {
                                                const team = teams.find((t) => t.id === id)
                                                const user = users.find((u) => u.id === id)
                                                const item = team || user
                                                return item ? (
                                                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                                        {item.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((i) => i !== id))
                                                            }}
                                                        />
                                                    </Badge>
                                                ) : null
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 8. Estimated Hours */}
                            <FormItem>
                                <FormLabel>{t('labels.estimatedHours')}</FormLabel>
                                <div className="flex items-center gap-4">
                                    <FormField
                                        control={form.control}
                                        name="estimatedDuration.hours"
                                        render={({ field }) => (
                                            <div className="flex-1 flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground">Hours</span>
                                                <FormControl>
                                                    <Input type="number" min={0} {...field} />
                                                </FormControl>
                                            </div>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="estimatedDuration.minutes"
                                        render={({ field }) => (
                                            <div className="flex-1 flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground">Minutes</span>
                                                <FormControl>
                                                    <Input type="number" min={0} max={59} {...field} />
                                                </FormControl>
                                            </div>
                                        )}
                                    />
                                    <div className="pt-5 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                </div>
                            </FormItem>

                            {/* 9. Start & Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-background",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>{t('placeholders.pickDate')}</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('labels.dueDate')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-background",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>{t('placeholders.pickDate')}</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 10. Schedule */}
                            <FormField
                                control={form.control}
                                name="scheduleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.schedule')}</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg w-fit">
                                                {SCHEDULE_TYPES.map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => field.onChange(type)}
                                                        className={cn(
                                                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                                            field.value === type
                                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </FormControl>

                                        {/* Weekly or Daily with Day Select */}
                                        {(field.value === "Weekly" || field.value === "Daily") && (
                                            <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/5">
                                                <div className="flex items-center gap-2">
                                                    {field.value === "Weekly" && (
                                                        <>
                                                            <span className="text-sm">{t('labels.every')}</span>
                                                            <FormField
                                                                control={form.control}
                                                                name="scheduleInterval"
                                                                render={({ field: intervalField }) => (
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        className="w-16 h-8 bg-background"
                                                                        {...intervalField}
                                                                    />
                                                                )}
                                                            />
                                                            <span className="text-sm">{t('labels.weekOn')}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {(field.value === "Weekly" || field.value === "Daily") && (
                                                    <FormField
                                                        control={form.control}
                                                        name="scheduleDays"
                                                        render={({ field: daysField }) => (
                                                            <div className="flex flex-wrap gap-2">
                                                                {DAYS_OF_WEEK.map((day) => {
                                                                    const isSelected = (daysField.value || []).includes(day)
                                                                    return (
                                                                        <button
                                                                            key={day}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const current = daysField.value || []
                                                                                const updated = isSelected
                                                                                    ? current.filter((d) => d !== day)
                                                                                    : [...current, day]
                                                                                daysField.onChange(updated)
                                                                            }}
                                                                            className={cn(
                                                                                "h-9 w-9 rounded-full text-xs font-medium border transition-all",
                                                                                isSelected
                                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                                    : "bg-background text-muted-foreground hover:border-primary/50"
                                                                            )}
                                                                        >
                                                                            {day}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    />
                                                )}
                                                {field.value === "Daily" && (
                                                    <p className="text-sm text-foreground">
                                                        Repeats every day after completion of this Work Order.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {/* Monthly */}
                                        {field.value === "Monthly" && (
                                            <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm">Every</span>
                                                    <FormField
                                                        control={form.control}
                                                        name="scheduleInterval"
                                                        render={({ field: intervalField }) => (
                                                            <Input type="number" min={1} className="w-16 h-8 bg-background" {...intervalField} />
                                                        )}
                                                    />
                                                    <span className="text-sm">month on the</span>
                                                    <FormField
                                                        control={form.control}
                                                        name="scheduleMonthDay"
                                                        render={({ field: monthDayField }) => (
                                                            <Select onValueChange={monthDayField.onChange} defaultValue={monthDayField.value}>
                                                                <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Day" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="last">Last Day</SelectItem>
                                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                                        <SelectItem key={d} value={d.toString()}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Repeats every {form.watch("scheduleInterval")} month(s) on the {form.watch("scheduleMonthDay") === 'last' ? 'last day' : form.watch("scheduleMonthDay") + (['1', '21', '31'].includes(form.watch("scheduleMonthDay") || '') ? 'st' : ['2', '22'].includes(form.watch("scheduleMonthDay") || '') ? 'nd' : ['3', '23'].includes(form.watch("scheduleMonthDay") || '') ? 'rd' : 'th')} of the month after completion of this Work Order.
                                                </p>
                                            </div>
                                        )}
                                        {/* Yearly */}
                                        {field.value === "Yearly" && (
                                            <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">Every</span>
                                                    <FormField
                                                        control={form.control}
                                                        name="scheduleInterval"
                                                        render={({ field: intervalField }) => (
                                                            <Input type="number" min={1} className="w-16 h-8 bg-background" {...intervalField} />
                                                        )}
                                                    />
                                                    <span className="text-sm">year</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Repeats every {form.watch("scheduleInterval")} year(s) on 01/01 after completion of this Work Order.
                                                </p>
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 11. Priority */}
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.priority')}</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg w-fit">
                                                {["None", "Low", "Medium", "High"].map((priority) => (
                                                    <button
                                                        key={priority}
                                                        type="button"
                                                        onClick={() => field.onChange(priority)}
                                                        className={cn(
                                                            "px-6 py-1.5 text-sm font-medium rounded-md transition-all",
                                                            field.value === priority
                                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        {priority}
                                                    </button>
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 12. Files */}
                            <div className="space-y-2">
                                <FormLabel>{t('labels.files')}</FormLabel>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(form.watch("files") || []).map((fileUrl, index) => {
                                        let fileName = fileUrl.split('/').pop() || "file"
                                        if (fileUrl.includes('?path=')) {
                                            try {
                                                const params = new URLSearchParams(fileUrl.split('?')[1])
                                                const path = params.get('path')
                                                if (path) {
                                                    const parts = path.split('/')
                                                    fileName = parts[parts.length - 1]
                                                    // Attempt to remove timestamp prefix (e.g. 1234567890_)
                                                    fileName = fileName.replace(/^\d+_/, '')
                                                }
                                            } catch (e) {
                                                // Fallback to simple split
                                            }
                                        }

                                        return (
                                            <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 h-auto text-sm font-normal flex items-center gap-1">
                                                <Paperclip className="h-3 w-3 text-muted-foreground mr-1" />
                                                <span className="truncate max-w-[200px]">{fileName}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4 ml-1 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => {
                                                        const current = form.getValues("files") || []
                                                        form.setValue("files", current.filter((_, i) => i !== index))
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleFileUpload(e, 'file')}
                                        disabled={isUploadingFile}
                                    />
                                    <Button type="button" variant="outline" className="w-full" disabled={isUploadingFile}>
                                        {isUploadingFile ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t('buttons.uploading')}
                                            </>
                                        ) : (
                                            <>
                                                <Paperclip className="mr-2 h-4 w-4" />
                                                {t('buttons.attachFiles')}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* 13. Parts (Only visible if 0 or 1 asset selected) */}
                            {showMainProcedure && (
                                <FormField
                                    control={form.control}
                                    name="parts"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('labels.parts')}</FormLabel>
                                            <Dialog open={isPartsDialogOpen} onOpenChange={setIsPartsDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-center border-dashed border-2 py-8 bg-muted/5 hover:bg-orange-50 hover:border-orange-200 transaction-colors",
                                                                !(field.value || []).length && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {(field.value || []).length > 0
                                                                ? t('messages.selected', { count: (field.value || []).length })
                                                                : (
                                                                    <div className="flex flex-col items-center gap-2 text-orange-600">
                                                                        <Plus className="h-6 w-6" />
                                                                        <span className="font-semibold text-lg">{t('buttons.addParts')}</span>
                                                                    </div>
                                                                )}
                                                        </Button>
                                                    </FormControl>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                                                    <DialogHeader>
                                                        <DialogTitle>Select Parts</DialogTitle>
                                                    </DialogHeader>
                                                    <Command className="flex-1">
                                                        <CommandInput placeholder="Search parts..." />
                                                        <CommandList className="flex-1 max-h-full">
                                                            <CommandEmpty>No parts found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {parts.map((part) => (
                                                                    <CommandItem
                                                                        value={part.name}
                                                                        key={part.id || part._id}
                                                                        onSelect={() => {
                                                                            const id = part.id || part._id
                                                                            const current = field.value || []
                                                                            const updated = current.includes(id)
                                                                                ? current.filter((i: string) => i !== id)
                                                                                : [...current, id]
                                                                            field.onChange(updated)
                                                                        }}
                                                                        className="flex items-center gap-4 py-3"
                                                                    >
                                                                        <div className={cn(
                                                                            "flex h-5 w-5 items-center justify-center rounded-sm border border-primary shrink-0",
                                                                            (field.value || []).includes(part.id || part._id)
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
                                                                                <span>${part.price || 0}</span>
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
                                            {/* Selected Parts List */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {(field.value || []).map((id) => {
                                                    const part = parts.find((p) => (p.id || p._id) === id)
                                                    return part ? (
                                                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                                            <Package className="h-3 w-3 mr-1 opacity-70" />
                                                            {part.name}
                                                            <X
                                                                className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                                                                onClick={() => {
                                                                    field.onChange((field.value || []).filter((i) => i !== id))
                                                                }}
                                                            />
                                                        </Badge>
                                                    ) : null
                                                })}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* 14. Categories */}
                            <FormField
                                control={form.control}
                                name="categories"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('labels.categories')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between bg-background",
                                                            !(field.value || []).length && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {(field.value || []).length > 0
                                                            ? t('messages.selected', { count: (field.value || []).length })
                                                            : t('placeholders.categories')}
                                                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search categories..." />
                                                    <CommandList>
                                                        <CommandEmpty>No category found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {CATEGORIES_MOCK.map((category) => (
                                                                <CommandItem
                                                                    value={category.label}
                                                                    key={category.id}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        const updated = current.includes(category.id)
                                                                            ? current.filter((id) => id !== category.id)
                                                                            : [...current, category.id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                        (field.value || []).includes(category.id)
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "opacity-50 [&_svg]:invisible"
                                                                    )}>
                                                                        <Check className={cn("h-4 w-4")} />
                                                                    </div>
                                                                    <category.icon className={cn("mr-2 h-4 w-4", category.color.split(" ")[0])} />
                                                                    <span>{category.label}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((id) => {
                                                const category = CATEGORIES_MOCK.find((c) => c.id === id)
                                                return category ? (
                                                    <Badge
                                                        key={id}
                                                        variant="outline"
                                                        className={cn("gap-1 pl-2 pr-1 py-1 border-0", category.color.split(" ")[1])}
                                                    >
                                                        <category.icon className={cn("h-3 w-3 mr-1", category.color.split(" ")[0])} />
                                                        <span className={category.color.split(" ")[0]}>{category.label}</span>
                                                        <X
                                                            className={cn("h-3 w-3 cursor-pointer hover:opacity-70", category.color.split(" ")[0])}
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((i) => i !== id))
                                                            }}
                                                        />
                                                    </Badge>
                                                ) : null
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 15. Vendors */}
                            <FormField
                                control={form.control}
                                name="vendors"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('labels.vendors')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between bg-background",
                                                            !(field.value || []).length && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {(field.value || []).length > 0
                                                            ? t('messages.selected', { count: (field.value || []).length })
                                                            : t('placeholders.vendors')}
                                                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search vendors..." />
                                                    <CommandList>
                                                        <CommandEmpty>No vendors found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {vendors.map((vendor) => (
                                                                <CommandItem
                                                                    value={vendor.name}
                                                                    key={vendor.id || vendor._id}
                                                                    onSelect={() => {
                                                                        const id = vendor.id || vendor._id
                                                                        const current = field.value || []
                                                                        const updated = current.includes(id)
                                                                            ? current.filter((i: string) => i !== id)
                                                                            : [...current, id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                        (field.value || []).includes(vendor.id || vendor._id)
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "opacity-50 [&_svg]:invisible"
                                                                    )}>
                                                                        <Check className={cn("h-4 w-4")} />
                                                                    </div>
                                                                    <span>{vendor.name}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((id) => {
                                                const vendor = vendors.find((v) => (v.id || v._id) === id)
                                                return vendor ? (
                                                    <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                                        {vendor.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((i) => i !== id))
                                                            }}
                                                        />
                                                    </Badge>
                                                ) : null
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button variant="ghost" type="button" onClick={() => router.back()}>
                                    {t('buttons.cancel')}
                                </Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditing ? t('buttons.save') : t('buttons.create')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

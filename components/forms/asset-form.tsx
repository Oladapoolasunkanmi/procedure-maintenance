"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, Upload, X, QrCode, FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

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

import {
    Card,
    CardContent,
} from "@/components/ui/card"

import { users, locations, assets } from "@/lib/data"
import { useRouter, useSearchParams } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    locationId: z.string().min(1, { message: "Please select a location." }),
    criticality: z.enum(["Low", "Medium", "High", "Critical"]),
    description: z.string().optional(),
    year: z.coerce.number().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    teamsInCharge: z.array(z.string()).default([]),
    barcode: z.string().optional(),
    assetType: z.string().optional(),
    vendors: z.string().optional(),
    parts: z.string().optional(),
    parentAssetId: z.string().optional(),
    notes: z.string().optional(),
    images: z.array(z.string()).optional(),
    files: z.array(z.string()).optional(),
})

interface AssetFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
    assetId?: string
}

// Reusing generic structure for both Asset and Location trees
interface TreeNode {
    id: string;
    name: string;
    children?: TreeNode[];
}

export function AssetForm({ initialData, isEditing = false, assetId }: AssetFormProps) {
    const t = useTranslations('AssetForm')
    const router = useRouter()
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const [barcodeMode, setBarcodeMode] = useState<"auto" | "manual">("auto")
    const [assetTree, setAssetTree] = useState<TreeNode[]>([])
    const [locationTree, setLocationTree] = useState<TreeNode[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [realLocations, setRealLocations] = useState<any[]>([])
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isUploadingFile, setIsUploadingFile] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            name: searchParams.get("name") || "",
            criticality: "Medium",
            // If teamId is present in URL, pre-select it
            teamsInCharge: searchParams.get("teamId") ? [searchParams.get("teamId")!] : [],
            parentAssetId: searchParams.get("parentId") || undefined,
            locationId: searchParams.get("locationId") || "",
            images: [],
            files: [],
        },
    })

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
                // Generate a unique path for the file. 
                // Using a simpler path structure that keeps the original extension.
                const timestamp = Date.now()
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                formData.append('path', `assets/${timestamp}_${cleanName}`)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    // Assuming the API returns the URL in a property like 'url' or 'path'
                    // If it returns the full object (blob info), adjust accordingly.
                    // Usually it returns { url: "..." } or similar.
                    if (data.url) {
                        newUrls.push(data.url)
                    } else if (data.path) {
                        // If it returns a path, maybe we need to construct a URL or use /api/image?path=...
                        // Let's assume for now we use the path via /api/image proxy
                        newUrls.push(`/api/image?path=${encodeURIComponent(data.path)}`)
                    }
                } else {
                    console.error("Upload failed", await uploadRes.text())
                    toast({ title: t('messages.errorTitle'), description: "Could not upload file.", variant: "destructive" })
                }
            }

            const current = form.getValues(fieldName as any) || []
            form.setValue(fieldName as any, [...current, ...newUrls])
        } catch (error) {
            console.error("Upload failed", error)
            toast({ title: t('messages.errorTitle'), variant: "destructive" })
        } finally {
            setIsUploading(false)
        }
    }

    useEffect(() => {
        const focusParam = searchParams.get("focus")
        if (focusParam === "manufacturer") {
            const manufacturerInput = document.querySelector('input[name="manufacturer"]') as HTMLInputElement
            if (manufacturerInput) {
                manufacturerInput.focus()
                manufacturerInput.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }
    }, [searchParams])

    // Fetch assets and build tree
    useEffect(() => {
        const fetchAssets = async () => {
            try {
                // Fetch a large number of assets to build the tree
                // In a real app, you might want a specific endpoint for the tree or lazy loading
                const res = await fetch('/api/assets?limit=1000')
                const data = await res.json()

                if (data.items) {
                    const nodes: Record<string, TreeNode> = {}
                    const roots: TreeNode[] = []

                    // First pass: create nodes
                    data.items.forEach((item: any) => {
                        const id = item.id || item._id
                        nodes[id] = {
                            id,
                            name: item.name,
                            children: []
                        }
                    })

                    // Second pass: link children to parents
                    data.items.forEach((item: any) => {
                        const id = item.id || item._id
                        const parentId = item.parentAssetId

                        if (parentId && nodes[parentId]) {
                            nodes[parentId].children?.push(nodes[id])
                        } else {
                            roots.push(nodes[id])
                        }
                    })

                    setAssetTree(roots)
                }
            } catch (error) {
                console.error("Failed to load asset tree:", error)
            }
        }

        const fetchTeams = async () => {
            try {
                const res = await fetch('/api/teams')
                const data = await res.json()
                if (data.items) {
                    setTeams(data.items.map((t: any) => ({ ...t, id: t._id || t.id })))
                }
            } catch (error) {
                console.error("Failed to fetch teams:", error)
            }
        }

        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations?limit=1000')
                const data = await res.json()
                if (data.items) {
                    setRealLocations(data.items.map((l: any) => ({ ...l, id: l._id || l.id })))

                    // Build Location Tree
                    const nodes: Record<string, TreeNode> = {}
                    const roots: TreeNode[] = []

                    // First pass
                    data.items.forEach((item: any) => {
                        const id = item.id || item._id
                        nodes[id] = { id, name: item.name, children: [] }
                    })

                    // Second pass
                    data.items.forEach((item: any) => {
                        const id = item.id || item._id
                        const parentId = item.parentLocationId
                        if (parentId && nodes[parentId]) {
                            nodes[parentId].children?.push(nodes[id])
                        } else {
                            roots.push(nodes[id])
                        }
                    })
                    setLocationTree(roots)
                }
            } catch (error) {
                console.error("Failed to fetch locations:", error)
            }
        }

        fetchAssets()
        fetchTeams()
        fetchLocations()
    }, [])



    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            console.log("Submitting asset:", values)

            const payload = {
                ...values,
                status: "Online"
            }

            let response;
            if (isEditing && assetId) {
                response = await fetch('/api/assets', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...payload, id: assetId }),
                })
            } else {
                response = await fetch('/api/assets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                })
            }

            if (response && !response.ok) {
                throw new Error('Failed to save asset')
            }

            const data = await response.json()

            toast({
                title: isEditing ? t('messages.updated') : t('messages.created'),
                description: isEditing ? t('messages.successUpdate', { name: values.name }) : t('messages.successCreate', { name: values.name }),
            })

            if (isEditing && assetId) {
                router.push(`/assets?id=${assetId}`)
            } else {
                const newId = data.item_id
                router.push(`/assets?id=${newId}`)
            }
            router.refresh()
        } catch (error) {
            console.error("Failed to save asset:", error)
            toast({
                title: t('messages.errorTitle'),
                description: t('messages.errorDesc'),
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-24">
            <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? t('editTitle') : t('newTitle')}</h1>
                <p className="text-muted-foreground">{isEditing ? t('editDesc') : t('newDesc')}</p>
            </div>

            <Card className="bg-card border rounded-lg shadow-none w-full">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form id="asset-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* 1. Name */}
                            <FormField
                                control={form.control}
                                name="name"
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

                            {/* 2. Pictures */}
                            <div className="space-y-2">
                                <FormLabel>{t('labels.pictures')}</FormLabel>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {form.watch("images")?.map((url, index) => (
                                        <div key={index} className="relative aspect-video rounded-lg border bg-muted overflow-hidden group">
                                            <img src={url} alt={`Asset ${index + 1}`} className="w-full h-full object-cover" />
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
                                <div className="rounded-lg border border-dashed text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer relative">
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

                            {/* 3. Files */}
                            <div className="space-y-2">
                                <FormLabel>{t('labels.files')}</FormLabel>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {form.watch("files")?.map((file, index) => (
                                        <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                            <span className="max-w-[150px] truncate">{file.split('/').pop()}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = form.getValues("files") || []
                                                    form.setValue("files", current.filter((_, i) => i !== index))
                                                }}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="rounded-lg border border-dashed text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'file')}
                                        disabled={isUploadingFile}
                                    />
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground px-8 py-6">
                                        {isUploadingFile ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <FileText className="h-8 w-8" />
                                        )}
                                        <span className="text-sm font-medium">{isUploadingFile ? t('buttons.uploading') : t('buttons.addFile')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Location & 5. Criticality */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="locationId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('labels.location')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between bg-background",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? findNodeName(locationTree, field.value) || field.value
                                                                : t('placeholders.selectLocation')}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder={t('placeholders.searchLocation')} />
                                                        <CommandList>
                                                            <CommandEmpty>No location found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {locationTree.map((node) => (
                                                                    <TreeItem
                                                                        key={node.id}
                                                                        node={node}
                                                                        selectedValue={field.value}
                                                                        onSelect={(id) => field.onChange(id)}
                                                                    />
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="criticality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.criticality')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t('placeholders.selectCriticality')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 6. Description */}
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

                            {/* 7. Year */}
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.year')}</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder={t('placeholders.year')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 8. Manufacturer, 9. Model, 10. Serial Number */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="manufacturer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.manufacturer')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('placeholders.manufacturer')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.model')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('placeholders.model')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serialNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.serialNumber')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('placeholders.serialNumber')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 11. Teams in Charge */}
                            <FormField
                                control={form.control}
                                name="teamsInCharge"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('labels.teamsInCharge')}</FormLabel>
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
                                                            ? `${(field.value || []).length} selected`
                                                            : t('buttons.selectTeams')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('placeholders.searchTeam')} />
                                                    <CommandList>
                                                        <CommandEmpty>No team found.</CommandEmpty>
                                                        <CommandGroup>
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
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            (field.value || []).includes(team.id)
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {team.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((teamId: string) => {
                                                const team = teams.find((t) => t.id === teamId)
                                                return team ? (
                                                    <Badge key={teamId} variant="secondary" className="flex items-center gap-1">
                                                        {team.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((id: string) => id !== teamId))
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

                            {/* 12. QR Code */}
                            <div className="space-y-4">
                                <FormLabel>{t('labels.qrCode')}</FormLabel>
                                {barcodeMode === "auto" ? (
                                    <div className="space-y-4">
                                        <Input disabled value={t('messages.barcodeGenerated')} className="bg-muted/50 text-muted-foreground" />
                                        <div className="space-y-4">
                                            <button
                                                type="button"
                                                onClick={() => setBarcodeMode("manual")}
                                                className="text-sm text-primary hover:underline font-medium"
                                            >
                                                {t('buttons.manualInput')}
                                            </button>
                                            <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-muted/10">
                                                <QrCode className="w-20 h-20 text-muted-foreground/20" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <FormField
                                            control={form.control}
                                            name="barcode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder={t('placeholders.barcode')} {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setBarcodeMode("auto")}
                                            className="text-sm text-primary hover:underline font-medium"
                                        >
                                            {t('buttons.autoGenerate')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 13. Asset Type & 14. Vendor */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="assetType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.assetType')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('placeholders.assetType')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vendors"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('labels.vendor')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('placeholders.vendor')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* 15. Parts */}
                            <FormField
                                control={form.control}
                                name="parts"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.parts')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('placeholders.parts')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 16. Parent Asset (Tree Dropdown) */}
                            <FormField
                                control={form.control}
                                name="parentAssetId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('labels.parentAsset')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between bg-background",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? findNodeName(assetTree, field.value) || field.value
                                                            : t('placeholders.selectParent')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder={t('placeholders.searchAssets')} />
                                                    <CommandList>
                                                        <CommandEmpty>No asset found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {assetTree.map((node) => (
                                                                <TreeItem
                                                                    key={node.id}
                                                                    node={node}
                                                                    selectedValue={field.value}
                                                                    onSelect={(id) => field.onChange(id)}
                                                                />
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 17. Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional notes..." className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-end gap-4 border-t bg-card p-4 shadow-md sm:px-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" form="asset-form" disabled={form.formState.isSubmitting} className="cursor-pointer">
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Save Changes" : "Create Asset"}
                </Button>
            </div>
        </div>
    )
}

function findNodeName(nodes: TreeNode[], id: string): string | undefined {
    for (const node of nodes) {
        if (node.id === id) return node.name
        if (node.children) {
            const found = findNodeName(node.children, id)
            if (found) return found
        }
    }
    return undefined
}

function TreeItem({
    node,
    selectedValue,
    onSelect,
    level = 0
}: {
    node: TreeNode
    selectedValue?: string
    onSelect: (id: string) => void
    level?: number
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const hasChildren = node.children && node.children.length > 0

    return (
        <>
            <CommandItem
                value={node.name}
                onSelect={() => onSelect(node.id)}
                className="flex items-center gap-2 cursor-pointer"
                style={{ paddingLeft: `${(level * 16) + 8}px` }}
            >
                {hasChildren ? (
                    <div
                        className="p-0.5 hover:bg-muted rounded-sm cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsExpanded(!isExpanded)
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                ) : (
                    <span className="w-5" /> // Spacer for alignment
                )}

                <span className="flex-1 truncate">{node.name}</span>
                {selectedValue === node.id && <Check className="ml-auto h-4 w-4" />}
            </CommandItem>
            {hasChildren && isExpanded && (
                <>
                    {node.children!.map((child) => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            selectedValue={selectedValue}
                            onSelect={onSelect}
                            level={level + 1}
                        />
                    ))}
                </>
            )}
        </>
    )
}

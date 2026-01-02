"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2, Upload, X, FileText, ChevronRight, ChevronDown, RefreshCw, Box, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
// import { useTranslations } from "next-intl" // Ensure it's imported in the component file, or use hook if it's a client component
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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
import { useRouter } from "next/navigation"
import { TreeSelect, buildTree, TreeNode } from "@/components/ui/tree-select"

// Schema
const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    unitCost: z.coerce.number().min(0).default(0),
    description: z.string().optional(),
    barcode: z.string().optional(),
    partType: z.string().optional(),
    locationConfig: z.array(z.object({
        locationId: z.string().min(1, "Location is required"),
        area: z.string().optional(),
        quantity: z.coerce.number().min(0).default(0),
        minStock: z.coerce.number().min(0).default(0),
    })).default([]),
    assetIds: z.array(z.string()).default([]),
    assignedTeamIds: z.array(z.string()).default([]), // Teams In Charge
    vendorIds: z.array(z.string()).default([]), // Vendors
    files: z.array(z.string()).default([]), // Files
})

interface PartFormProps {
    initialData?: any
    isEditing?: boolean
    partId?: string
}

export function PartForm({ initialData, isEditing = false, partId }: PartFormProps) {
    const router = useRouter()
    const t = useTranslations('Parts')
    const { toast } = useToast()

    // Data States
    const [locations, setLocations] = useState<any[]>([])
    const [assets, setAssets] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [partTypesOptions, setPartTypesOptions] = useState<string[]>([])

    // Loaders
    const [isCreatingType, setIsCreatingType] = useState(false)
    const [isUploadingFile, setIsUploadingFile] = useState(false)

    // UI States
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [typeSearch, setTypeSearch] = useState("")

    // Trees
    const [locationTree, setLocationTree] = useState<TreeNode[]>([])
    const [assetTree, setAssetTree] = useState<TreeNode[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            unitCost: 0,
            description: "",
            barcode: "",
            partType: "",
            locationConfig: [],
            assetIds: [],
            assignedTeamIds: [],
            vendorIds: [],
            files: [],
        },
    })

    // Reset form on initialData change
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || "",
                unitCost: initialData.unitCost || 0,
                description: initialData.description || "",
                barcode: initialData.barcode || "",
                partType: initialData.partType || "",
                locationConfig: initialData.locationConfig || [],
                assetIds: initialData.assetIds || [],
                assignedTeamIds: initialData.assignedTeamIds || [],
                vendorIds: initialData.vendorIds || [],
                files: initialData.files || [],
            })
        }
    }, [initialData, form])

    const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
        control: form.control,
        name: "locationConfig",
    })

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Locations
                const lRes = await fetch('/api/locations?limit=1000')
                const lData = await lRes.json()
                if (lData.items) {
                    const locs = lData.items.map((l: any) => ({ ...l, id: l._id || l.id }))
                    setLocations(locs)
                    setLocationTree(buildTree(locs, 'parentLocationId'))
                }

                // Assets
                const aRes = await fetch('/api/assets?limit=1000')
                const aData = await aRes.json()
                if (aData.items) {
                    const asts = aData.items.map((a: any) => ({ ...a, id: a._id || a.id }))
                    setAssets(asts)
                    setAssetTree(buildTree(asts, 'parentAssetId'))
                }

                // Teams
                const tmRes = await fetch('/api/teams?limit=1000')
                const tmData = await tmRes.json()
                if (tmData.items) setTeams(tmData.items.map((t: any) => ({ ...t, id: t._id || t.id })))

                // Vendors
                const vRes = await fetch('/api/vendors?limit=1000')
                const vData = await vRes.json()
                if (vData.items) setVendors(vData.items.map((v: any) => ({ ...v, id: v._id || v.id })))

                // Part Types
                const tRes = await fetch('/api/part-types?limit=1000')
                const tData = await tRes.json()
                if (tData.items) {
                    setPartTypesOptions(tData.items.map((t: any) => t.name))
                }

            } catch (error) {
                console.error("Failed to load data", error)
            }
        }
        fetchData()
    }, [])

    const handleCreateType = async (newType: string, fieldChange: (val: string) => void) => {
        setIsCreatingType(true)
        try {
            const res = await fetch('/api/part-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newType })
            })

            if (!res.ok) throw new Error("Failed to create type")

            if (!partTypesOptions.includes(newType)) {
                setPartTypesOptions(prev => [...prev, newType])
            }
            fieldChange(newType)
            setTypeSearch("")
            setPopoverOpen(false)
            toast({ title: t('form.messages.typeCreated', { type: newType }) })
        } catch (e) {
            console.error(e)
            toast({ title: "Failed to create type", variant: "destructive" })
        } finally {
            setIsCreatingType(false)
        }
    }

    const generateBarcode = () => {
        const randomString = Math.random().toString(36).substring(2, 12).toUpperCase()
        form.setValue("barcode", randomString)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploadingFile(true)
        try {
            const newUrls: string[] = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)
                const timestamp = Date.now()
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                formData.append('path', `parts/${timestamp}_${cleanName}`)

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    if (data.url) newUrls.push(data.url)
                    else if (data.path) newUrls.push(`/api/image?path=${encodeURIComponent(data.path)}`)
                }
            }
            const current = form.getValues("files") || []
            form.setValue("files", [...current, ...newUrls])
        } catch (error) {
            console.error("Upload failed", error)
            toast({ title: "Upload failed", variant: "destructive" })
        } finally {
            setIsUploadingFile(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // If barcode is empty, generate one (backend could do this, but nice to be explicit)
            if (!values.barcode) values.barcode = Math.random().toString(36).substring(2, 12).toUpperCase();

            const method = isEditing ? 'PUT' : 'POST'
            // Ensure we don't send system fields or create duplicates if editing.
            // For editing, we MUST include the 'id' field as the primary key.
            const body = isEditing
                ? { ...values, id: partId }
                : { ...values }

            const res = await fetch('/api/parts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Failed to save")

            toast({ title: isEditing ? t('form.messages.updated') : t('form.messages.created') })
            router.push('/parts')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: t('form.messages.error'), variant: "destructive" })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24 p-6 max-w-7xl mx-auto w-full">
                <Card className="bg-card border rounded-lg shadow-none w-full">
                    <CardContent className="p-8 space-y-8">

                        {/* Name & Unit Cost */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.labels.name')} <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('form.placeholders.name')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unitCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.labels.unitCost')}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="0" placeholder={t('form.placeholders.cost')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.labels.description')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('form.placeholders.description')} className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Barcode & Part Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="barcode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.labels.barcode')}</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder={t('form.placeholders.barcode')} {...field} disabled={field.value !== "" && field.value !== undefined && initialData && field.value === initialData.barcode} />
                                            </FormControl>
                                            <Button type="button" variant="outline" size="icon" onClick={generateBarcode} title={t('form.buttons.generate')}>
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormDescription>Leave empty to auto-generate on save.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Part Type (Creatable) */}
                            <FormField
                                control={form.control}
                                name="partType"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="flex items-center gap-2">
                                            {t('form.labels.partType')}
                                            {isCreatingType && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                        </FormLabel>
                                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                        {field.value || t('form.placeholders.partType')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder={t('form.placeholders.searchType')} value={typeSearch} onValueChange={setTypeSearch} />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            {typeSearch && !isCreatingType && (
                                                                <div className="p-2">
                                                                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleCreateType(typeSearch, field.onChange)}>
                                                                        <Plus className="mr-2 h-4 w-4" /> Create "{typeSearch}"
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {partTypesOptions.map((type) => (
                                                                <CommandItem key={type} value={type} onSelect={() => { field.onChange(type); setPopoverOpen(false); }}>
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === type ? "opacity-100" : "opacity-0")} />
                                                                    {type}
                                                                </CommandItem>
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
                        </div>

                        {/* Locations Configuration */}
                        <div className="space-y-4">
                            <div className="flex flex-row items-center justify-between">
                                <FormLabel className="text-base">{t('form.labels.stockLocations')}</FormLabel>
                                <Button type="button" size="sm" variant="outline" onClick={() => appendLocation({ locationId: "", area: "", quantity: 0, minStock: 0 })}>
                                    <Plus className="mr-2 h-4 w-4" /> {t('form.buttons.addLocation')}
                                </Button>
                            </div>
                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                {locationFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                                        {/* Location Tree Select */}
                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name={`locationConfig.${index}.locationId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs text-muted-foreground">{t('form.labels.location')}</FormLabel>
                                                        <TreeSelect
                                                            data={locationTree}
                                                            selectedIds={field.value ? [field.value] : []}
                                                            onSelect={(ids) => field.onChange(ids[0])}
                                                            placeholder={t('form.placeholders.location')}
                                                            singleSelect
                                                        />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`locationConfig.${index}.area`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs text-muted-foreground">{t('form.labels.area')}</FormLabel>
                                                        <FormControl><Input placeholder={t('form.placeholders.area')} {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`locationConfig.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs text-muted-foreground">{t('form.labels.inStock')}</FormLabel>
                                                        <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`locationConfig.${index}.minStock`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs text-muted-foreground">{t('form.labels.minStock')}</FormLabel>
                                                        <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-1 flex justify-end">
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeLocation(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {locationFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No locations added.</p>}
                            </div>
                        </div>

                        {/* Assets (Multi-Tree Select) */}
                        <FormField
                            control={form.control}
                            name="assetIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.labels.assets')}</FormLabel>
                                    <TreeSelect
                                        data={assetTree}
                                        selectedIds={field.value || []}
                                        onSelect={field.onChange}
                                        placeholder={t('form.placeholders.assets')}
                                    />
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {field.value?.map(assetId => {
                                            const asset = assets.find(a => a.id === assetId)
                                            return asset ? (
                                                <Badge key={assetId} variant="outline">
                                                    {asset.name} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => field.onChange(field.value?.filter(id => id !== assetId))} />
                                                </Badge>
                                            ) : null
                                        })}
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Teams & Vendors (Multi-Select) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Teams In Charge */}
                            <FormField
                                control={form.control}
                                name="assignedTeamIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.labels.teams')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    {field.value?.length > 0 ? `${field.value.length} selected` : t('form.placeholders.teams')}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('form.placeholders.searchTeams')} />
                                                    <CommandList>
                                                        <CommandEmpty>No teams found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {teams.map(team => (
                                                                <CommandItem
                                                                    key={team.id}
                                                                    value={team.name}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        if (current.includes(team.id)) field.onChange(current.filter(id => id !== team.id))
                                                                        else field.onChange([...current, team.id])
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value?.includes(team.id) ? "opacity-100" : "opacity-0")} />
                                                                    {team.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {field.value?.map(tId => {
                                                const t = teams.find(team => team.id === tId)
                                                return t ? <Badge key={tId} variant="secondary">{t.name}</Badge> : null
                                            })}
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {/* Vendors */}
                            <FormField
                                control={form.control}
                                name="vendorIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.labels.vendors')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    {field.value?.length > 0 ? `${field.value.length} selected` : t('form.placeholders.vendors')}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('form.placeholders.searchVendors')} />
                                                    <CommandList>
                                                        <CommandEmpty>No vendors found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {vendors.map(v => (
                                                                <CommandItem
                                                                    key={v.id}
                                                                    value={v.name}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        if (current.includes(v.id)) field.onChange(current.filter(id => id !== v.id))
                                                                        else field.onChange([...current, v.id])
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value?.includes(v.id) ? "opacity-100" : "opacity-0")} />
                                                                    {v.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {field.value?.map(vId => {
                                                const v = vendors.find(vendor => vendor.id === vId)
                                                return v ? <Badge key={vId} variant="outline" className="border-dashed">{v.name}</Badge> : null
                                            })}
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Files */}
                        <div className="space-y-2">
                            <FormLabel>{t('form.labels.files')}</FormLabel>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {form.watch("files")?.map((url, index) => (
                                    <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                        <span className="max-w-[150px] truncate">{url.split('/').pop()}</span>
                                        <button type="button" onClick={() => form.setValue("files", form.getValues("files").filter((_, i) => i !== index))} className="ml-1 hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="rounded-lg border border-dashed text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer relative">
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isUploadingFile} />
                                <div className="flex flex-col items-center gap-2 text-muted-foreground px-8 py-6">
                                    {isUploadingFile ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileText className="h-8 w-8" />}
                                    <span className="text-sm font-medium">{isUploadingFile ? t('form.buttons.uploading') : t('form.buttons.addFile')}</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background flex justify-end gap-4 z-50 md:pl-64">
                    <Button type="button" variant="outline" onClick={() => router.back()}>{t('actions.cancel')}</Button>
                    <Button type="submit" disabled={isUploadingFile || form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? t('form.title.edit') : t('form.title.create')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

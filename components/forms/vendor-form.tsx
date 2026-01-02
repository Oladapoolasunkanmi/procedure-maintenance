"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2, Upload, X, FileText, ChevronRight, ChevronDown } from "lucide-react"
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

// Helpers for Tree View
type TreeNode = {
    id: string
    label: string
    children?: TreeNode[]
}

const buildTree = (items: any[], parentIdKey: string = 'parentLocationId') => {
    const map = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    // Initialize nodes
    items.forEach(item => {
        map.set(item.id, { id: item.id, label: item.name, children: [] })
    })

    // Build hierarchy
    items.forEach(item => {
        const node = map.get(item.id)
        if (item[parentIdKey] && map.has(item[parentIdKey])) {
            map.get(item[parentIdKey])!.children!.push(node!)
        } else {
            roots.push(node!)
        }
    })

    return roots
}

const TreeSelect = ({
    data,
    selectedIds,
    onSelect,
    placeholder = "Select items..."
}: {
    data: TreeNode[],
    selectedIds: string[],
    onSelect: (ids: string[]) => void,
    placeholder?: string
}) => {
    const [open, setOpen] = useState(false)
    const [expanded, setExpanded] = useState<string[]>([])

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const handleSelect = (id: string) => {
        onSelect(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])
    }

    const renderTree = (nodes: TreeNode[], level = 0) => {
        return nodes.map(node => (
            <div key={node.id}>
                <CommandItem
                    value={node.label + node.id} // unique value for search
                    onSelect={() => handleSelect(node.id)}
                    className="flex justify-between"
                    style={{ paddingLeft: `${(level + 1) * 12}px` }}
                >
                    <div className="flex items-center gap-2">
                        {node.children && node.children.length > 0 ? (
                            <div onClick={(e) => toggleExpand(node.id, e)} className="cursor-pointer p-0.5 hover:bg-muted rounded">
                                {expanded.includes(node.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </div>
                        ) : <span className="w-4" />}
                        <span>{node.label}</span>
                    </div>
                    {selectedIds.includes(node.id) && <Check className="h-4 w-4" />}
                </CommandItem>
                {node.children && node.children.length > 0 && expanded.includes(node.id) && (
                    renderTree(node.children, level + 1)
                )}
            </div>
        ))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {renderTree(data)}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    description: z.string().optional(),
    color: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
    vendorType: z.string().optional(), // Now singular string
    contacts: z.array(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.string().optional(),
    })).default([]),
    locationIds: z.array(z.string()).default([]),
    assetIds: z.array(z.string()).default([]),
    partIds: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    files: z.array(z.string()).default([]),
})

interface VendorFormProps {
    initialData?: any
    isEditing?: boolean
    vendorId?: string
}

export function VendorForm({ initialData, isEditing = false, vendorId }: VendorFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [locations, setLocations] = useState<any[]>([])
    const [assets, setAssets] = useState<any[]>([])
    const [partsList, setPartsList] = useState<any[]>([])
    const [vendorTypesOptions, setVendorTypesOptions] = useState<string[]>([])
    const [isCreatingType, setIsCreatingType] = useState(false)
    const [typeSearch, setTypeSearch] = useState("")
    const [popoverOpen, setPopoverOpen] = useState(false)

    // Upload states
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isUploadingFile, setIsUploadingFile] = useState(false)

    // Tree Data
    const [locationTree, setLocationTree] = useState<TreeNode[]>([])
    const [assetTree, setAssetTree] = useState<TreeNode[]>([])

    const t = useTranslations('Vendors')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            color: "blue",
            address: "",
            website: "",
            vendorType: "",
            contacts: [],
            locationIds: [],
            assetIds: [],
            partIds: [],
            images: [],
            files: [],
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || "",
                description: initialData.description || "",
                color: initialData.color || "blue",
                address: initialData.address || "",
                website: initialData.website || "",
                vendorType: initialData.vendorType || (initialData.vendorTypes && initialData.vendorTypes.length > 0 ? initialData.vendorTypes[0] : ""),
                contacts: initialData.contacts || [],
                locationIds: initialData.locationIds || [],
                assetIds: initialData.assetIds || [],
                partIds: initialData.partIds || [],
                images: initialData.images || [],
                files: initialData.files || [],
            })
        }
    }, [initialData, form])

    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
        control: form.control,
        name: "contacts",
    })

    // Fetch initial data
    useEffect(() => {
        // Locations
        fetch('/api/locations?limit=1000').then(res => res.json()).then(data => {
            if (data.items) {
                const locs = data.items.map((l: any) => ({ ...l, id: l._id || l.id }))
                setLocations(locs)
                setLocationTree(buildTree(locs, 'parentLocationId'))
            }
        }).catch(err => console.error(err))

        // Assets
        fetch('/api/assets?limit=1000').then(res => res.json()).then(data => {
            if (data.items) {
                const asts = data.items.map((a: any) => ({ ...a, id: a._id || a.id }))
                setAssets(asts)
                setAssetTree(buildTree(asts, 'parentAssetId'))
            }
        }).catch(err => console.error(err))

        // Parts
        fetch('/api/parts?limit=1000').then(res => res.json()).then(data => {
            if (data.items) {
                setPartsList(data.items.map((p: any) => ({ ...p, id: p._id || p.id })))
            }
        }).catch(err => console.error(err))

        // Vendor Types (FETCH from new endpoint)
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/vendor-types?limit=1000')
                const data = await res.json()
                if (data.items) {
                    const typeNames = data.items.map((t: any) => t.name)
                    setVendorTypesOptions(typeNames)
                }
            } catch (error) {
                console.error("Failed to load vendor types", error)
            }
        }
        fetchTypes()
    }, [])

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
                formData.append('path', `vendors/${timestamp}_${cleanName}`)

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    if (data.url) newUrls.push(data.url)
                    else if (data.path) newUrls.push(`/api/image?path=${encodeURIComponent(data.path)}`)
                }
            }
            const current = form.getValues(fieldName as any) || []
            form.setValue(fieldName as any, [...current, ...newUrls])
        } catch (error) {
            console.error("Upload failed", error)
            toast({ title: "Upload failed", variant: "destructive" })
        } finally {
            setIsUploading(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...values, id: vendorId } : values
            const res = await fetch('/api/vendors', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Failed to save")

            toast({ title: isEditing ? t('form.messages.updated') : t('form.messages.created') })
            router.push('/vendors')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: t('form.messages.error'), variant: "destructive" })
        }
    }

    const handleCreateType = async (newType: string, fieldChange: (val: string) => void) => {
        setIsCreatingType(true)
        try {
            // Post new type to vendor_types collection
            const res = await fetch('/api/vendor-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newType })
            })

            if (!res.ok) throw new Error("Failed to create type")

            // Update local state
            if (!vendorTypesOptions.includes(newType)) {
                setVendorTypesOptions(prev => [...prev, newType])
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

    const colors = ["blue", "green", "yellow", "red", "teal", "pink", "purple", "orange", "gray", "black"]

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24 p-6 max-w-7xl mx-auto w-full">

                <Card className="bg-card border rounded-lg shadow-none w-full">
                    <CardContent className="p-8 space-y-8">
                        {/* 1. Name */}
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

                        {/* 2. Pictures */}
                        <div className="space-y-2">
                            <FormLabel>{t('form.labels.pictures')}</FormLabel>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
                                {form.watch("images")?.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-md border overflow-hidden group">
                                        <img src={url} alt="Vendor" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => form.setValue("images", form.getValues("images").filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <span className="text-sm font-medium">{isUploadingImage ? t('form.buttons.uploading') : t('form.buttons.addPicture')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Vendor Color */}
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.labels.color')}</FormLabel>
                                    <div className="flex flex-wrap gap-3">
                                        {colors.map(color => (
                                            <div
                                                key={color}
                                                className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${field.value === color ? 'border-primary ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:scale-110'}`}
                                                style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color }}
                                                onClick={() => field.onChange(color)}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 4. Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.labels.desc')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('form.placeholders.desc')} className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 5. Contact List */}
                        <div className="space-y-4">
                            <div className="flex flex-row items-center justify-between">
                                <FormLabel className="text-base">{t('form.labels.contacts')}</FormLabel>
                                <Button type="button" size="sm" variant="outline" onClick={() => appendContact({ name: "", email: "", phone: "", role: "" })}>
                                    <Plus className="mr-2 h-4 w-4" /> {t('form.buttons.addContact')}
                                </Button>
                            </div>
                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                {contactFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                                        <FormField
                                            control={form.control}
                                            name={`contacts.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('form.labels.contactName')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('form.placeholders.contactName')} {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`contacts.${index}.email`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('form.labels.contactEmail')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('form.placeholders.contactEmail')} {...field} value={field.value || ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`contacts.${index}.phone`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('form.labels.contactPhone')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('form.placeholders.contactPhone')} {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`contacts.${index}.role`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-xs text-muted-foreground">{t('form.labels.contactRole')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder={t('form.placeholders.contactRole')} {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeContact(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {contactFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No contacts added.</p>}
                            </div>
                        </div>

                        {/* 6. Files */}
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
                                    <span className="text-sm font-medium">{isUploadingFile ? t('form.buttons.uploading') : t('form.buttons.addFile')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 7. Locations (Tree Select) */}
                            <FormField
                                control={form.control}
                                name="locationIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('form.labels.locations')}</FormLabel>
                                        <TreeSelect
                                            data={locationTree}
                                            selectedIds={field.value || []}
                                            onSelect={field.onChange}
                                            placeholder={t('form.placeholders.locations')}
                                        />
                                        <FormMessage />
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {field.value?.map(locId => {
                                                const loc = locations.find(l => l.id === locId)
                                                return loc ? (
                                                    <Badge key={locId} variant="outline">
                                                        {loc.name} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => field.onChange(field.value?.filter(id => id !== locId))} />
                                                    </Badge>
                                                ) : null
                                            })}
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {/* 8. Assets (Tree Select) */}
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
                                        <FormMessage />
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 9. Parts */}
                            {/* 9. Parts */}
                            <FormField
                                control={form.control}
                                name="partIds"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('form.labels.parts')}</FormLabel>
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
                                                            : t('form.placeholders.parts')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('form.placeholders.searchParts')} />
                                                    <CommandList>
                                                        <CommandEmpty>No part found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {partsList.map((part) => (
                                                                <CommandItem
                                                                    value={part.name}
                                                                    key={part.id}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        const updated = current.includes(part.id)
                                                                            ? current.filter((id: string) => id !== part.id)
                                                                            : [...current, part.id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            (field.value || []).includes(part.id)
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {part.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((partId: string) => {
                                                const part = partsList.find((p) => p.id === partId)
                                                return part ? (
                                                    <Badge key={partId} variant="secondary" className="flex items-center gap-1">
                                                        {part.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((id: string) => id !== partId))
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

                            {/* 10. Vendor Type (Creatable - Single Select) */}
                            <FormField
                                control={form.control}
                                name="vendorType"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="flex items-center gap-2">
                                            {t('form.labels.types')}
                                            {isCreatingType && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                        </FormLabel>
                                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value || t('form.placeholders.type')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput
                                                        placeholder={t('form.placeholders.searchType')}
                                                        value={typeSearch}
                                                        onValueChange={setTypeSearch}
                                                    />
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
                                                            {vendorTypesOptions.map((type) => (
                                                                <CommandItem
                                                                    value={type}
                                                                    key={type}
                                                                    onSelect={() => {
                                                                        field.onChange(type)
                                                                        setPopoverOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === type
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {type}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </FormItem>
                                )}
                            />
                        </div>

                    </CardContent>
                </Card>

                {/* Sticky Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background flex justify-end gap-4 z-50 md:pl-64">
                    <Button type="button" variant="outline" onClick={() => router.back()}>{t('detail.deleteDialog.cancel')}</Button>
                    <Button type="submit" disabled={isUploadingImage || isUploadingFile || form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? t('form.buttons.save') : t('form.buttons.create')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

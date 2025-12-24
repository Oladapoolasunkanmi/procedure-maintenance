"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Check, ChevronsUpDown, Upload, X, QrCode, FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
} from "@/components/ui/card"

import { users } from "@/lib/data"
import { useRouter, useSearchParams } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    address: z.string().optional(),
    description: z.string().optional(),
    teamsInCharge: z.array(z.string()).default([]),
    barcode: z.string().optional(),
    vendors: z.string().optional(),
    parentLocationId: z.string().optional(),
    images: z.array(z.string()).optional(),
    files: z.array(z.string()).optional(),
})

interface LocationFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
    locationId?: string
}

interface LocationTreeNode {
    id: string;
    name: string;
    children?: LocationTreeNode[];
}

export function LocationForm({ initialData, isEditing = false, locationId }: LocationFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const [barcodeMode, setBarcodeMode] = useState<"auto" | "manual">("auto")
    const [locationTree, setLocationTree] = useState<LocationTreeNode[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isUploadingFile, setIsUploadingFile] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: initialData?.name || searchParams.get("name") || "",
            address: initialData?.address || "",
            description: initialData?.description || "",
            teamsInCharge: initialData?.teamsInCharge || (searchParams.get("teamId") ? [searchParams.get("teamId")!] : []),
            barcode: initialData?.barcode || "",
            vendors: initialData?.vendors || "",
            parentLocationId: initialData?.parentLocationId || searchParams.get("parentId") || undefined,
            images: initialData?.images || [],
            files: initialData?.files || [],
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

                // Sanitize filename for the path
                const parts = file.name.split('.')
                const ext = parts.pop()
                const base = parts.join('.')
                const sanitizedBase = base.replace(/[^a-zA-Z0-9]/g, "")
                const path = `andechser_maintenance_system/${type}s/${sanitizedBase}_${Date.now()}.${ext}`

                formData.append("path", path)
                formData.append("file", file)

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                if (!res.ok) throw new Error(`Upload failed for ${file.name}`)

                const data = await res.json()
                newUrls.push(data.path || data.url) // Assuming API returns path or url
            }

            const currentValues = form.getValues(fieldName) || []
            form.setValue(fieldName, [...currentValues, ...newUrls])

            toast({
                title: "Upload successful",
                description: `${files.length} ${type}(s) uploaded.`,
            })

        } catch (error) {
            console.error(error)
            toast({
                title: "Upload failed",
                description: "Failed to upload files",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
            // Reset input
            e.target.value = ""
        }
    }

    // Fetch locations and build tree
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations?limit=1000')
                const data = await res.json()

                if (data.items) {
                    const nodes: Record<string, LocationTreeNode> = {}
                    const roots: LocationTreeNode[] = []

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
                console.error("Failed to load location tree:", error)
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

        fetchLocations()
        fetchTeams()
    }, [])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const payload = {
                ...values,
                vendors: values.vendors ? values.vendors.split(',').map(v => v.trim()).filter(Boolean) : [],
            }

            let response;
            if (isEditing && locationId) {
                response = await fetch('/api/locations', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...payload, id: locationId }),
                })
            } else {
                response = await fetch('/api/locations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                })
            }

            if (response && !response.ok) {
                throw new Error('Failed to save location')
            }

            const data = await response.json()
            const savedId = isEditing ? locationId : (data.id || data._id || data.insertedId || data.item_id)

            toast({
                title: isEditing ? "Location Updated" : "Location Created",
                description: `Successfully ${isEditing ? "updated" : "created"} location ${values.name}.`,
            })

            if (savedId) {
                router.push(`/locations?id=${savedId}`)
            } else {
                router.push('/locations')
            }
            router.refresh()
        } catch (error) {
            console.error("Failed to save location:", error)
            toast({
                title: "Error",
                description: "Failed to save location. Please try again.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-24">
            <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Location" : "New Location"}</h1>
                <p className="text-muted-foreground">{isEditing ? "Edit existing location details." : "Add a new location or facility."}</p>
            </div>

            <Card className="bg-card border rounded-lg shadow-none w-full">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form id="location-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* 1. Location Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Warehouse A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 2. Add Pictures */}
                            <FormField
                                control={form.control}
                                name="images"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pictures</FormLabel>
                                        <FormControl>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {(field.value || []).map((url, index) => (
                                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                                                            <img
                                                                src={`/api/image?path=${encodeURIComponent(url)}`}
                                                                alt={`Preview ${index}`}
                                                                className="object-cover w-full h-full"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newValue = [...field.value!]
                                                                    newValue.splice(index, 1)
                                                                    field.onChange(newValue)
                                                                }}
                                                                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="relative aspect-square rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/40 hover:border-primary transition-colors">
                                                        {isUploadingImage ? (
                                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <>
                                                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                                <span className="text-xs text-muted-foreground font-medium">Add Pictures</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, 'image')}
                                                            disabled={isUploadingImage}
                                                        />
                                                    </label>
                                                </div>
                                                <FormMessage />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* 3. Address */}
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St..." {...field} />
                                        </FormControl>
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
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Location details..." className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 5. Teams in Charge */}
                            <FormField
                                control={form.control}
                                name="teamsInCharge"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Teams in Charge</FormLabel>
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
                                                            : "Select teams/users"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search team..." />
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

                            {/* 6. Bar Code */}
                            <div className="space-y-4">
                                <FormLabel>QR Code/Barcode</FormLabel>
                                {barcodeMode === "auto" ? (
                                    <div className="space-y-4">
                                        <Input disabled value="Barcode will be generated" className="bg-muted/50 text-muted-foreground" />
                                        <div className="space-y-4">
                                            <button
                                                type="button"
                                                onClick={() => setBarcodeMode("manual")}
                                                className="text-sm text-primary hover:underline font-medium"
                                            >
                                                or Input Manually
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
                                                        <Input placeholder="Enter barcode or tag ID" {...field} value={field.value || ""} />
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
                                            or Auto-Generate
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 7. Attach Files */}
                            <FormField
                                control={form.control}
                                name="files"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Files</FormLabel>
                                        <FormControl>
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {(field.value || []).map((url, index) => {
                                                        const fileName = url.split('/').pop() || "Filed"
                                                        return (
                                                            <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                                                <FileText className="h-3 w-3 mr-1" />
                                                                <span className="max-w-[150px] truncate" title={fileName}>{fileName}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newValue = [...field.value!]
                                                                        newValue.splice(index, 1)
                                                                        field.onChange(newValue)
                                                                    }}
                                                                    className="ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>

                                                <label className="flex items-center justify-center w-full rounded-lg border border-dashed px-8 py-6 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer relative">
                                                    {isUploadingFile ? (
                                                        <div className="flex flex-col items-center">
                                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                                                            <span className="text-sm text-muted-foreground">Uploading...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                            <FileText className="h-6 w-6" />
                                                            <span className="text-sm font-medium">Click to upload files</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(e, 'file')}
                                                        disabled={isUploadingFile}
                                                    />
                                                </label>
                                                <FormMessage />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* 8. Vendor */}
                            <FormField
                                control={form.control}
                                name="vendors"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Vendor Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 9. Parent Location */}
                            <FormField
                                control={form.control}
                                name="parentLocationId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Parent Location</FormLabel>
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
                                                            ? findLocationName(locationTree, field.value) || field.value
                                                            : "Select parent location"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search locations..." />
                                                    <CommandList>
                                                        <CommandEmpty>No location found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {locationTree.map((node) => (
                                                                <LocationTreeItem
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

                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-end gap-4 border-t bg-card p-4 shadow-md sm:px-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" form="location-form" disabled={form.formState.isSubmitting} className="cursor-pointer">
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Save Changes" : "Create Location"}
                </Button>
            </div>
        </div>
    )
}

function findLocationName(nodes: LocationTreeNode[], id: string): string | undefined {
    for (const node of nodes) {
        if (node.id === id) return node.name
        if (node.children) {
            const found = findLocationName(node.children, id)
            if (found) return found
        }
    }
    return undefined
}

function LocationTreeItem({
    node,
    selectedValue,
    onSelect,
    level = 0
}: {
    node: LocationTreeNode
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
                        <LocationTreeItem
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

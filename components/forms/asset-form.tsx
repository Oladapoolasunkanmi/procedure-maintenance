"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, Upload, X, QrCode, FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
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
})

interface AssetFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
    assetId?: string
}

interface AssetTreeNode {
    id: string;
    name: string;
    children?: AssetTreeNode[];
}

// ... (AssetTreeNode interface remains)

export function AssetForm({ initialData, isEditing = false, assetId }: AssetFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const [barcodeMode, setBarcodeMode] = useState<"auto" | "manual">("auto")
    const [assetTree, setAssetTree] = useState<AssetTreeNode[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            name: searchParams.get("name") || "",
            criticality: "Medium",
            teamsInCharge: [],
            parentAssetId: searchParams.get("parentId") || undefined,
        },
    })

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
                    const nodes: Record<string, AssetTreeNode> = {}
                    const roots: AssetTreeNode[] = []

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

        fetchAssets()
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
                title: isEditing ? "Asset Updated" : "Asset Created",
                description: `Successfully ${isEditing ? "updated" : "created"} asset ${values.name}.`,
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
                title: "Error",
                description: "Failed to save asset. Please try again.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-24">
            <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Asset" : "New Asset"}</h1>
                <p className="text-muted-foreground">{isEditing ? "Edit existing asset details." : "Register a new asset in the system."}</p>
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
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Forklift #9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 2. Pictures */}
                            <div className="space-y-2">
                                <FormLabel>Pictures</FormLabel>
                                <div className="rounded-lg border border-dashed px-8 py-10 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <span className="text-sm font-medium">Add or drag pictures</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Files */}
                            <div className="space-y-2">
                                <FormLabel>Files</FormLabel>
                                <div className="rounded-lg border border-dashed px-8 py-6 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileText className="h-8 w-8" />
                                        <span className="text-sm font-medium">Add or drag files</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Location & 5. Criticality */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="locationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {locations.map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.id}>
                                                            {loc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="criticality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Criticality</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select criticality" />
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
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Asset description..." className="resize-none" {...field} />
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
                                        <FormLabel>Year</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 2023" {...field} value={field.value ?? ''} />
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
                                            <FormLabel>Manufacturer</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Caterpillar" {...field} />
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
                                            <FormLabel>Model</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. GP15-35(C)N" {...field} />
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
                                            <FormLabel>Serial Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 356354363DFGDF" {...field} />
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
                                                            {users.map((user) => (
                                                                <CommandItem
                                                                    value={user.name}
                                                                    key={user.id}
                                                                    onSelect={() => {
                                                                        const current = field.value || []
                                                                        const updated = current.includes(user.id)
                                                                            ? current.filter((id) => id !== user.id)
                                                                            : [...current, user.id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            (field.value || []).includes(user.id)
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {user.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(field.value || []).map((userId) => {
                                                const user = users.find((u) => u.id === userId)
                                                return user ? (
                                                    <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                                        {user.name}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => {
                                                                field.onChange((field.value || []).filter((id) => id !== userId))
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

                            {/* 13. Asset Type & 14. Vendor */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="assetType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Type</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Machinery" {...field} />
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
                                            <FormLabel>Vendor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Vendor Name" {...field} />
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
                                        <FormLabel>Parts</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Filter, Belt" {...field} />
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
                                        <FormLabel>Parent Asset</FormLabel>
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
                                                            ? findAssetName(assetTree, field.value) || field.value
                                                            : "Select parent asset"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search assets..." />
                                                    <CommandList>
                                                        <CommandEmpty>No asset found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {assetTree.map((node) => (
                                                                <AssetTreeItem
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

function findAssetName(nodes: AssetTreeNode[], id: string): string | undefined {
    for (const node of nodes) {
        if (node.id === id) return node.name
        if (node.children) {
            const found = findAssetName(node.children, id)
            if (found) return found
        }
    }
    return undefined
}

function AssetTreeItem({
    node,
    selectedValue,
    onSelect,
    level = 0
}: {
    node: AssetTreeNode
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
                        <AssetTreeItem
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

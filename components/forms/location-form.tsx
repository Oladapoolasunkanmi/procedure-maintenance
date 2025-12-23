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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            name: searchParams.get("name") || "",
            address: "",
            description: "",
            teamsInCharge: [],
            barcode: "",
            vendors: "",
            parentLocationId: searchParams.get("parentId") || undefined,
        },
    })

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

        fetchLocations()
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
                            <div className="space-y-2">
                                <FormLabel>Pictures</FormLabel>
                                <div className="rounded-lg border border-dashed px-8 py-10 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <span className="text-sm font-medium">Add or drag pictures</span>
                                    </div>
                                </div>
                            </div>

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
                            <div className="space-y-2">
                                <FormLabel>Files</FormLabel>
                                <div className="rounded-lg border border-dashed px-8 py-6 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileText className="h-8 w-8" />
                                        <span className="text-sm font-medium">Add or drag files</span>
                                    </div>
                                </div>
                            </div>

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

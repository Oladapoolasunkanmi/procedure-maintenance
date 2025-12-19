"use client"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, Upload, X, QrCode } from "lucide-react"
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

import { users, locations } from "@/lib/data"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    locationId: z.string().min(1, { message: "Please select a location." }),
    criticality: z.enum(["Low", "Medium", "High", "Critical"]),
    description: z.string().optional(),
    notes: z.string().optional(),
    purchaseDate: z.date().optional(),
    purchasePrice: z.coerce.number().optional(),
    annualDepreciation: z.coerce.number().optional(),
    warrantyEndDate: z.date().optional(),
    vinNumber: z.string().optional(),
    replacementCost: z.coerce.number().optional(),
    serialNumber: z.string().optional(),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    teamsInCharge: z.array(z.string()).default([]),
    barcode: z.string().optional(),
    assetType: z.string().optional(),
    vendors: z.string().optional(),
})

interface AssetFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
}

export function AssetForm({ initialData, isEditing = false }: AssetFormProps) {
    const router = useRouter()
    const [barcodeMode, setBarcodeMode] = useState<"auto" | "manual">("auto")
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            name: "",
            criticality: "Medium",
            teamsInCharge: [],
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        router.push("/assets")
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

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asset Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Forklift #9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Photo Upload Mock */}
                            <div className="rounded-lg border border-dashed px-8 py-10 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-8 w-8" />
                                    <span className="text-sm font-medium">Add or drag pictures</span>
                                </div>
                            </div>

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <FormField
                                    control={form.control}
                                    name="vinNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>VIN Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="purchaseDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Purchase Date</FormLabel>
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
                                                                <span>Pick a date</span>
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
                                                        disabled={(date) =>
                                                            date > new Date()
                                                        }
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
                                    name="warrantyEndDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Warranty End Date</FormLabel>
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
                                                                <span>Pick a date</span>
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="purchasePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Purchase Price ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="replacementCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replacement Cost ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="annualDepreciation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Annual Depreciation ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

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
                                            <FormLabel>Vendors</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Vendor Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

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
                <Button type="submit" form="asset-form">
                    {isEditing ? "Save Changes" : "Create Asset"}
                </Button>
            </div>
        </div>
    )
}

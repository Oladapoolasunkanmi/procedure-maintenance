"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, Upload, X, Plus, FileText, Paperclip, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

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

import { users, locations, assets } from "@/lib/data"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }),
    description: z.string().optional(),
    procedure: z.string().optional(),
    locationId: z.string().min(1, { message: "Please select a location." }),
    assetId: z.string().optional(),
    priority: z.enum(["Low", "Medium", "High"]),
    criticality: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
    dueDate: z.date().optional(),
    assignedTo: z.array(z.string()).default([]),
    categories: z.string().optional(),
    vendors: z.string().optional(),
    scheduleType: z.enum(["None", "Daily", "Weekly", "Monthly", "Yearly"]).default("None"),
    scheduleInterval: z.coerce.number().min(1).default(1),
    scheduleDays: z.array(z.string()).default([]),
})

const SCHEDULE_TYPES = ["None", "Daily", "Weekly", "Monthly", "Yearly"]
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface WorkOrderFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
}

export function WorkOrderForm({ initialData, isEditing = false }: WorkOrderFormProps) {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            title: "",
            priority: "Medium",
            assignedTo: [],
            scheduleType: "None",
            scheduleInterval: 1,
            scheduleDays: [],
        },
    })

    const scheduleType = form.watch("scheduleType")

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        // In a real app, we would submit to backend here.
        // For now, just redirect back to list.
        router.push("/work-orders")
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-24">
            <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Work Order" : "New Work Order"}</h1>
                <p className="text-muted-foreground">{isEditing ? "Edit existing work order details." : "Create a new work order for maintenance or repairs."}</p>
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
                                        <FormLabel>Work Order Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Weekly Forklift Inspection" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 2. Photos */}
                            <div className="rounded-lg border border-dashed px-8 py-10 text-center hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-8 w-8" />
                                    <span className="text-sm font-medium">Add or drag pictures</span>
                                </div>
                            </div>

                            {/* 3. Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe the issue or task..." className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 4. Procedure */}
                            <div className="space-y-2">
                                <FormLabel>Procedure</FormLabel>
                                <div className="rounded-md border border-dashed p-6 flex flex-col items-center justify-center gap-3 bg-muted/5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span>Create or attach new Form, Procedure or Checklist</span>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="gap-2 bg-background">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Procedure
                                    </Button>
                                </div>
                            </div>

                            {/* 5. Location */}
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

                            {/* 6. Criticality */}
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

                            {/* 7. Assign To */}
                            <FormField
                                control={form.control}
                                name="assignedTo"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Assign To</FormLabel>
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
                                                            : "Select team members"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search user..." />
                                                    <CommandList>
                                                        <CommandEmpty>No user found.</CommandEmpty>
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

                            {/* 8. Due Date */}
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
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
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 9. Schedule */}
                            <FormField
                                control={form.control}
                                name="scheduleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Schedule</FormLabel>
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
                                        {field.value === "Weekly" && (
                                            <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">Every</span>
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
                                                    <span className="text-sm">week on</span>
                                                </div>
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
                                                <p className="text-xs text-muted-foreground">
                                                    Repeats every {form.watch("scheduleInterval")} week on {form.watch("scheduleDays").join(", ") || "..."}
                                                </p>
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 10. Priority */}
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg w-fit">
                                                {["Low", "Medium", "High"].map((priority) => (
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

                            {/* 11. Asset */}
                            <FormField
                                control={form.control}
                                name="assetId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asset</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select asset" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {assets.map((asset) => (
                                                    <SelectItem key={asset.id} value={asset.id}>
                                                        {asset.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 12. Files */}
                            <div className="space-y-2">
                                <FormLabel>Files</FormLabel>
                                <div className="rounded-md border border-dashed px-4 py-8 flex items-center justify-center gap-2 bg-muted/5 hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Attach files</span>
                                </div>
                            </div>

                            {/* 13. Parts */}
                            <div className="space-y-2">
                                <FormLabel>Parts</FormLabel>
                                <div className="rounded-md border border-dashed px-4 py-8 flex items-center justify-center gap-2 bg-muted/5 hover:bg-accent/40 hover:border-primary transition-colors cursor-pointer">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Add parts</span>
                                </div>
                            </div>

                            {/* 14. Categories */}
                            <FormField
                                control={form.control}
                                name="categories"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categories</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Electrical, Mechanical" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 15. Vendors */}
                            <FormField
                                control={form.control}
                                name="vendors"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendors</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Grainger" {...field} />
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
                <Button type="submit" form="work-order-form">
                    {isEditing ? "Save Changes" : "Create Work Order"}
                </Button>
            </div>
        </div>
    )
}

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Check, ChevronsUpDown, Upload, X } from "lucide-react"
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
import { useRouter } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    address: z.string().optional(),
    description: z.string().optional(),
    staffCount: z.coerce.number().optional(),
    teamsInCharge: z.array(z.string()).default([]),
})

interface LocationFormProps {
    initialData?: z.infer<typeof formSchema>
    isEditing?: boolean
}

export function LocationForm({ initialData, isEditing = false }: LocationFormProps) {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            name: "",
            teamsInCharge: [],
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        router.push("/locations")
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full pb-24">
            <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Location" : "New Location"}</h1>
                <p className="text-muted-foreground">{isEditing ? "Edit existing location details." : "Add a new location or facility."}</p>
            </div>

            <Card className="border bg-card rounded-lg shadow-none">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form id="location-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

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

                            {/* Photo Upload Mock */}
                            <div className="rounded-lg border border-dashed p-8 text-center hover:bg-accent/40 transition-colors cursor-pointer">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-8 w-8" />
                                    <span className="text-sm font-medium">Add or drag pictures</span>
                                </div>
                            </div>

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="staffCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Staff</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-end gap-4 border-t bg-card p-4 shadow-md sm:px-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" form="location-form">
                    {isEditing ? "Save Changes" : "Create Location"}
                </Button>
            </div>
        </div>
    )
}

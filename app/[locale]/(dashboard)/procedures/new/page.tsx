"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Rocket, FileUp } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().optional(),
})

export default function NewProcedurePage() {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        // In a real app, we might create the ID here or pass the data to the builder
        // For now, we'll just navigate to the builder with query params
        const params = new URLSearchParams()
        params.set("name", values.name)
        if (values.description) params.set("description", values.description)
        router.push(`/procedures/builder?${params.toString()}`)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create a New Procedure Template</h1>
                <p className="text-muted-foreground">Choose how you want to start building your procedure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                <OptionCard
                    icon={Plus}
                    title="Blank Procedure"
                    description="Start Procedure From Scratch"
                    onClick={() => setIsDialogOpen(true)}
                    color="text-primary"
                />
                <OptionCard
                    icon={Rocket}
                    title="Use a Template"
                    description="Find one in Global Procedure Library"
                    onClick={() => { }} // Placeholder
                    color="text-purple-500"
                />
                <OptionCard
                    icon={FileUp}
                    title="Import Forms"
                    description="Send us your Template to Digitize"
                    onClick={() => { }} // Placeholder
                    color="text-green-500"
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Bring your new procedure to life</DialogTitle>
                        <DialogDescription>
                            Give your procedure a name and description to get started.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Give it a name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Fire Extinguisher Inspection" {...field} />
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
                                        <FormLabel>Add a description (optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Routine inspection form..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Next</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function OptionCard({
    icon: Icon,
    title,
    description,
    onClick,
    color,
}: {
    icon: any
    title: string
    description: string
    onClick: () => void
    color: string
}) {
    return (
        <Card
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group rounded-lg"
            onClick={onClick}
        >
            <CardContent className="flex flex-col items-center justify-center p-10 text-center gap-4">
                <div className={`p-4 rounded-full bg-muted group-hover:bg-background transition-colors`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}

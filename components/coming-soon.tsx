import { Construction } from "lucide-react"

interface ComingSoonProps {
    title: string
    description?: string
}

export function ComingSoon({ title, description = "This feature is currently under development." }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-8">
            <div className="bg-muted rounded-full p-6 mb-6">
                <Construction className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        </div>
    )
}

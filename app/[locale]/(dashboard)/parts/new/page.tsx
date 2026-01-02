import { Suspense } from "react"
import { PartForm } from "@/components/forms/part-form"

export default function NewPartPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">New Part</h1>
                    <p className="text-muted-foreground">Add a new part to inventory.</p>
                </div>
                <PartForm />
            </div>
        </Suspense>
    )
}

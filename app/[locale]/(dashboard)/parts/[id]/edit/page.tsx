
import { Suspense } from "react"
import { PartForm } from "@/components/forms/part-form"
import { notFound } from "next/navigation"
import { apiClient } from "@/lib/axios"

interface EditPartPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditPartPage({ params }: EditPartPageProps) {
    const { id } = await params
    let part = null;

    try {
        // Try query by 'id'
        const payloadId = {
            db_name: "andechser_maintenance_system",
            coll_name: "parts",
            filters: { id: id }
        };
        let response = await apiClient.post('/api/v2/cosmosdb/query-items', payloadId);

        if (response.data.items && response.data.items.length > 0) {
            part = response.data.items[0];
        } else {
            // Fallback: Try query by '_id' if 'id' failed (Cosmos/Mongo nuance)
            const payloadUnderscoreId = {
                db_name: "andechser_maintenance_system",
                coll_name: "parts",
                filters: { _id: id }
            };
            response = await apiClient.post('/api/v2/cosmosdb/query-items', payloadUnderscoreId);
            if (response.data.items && response.data.items.length > 0) {
                part = response.data.items[0];
            }
        }
    } catch (error) {
        console.error("Failed to fetch part:", error);
    }

    if (!part) return notFound()

    // Normalize ID for the form if needed
    if (!part.id && part._id) part.id = part._id;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Edit Part</h1>
                </div>
                <PartForm initialData={part} isEditing partId={part.id || id} />
            </div>
        </Suspense>
    )
}

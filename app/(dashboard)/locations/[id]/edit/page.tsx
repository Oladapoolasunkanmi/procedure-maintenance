import { Suspense } from "react"
import { LocationForm } from "@/components/forms/location-form"
import { notFound } from "next/navigation"
import { apiClient } from "@/lib/axios"

interface EditLocationPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
    const { id } = await params

    let location = null;

    try {
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "locations",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        if (response.data.items && response.data.items.length > 0) {
            location = response.data.items[0];
        }
    } catch (error) {
        console.error("Failed to fetch location for edit:", error);
    }

    if (!location) {
        return notFound()
    }

    // Map the location data to the form schema
    const initialData = {
        name: location.name,
        address: location.address,
        description: location.description,
        teamsInCharge: location.teamsInCharge || [],
        barcode: location.barcode || "",
        vendors: Array.isArray(location.vendors) ? location.vendors.join(", ") : (location.vendors || ""),
        parentLocationId: location.parentLocationId,
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LocationForm initialData={initialData} isEditing locationId={id} />
        </Suspense>
    )
}

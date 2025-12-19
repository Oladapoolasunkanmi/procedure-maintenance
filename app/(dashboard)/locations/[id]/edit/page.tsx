import { LocationForm } from "@/components/forms/location-form"
import { locations } from "@/lib/data"
import { notFound } from "next/navigation"

interface EditLocationPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
    const { id } = await params
    const location = locations.find((l) => l.id === id)

    if (!location) {
        return notFound()
    }

    // Map the location data to the form schema
    const initialData = {
        name: location.name,
        address: location.address,
        description: location.description,
        staffCount: location.staffCount,
        teamsInCharge: location.teamsInCharge || [],
    }

    return <LocationForm initialData={initialData} isEditing />
}

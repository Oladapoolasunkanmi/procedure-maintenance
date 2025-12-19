import { AssetForm } from "@/components/forms/asset-form"
import { assets } from "@/lib/data"
import { notFound } from "next/navigation"

interface EditAssetPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
    const { id } = await params
    const asset = assets.find((a) => a.id === id)

    if (!asset) {
        return notFound()
    }

    // Map the asset data to the form schema
    const initialData = {
        name: asset.name,
        locationId: asset.locationId,
        criticality: asset.criticality,
        description: asset.description,
        notes: "", // Not in mock data, default empty
        purchaseDate: new Date(), // Not in mock data, default today
        purchasePrice: 0, // Not in mock data
        annualDepreciation: 0, // Not in mock data
        warrantyEndDate: new Date(), // Not in mock data
        vinNumber: "", // Not in mock data
        replacementCost: 0, // Not in mock data
        serialNumber: asset.serialNumber,
        model: asset.model,
        manufacturer: asset.manufacturer,
        teamsInCharge: [], // Not in mock data
        barcode: "", // Not in mock data
        assetType: asset.assetType,
        vendors: "", // Not in mock data
    }

    return <AssetForm initialData={initialData} isEditing />
}

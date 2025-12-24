import { Suspense } from "react"
import { AssetForm } from "@/components/forms/asset-form"
import { notFound } from "next/navigation"
import { apiClient } from "@/lib/axios"

interface EditAssetPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
    const { id } = await params

    let asset = null;

    try {
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "assets",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        if (response.data.items && response.data.items.length > 0) {
            asset = response.data.items[0];
        }
    } catch (error) {
        console.error("Failed to fetch asset for edit:", error);
    }

    if (!asset) {
        return notFound()
    }

    // Map the asset data to the form schema
    const initialData = {
        name: asset.name,
        locationId: asset.locationId,
        criticality: asset.criticality,
        description: asset.description,
        notes: asset.notes || "",
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(),
        purchasePrice: asset.purchasePrice || 0,
        annualDepreciation: asset.annualDepreciation || 0,
        warrantyEndDate: asset.warrantyEndDate ? new Date(asset.warrantyEndDate) : new Date(),
        vinNumber: asset.vinNumber || "",
        replacementCost: asset.replacementCost || 0,
        serialNumber: asset.serialNumber,
        model: asset.model,
        manufacturer: asset.manufacturer,
        teamsInCharge: asset.teamsInCharge || [],
        barcode: asset.barcode || "",
        assetType: asset.assetType,
        vendors: asset.vendors || "",
        parentAssetId: asset.parentAssetId,
        files: asset.files || [],
        images: asset.images || [],
        parts: asset.parts,
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AssetForm initialData={initialData} isEditing assetId={id} />
        </Suspense>
    )
}

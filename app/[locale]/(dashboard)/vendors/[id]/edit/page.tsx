import { Suspense } from "react"
import { VendorForm } from "@/components/forms/vendor-form"
import { notFound } from "next/navigation"
import { apiClient } from "@/lib/axios"

interface EditVendorPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditVendorPage({ params }: EditVendorPageProps) {
    const { id } = await params

    let vendor = null;

    try {
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "vendors",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        if (response.data.items && response.data.items.length > 0) {
            vendor = response.data.items[0];
        }
    } catch (error) {
        console.error("Failed to fetch vendor for edit:", error);
    }

    if (!vendor) {
        return notFound()
    }

    // Map vendor data
    // Assuming structure matches what we saved
    const initialData = {
        name: vendor.name,
        description: vendor.description,
        color: vendor.color,
        address: vendor.address,
        website: vendor.website,
        vendorType: vendor.vendorType || (vendor.vendorTypes && vendor.vendorTypes.length > 0 ? vendor.vendorTypes[0] : ""),
        contacts: vendor.contacts || [],
        locationIds: vendor.locationIds || [],
        assetIds: vendor.assetIds || [],
        partIds: vendor.partIds || [],
        images: vendor.images || [],
        files: vendor.files || [],
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Edit Vendor</h1>
                </div>
                <div className="bg-card border rounded-lg p-6">
                    <VendorForm initialData={initialData} isEditing vendorId={id} />
                </div>
            </div>
        </Suspense>
    )
}

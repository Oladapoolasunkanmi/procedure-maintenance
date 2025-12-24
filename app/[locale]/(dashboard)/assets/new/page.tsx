"use client"

import { Suspense } from "react"
import { AssetForm } from "@/components/forms/asset-form"

export default function NewAssetPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AssetForm />
        </Suspense>
    )
}

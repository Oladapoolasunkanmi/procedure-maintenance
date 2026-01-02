"use client"

import { Suspense } from "react"
import { VendorForm } from "@/components/forms/vendor-form"

export default function NewVendorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">New Vendor</h1>
                    <p className="text-muted-foreground">Add a new vendor to your system.</p>
                </div>
                {/* <div className="bg-card border rounded-lg p-6"> */}
                <VendorForm />
                {/* </div> */}
            </div>
        </Suspense>
    )
}

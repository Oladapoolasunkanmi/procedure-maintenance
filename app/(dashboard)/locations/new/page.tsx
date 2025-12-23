"use client"

import { LocationForm } from "@/components/forms/location-form"

import { Suspense } from "react"

export default function NewLocationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LocationForm />
        </Suspense>
    )
}

"use client"

import { LocationForm } from "@/components/forms/location-form"
import { useTranslations } from "next-intl"

import { Suspense } from "react"

export default function NewLocationPage() {
    const t = useTranslations('Locations.empty')
    return (
        <Suspense fallback={<div>{t('loadingForm')}</div>}>
            <LocationForm />
        </Suspense>
    )
}

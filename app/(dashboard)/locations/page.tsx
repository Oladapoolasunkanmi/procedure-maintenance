import { Suspense } from "react"
import { LocationsClient } from "./client"

export default function LocationsPage() {
    return (
        <Suspense>
            <LocationsClient />
        </Suspense>
    )
}

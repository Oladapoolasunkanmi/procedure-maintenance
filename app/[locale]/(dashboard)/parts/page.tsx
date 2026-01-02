import { Suspense } from "react"
import { PartsClient } from "./client"

export default function PartsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PartsClient />
        </Suspense>
    )
}

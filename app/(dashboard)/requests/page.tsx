import { Suspense } from "react"
import { RequestsClient } from "./client"

export default function RequestsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RequestsClient />
        </Suspense>
    )
}

import { Suspense } from "react"
import { VendorsClient } from "./client"

export default function VendorsPage() {
    return (
        <Suspense>
            <VendorsClient />
        </Suspense>
    )
}

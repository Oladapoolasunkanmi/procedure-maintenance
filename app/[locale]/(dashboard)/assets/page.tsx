import { Suspense } from "react"
import { AssetsClient } from "./client"

export default function AssetsPage() {
    return (
        <Suspense>
            <AssetsClient />
        </Suspense>
    )
}

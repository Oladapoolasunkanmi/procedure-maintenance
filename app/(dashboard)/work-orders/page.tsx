import { Suspense } from "react"
import { WorkOrdersClient } from "./client"

export default function WorkOrdersPage() {
    return (
        <Suspense>
            <WorkOrdersClient />
        </Suspense>
    )
}

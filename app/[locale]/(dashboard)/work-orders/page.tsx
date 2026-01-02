import { Suspense } from "react"
import { WorkOrdersClient } from "./client"
import { getSessionOrNull } from '@/auth/session'

export default async function WorkOrdersPage() {
    const session = await getSessionOrNull()

    return (
        <Suspense>
            <WorkOrdersClient currentUser={session ? { id: session.sub, name: session.name } : undefined} />
        </Suspense>
    )
}

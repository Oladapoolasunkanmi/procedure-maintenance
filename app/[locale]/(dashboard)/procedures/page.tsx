import { Suspense } from "react"
import { ProceduresClient } from "./client"

export default function ProceduresPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProceduresClient />
        </Suspense>
    )
}

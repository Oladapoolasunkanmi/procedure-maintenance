import { WorkOrderForm } from "@/components/forms/work-order-form"
import { workOrders } from "@/lib/data"
import { notFound } from "next/navigation"

interface EditWorkOrderPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditWorkOrderPage({ params }: EditWorkOrderPageProps) {
    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const workOrder = workOrders.find((wo) => wo.id === decodedId)

    if (!workOrder) {
        return notFound()
    }

    // Map the workOrder data to the form schema
    const initialData = {
        title: workOrder.title,
        description: workOrder.description,
        locationId: "loc-1", // Mocking location ID as it's not in the WorkOrder type explicitly in some versions, or assuming default
        priority: workOrder.priority,
        assignedTo: workOrder.assignedTo,
        scheduleType: "None" as const, // Default or mapped from actual data
        scheduleInterval: 1,
        scheduleDays: [],
        assetId: workOrder.assetId,
        dueDate: new Date(workOrder.dueDate),
    }

    return <WorkOrderForm initialData={initialData} isEditing />
}

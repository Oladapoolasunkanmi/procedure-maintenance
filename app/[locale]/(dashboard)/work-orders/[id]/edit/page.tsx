import { WorkOrderForm } from "@/components/forms/work-order-form"
import { notFound } from "next/navigation"
import { apiClient } from "@/lib/axios"

interface EditWorkOrderPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditWorkOrderPage({ params }: EditWorkOrderPageProps) {
    const { id } = await params
    const decodedId = decodeURIComponent(id)

    let workOrder = null;

    try {
        // Try finding by 'id' first
        let payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "work_orders",
            filters: { id: decodedId }
        };

        let response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);

        const getFirstItem = (res: any) => {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data[0];
            if (res.data && res.data.items && Array.isArray(res.data.items) && res.data.items.length > 0) return res.data.items[0];
            return null;
        };

        workOrder = getFirstItem(response);

        // If not found, try finding by '_id'
        if (!workOrder) {
            payload.filters = { _id: decodedId } as any;
            response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
            workOrder = getFirstItem(response);
        }

    } catch (error) {
        console.error("Failed to fetch work order for edit:", error);
    }

    if (!workOrder) {
        return notFound()
    }

    // Map the workOrder data to the form schema
    const initialData = {
        title: workOrder.title,
        description: workOrder.description,
        locationIds: workOrder.locationIds || (workOrder.locationId ? [workOrder.locationId] : ["loc-1"]),
        priority: workOrder.priority,
        // Ensure assignedTo is array
        assignedTo: Array.isArray(workOrder.assignedTo) ? workOrder.assignedTo : (workOrder.assignedTo ? [workOrder.assignedTo] : []),
        scheduleType: workOrder.scheduleType || "None",
        scheduleInterval: workOrder.scheduleInterval || 1,
        scheduleDays: workOrder.scheduleDays || [],
        scheduleMonthDay: workOrder.scheduleMonthDay,
        assetIds: workOrder.assetIds || (workOrder.assetId ? [workOrder.assetId] : []),
        dueDate: workOrder.dueDate ? new Date(workOrder.dueDate) : undefined,
        startDate: workOrder.startDate ? new Date(workOrder.startDate) : undefined,
        estimatedDuration: workOrder.estimatedDuration || { hours: 0, minutes: 0 },
        procedure: workOrder.procedure || [],
        categories: workOrder.categories || [],
        vendors: workOrder.vendors || [],
        parts: workOrder.parts || [],
        images: workOrder.images || [],
        files: workOrder.files || [],
    }

    return <WorkOrderForm initialData={initialData as any} isEditing workOrderId={decodedId} />
}

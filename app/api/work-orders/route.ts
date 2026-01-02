import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';
import { getSessionOrNull } from '@/auth/session';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        let response;
        if (id) {
            // Sequential lookup for id
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                filters: { id: id },
                limit: 100
            };
            response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);

            // helper checks if empty
            const hasData = (res: any) =>
                (res.data && Array.isArray(res.data) && res.data.length > 0) ||
                (res.data && res.data.items && Array.isArray(res.data.items) && res.data.items.length > 0);

            if (!hasData(response)) {
                // Try _id
                payload.filters = { _id: id } as any;
                response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
            }
        } else {
            // No ID, fetch all
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                filters: {},
                limit: 100
            };
            response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        }

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching work orders:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch work orders" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const session = await getSessionOrNull();
        const createdBy = session ? { id: session.sub, name: session.name } : undefined;
        const createdAt = new Date().toISOString();

        // Check for multiple assets
        const assetIds = data.assetIds || [];
        const isMultiAsset = assetIds.length > 1;

        if (isMultiAsset) {
            // 1. Create Parent Work Order
            // Generate ID explicitly to ensure we have it for children linkage
            const parentId = randomUUID();

            const parentPayload = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                item: {
                    ...data,
                    id: parentId,
                    // Parent specific overrides
                    assetId: undefined,
                    assetIds: assetIds,
                    isBatchParent: true,
                    description: data.description || "Batch Work Order Parent",
                    createdAt,
                    createdBy,
                    status: "Open"
                }
            };

            // Fire and forget parent creation? No, wait for it to ensure success
            const parentRes = await apiClient.post('/api/v2/cosmosdb/items', parentPayload);
            // We use the pre-generated parentId

            // Fetch asset details to get names
            let assetMap = new Map<string, string>();

            // Strategy: Fetch all assets to ensure we find them, as specific queries might be failing due to backend limitations on $or
            try {
                const assetQueryPayload = {
                    db_name: "andechser_maintenance_system",
                    coll_name: "assets",
                    filters: {}, // Fetch all
                    limit: 500
                };
                const assetRes = await apiClient.post('/api/v2/cosmosdb/query-items', assetQueryPayload);
                const items = (assetRes.data && Array.isArray(assetRes.data)) ? assetRes.data
                    : (assetRes.data && assetRes.data.items) ? assetRes.data.items
                        : [];

                items.forEach((a: any) => {
                    // Register name under both ID and _id to ensure lookup succeeds
                    if (a.name) {
                        if (a.id) assetMap.set(a.id, a.name);
                        if (a._id) assetMap.set(a._id, a.name);
                    }
                });

            } catch (err) {
                console.error("Failed to fetch asset names during WO creation", err);
            }

            // 2. Create Child Work Orders
            const childPromises = assetIds.map(async (assetId: string) => {
                // Determine procedure for this asset
                const specificProcedure = data.assignedProcedures ? data.assignedProcedures[assetId] : undefined;

                // Use Asset Name for Title if available
                const assetName = assetMap.get(assetId);

                // User request: "the subworker names is still having the parent WO name" -> They want the asset name.
                // "Asset Name" should be the subwork order name.
                const childTitle = assetName || data.title;

                const childPayload = {
                    db_name: "andechser_maintenance_system",
                    coll_name: "work_orders",
                    item: {
                        ...data,
                        id: undefined, // Let DB generate new ID
                        title: childTitle, // Set specific title
                        assetId: assetId,
                        // If specific procedure is found, use it
                        procedure: specificProcedure ? [specificProcedure] : [],
                        parentWorkOrderId: parentId,
                        isBatchParent: false,
                        description: data.description, // Inherit desc
                        createdAt,
                        createdBy,
                        status: "Open"
                    }
                };
                return apiClient.post('/api/v2/cosmosdb/items', childPayload);
            });

            await Promise.all(childPromises);

            // Return the parent order result
            return NextResponse.json(parentRes.data);

        } else {
            // Standard Single Creation
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                item: {
                    ...data,
                    createdAt,
                    createdBy,
                    status: data.status || "Open",
                    // Ensure assetId is set if it exists in the array
                    assetId: assetIds.length === 1 ? assetIds[0] : undefined
                }
            };
            const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
            return NextResponse.json(response.data);
        }

    } catch (error: any) {
        console.error("Error creating work order:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create work order" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;
        const session = await getSessionOrNull();

        if (!id) {
            return NextResponse.json({ error: "Work Order ID is required" }, { status: 400 });
        }

        // Helper to extract item from response
        const getFirstItem = (res: any) => {
            if (Array.isArray(res.data) && res.data.length > 0) return res.data[0];
            if (res.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) return res.data.items[0];
            return null;
        };

        // 1. Fetch existing work order - Try 'id' first
        let queryPayload = {
            db_name: "andechser_maintenance_system",
            coll_name: "work_orders",
            filters: { id: id }
        };

        let queryRes = await apiClient.post('/api/v2/cosmosdb/query-items', queryPayload);
        let existingItem = getFirstItem(queryRes);

        // If not found, try '_id'
        if (!existingItem) {
            (queryPayload.filters as any) = { _id: id };
            queryRes = await apiClient.post('/api/v2/cosmosdb/query-items', queryPayload);
            existingItem = getFirstItem(queryRes);
        }

        if (!existingItem) {
            return NextResponse.json({ error: "Work Order not found" }, { status: 404 });
        }

        const realId = existingItem._id;

        // Extract comment and attachments from updateData
        const { comment, attachments, ...fieldsToUpdate } = updateData;

        // 2. Prepare History Entry
        let action = "Update";
        let details = "Work order updated";

        if (comment) {
            action = "Comment";
            details = comment;
        } else if (fieldsToUpdate.status && fieldsToUpdate.status !== existingItem.status) {
            action = "Status Change";
            details = `Status changed from ${existingItem.status} to ${fieldsToUpdate.status}`;
        }

        // If we have attachments but no comment text, ensure we still log it
        if (!comment && attachments && attachments.length > 0) {
            action = "Attachment";
            details = `Attached ${attachments.length} file(s)`;
        } else if (fieldsToUpdate.procedureData) {
            action = "Procedure Update";
            details = "Procedure form data updated";
        }

        const historyEntry = {
            action,
            details,
            date: new Date().toISOString(),
            userId: session?.sub || "system",
            userName: session?.name || "System",
            attachments: attachments || [] // Store attachments here
        };

        const currentHistory = existingItem.history || [];
        const newHistory = [...currentHistory, historyEntry];

        // 3. Perform Update
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "work_orders",
            filters: { _id: realId },
            update: {
                "$set": {
                    ...fieldsToUpdate,
                    updatedAt: new Date().toISOString(),
                    updatedBy: session ? { id: session.sub, name: session.name } : undefined,
                    history: newHistory
                }
            }
        };

        const response = await apiClient.put('/api/v2/cosmosdb/items', payload);

        // 4. CASCADE UPDATE TO CHILDREN (If Parent)
        // Only trigger cascade if this is explicitly a Batch Parent and has a valid ID
        if (updateData.status && updateData.status !== existingItem.status && existingItem.isBatchParent && existingItem.id) {
            // Find children
            const childQuery = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                filters: { parentWorkOrderId: existingItem.id }
            };
            const childRes = await apiClient.post('/api/v2/cosmosdb/query-items', childQuery);
            const children = (childRes.data && Array.isArray(childRes.data)) ? childRes.data
                : (childRes.data?.items) ? childRes.data.items : [];

            if (children.length > 0) {
                const childPromises = children.map(async (child: any) => {
                    const childHistory = child.history || [];
                    const childEntry = {
                        action: "parent_update",
                        details: `Parent Status changed to ${updateData.status}`,
                        date: new Date().toISOString(),
                        userId: session?.sub || "system",
                        userName: session?.name || "System"
                    };

                    // Update child
                    return apiClient.put('/api/v2/cosmosdb/items', {
                        db_name: "andechser_maintenance_system",
                        coll_name: "work_orders",
                        filters: { _id: child._id },
                        update: {
                            "$set": {
                                status: updateData.status,
                                updatedAt: new Date().toISOString(),
                                history: [...childHistory, childEntry]
                            }
                        }
                    });
                });
                await Promise.all(childPromises);
            }
        }

        // 5. CASCADE UPDATE TO PARENT (If Child)
        // Rule: If child status -> In Progress, and Parent is Open, set Parent to In Progress.
        if (updateData.status === "In Progress" && existingItem.parentWorkOrderId) {
            const parentQuery = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                filters: { id: existingItem.parentWorkOrderId }
            };
            const parentRes = await apiClient.post('/api/v2/cosmosdb/query-items', parentQuery);
            const parent = (parentRes.data && Array.isArray(parentRes.data) && parentRes.data.length > 0) ? parentRes.data[0]
                : (parentRes.data?.items && parentRes.data.items.length > 0) ? parentRes.data.items[0] : null;

            if (parent && parent.status === "Open") {
                const parentHistory = parent.history || [];
                const parentEntry = {
                    action: "child_update",
                    details: `Auto-updated to In Progress because child work order ${existingItem.title || existingItem.id} started.`,
                    date: new Date().toISOString(),
                    userId: session?.sub || "system",
                    userName: session?.name || "System"
                };

                await apiClient.put('/api/v2/cosmosdb/items', {
                    db_name: "andechser_maintenance_system",
                    coll_name: "work_orders",
                    filters: { _id: parent._id },
                    update: {
                        "$set": {
                            status: "In Progress",
                            updatedAt: new Date().toISOString(),
                            history: [...parentHistory, parentEntry]
                        }
                    }
                });
            }
        }

        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error("Error updating work order:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update work order" },
            { status: error.response?.status || 500 }
        );
    }
}



export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Work Order ID is required" }, { status: 400 });
        }

        // 1. Identify valid ID (logical vs _id)
        let targetId = id;
        let logicalId = null;

        const payloadCheck = {
            db_name: "andechser_maintenance_system",
            coll_name: "work_orders",
            filters: { id: id },
            limit: 1
        };
        const checkRes = await apiClient.post('/api/v2/cosmosdb/query-items', payloadCheck);
        const item = (checkRes.data && Array.isArray(checkRes.data)) ? checkRes.data[0]
            : (checkRes.data?.items && checkRes.data.items.length > 0) ? checkRes.data.items[0] : null;

        if (item) {
            targetId = item._id;
            logicalId = item.id;
        } else {
            // Fallback: Check if it was passed AS _id
            const payloadIdCheck = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                filters: { _id: id }
            }
            const checkRes2 = await apiClient.post('/api/v2/cosmosdb/query-items', payloadIdCheck);
            const item2 = (checkRes2.data && Array.isArray(checkRes2.data)) ? checkRes2.data[0]
                : (checkRes2.data?.items && checkRes2.data.items.length > 0) ? checkRes2.data.items[0] : null;
            if (item2) {
                targetId = item2._id;
                logicalId = item2.id;
            }
        }

        // 2. Cascade Delete: Check if this is a parent or has children
        if (logicalId) {
            // Find children: work orders where parentWorkOrderId == logicalId
            const childCheckPayload = {
                db_name: "andechser_maintenance_system",
                coll_name: "work_orders",
                filters: { parentWorkOrderId: logicalId }
            };
            const childRes = await apiClient.post('/api/v2/cosmosdb/query-items', childCheckPayload);
            const children = (childRes.data && Array.isArray(childRes.data)) ? childRes.data
                : (childRes.data?.items) ? childRes.data.items : [];

            if (children.length > 0) {
                // Delete all children
                const deletePromises = children.map((child: any) => {
                    return apiClient.delete('/api/v2/cosmosdb/items', {
                        data: {
                            db_name: "andechser_maintenance_system",
                            coll_name: "work_orders",
                            filters: { _id: child._id }
                        }
                    });
                });
                await Promise.all(deletePromises);
            }
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "work_orders",
            filters: {
                _id: targetId
            }
        };

        const response = await apiClient.delete('/api/v2/cosmosdb/items', { data: payload });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting work order:", error.response.data);
        return NextResponse.json(
            { error: error.response.data || "Failed to delete work order" },
            { status: error.response?.status || 500 }
        );
    }
}

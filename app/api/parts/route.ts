import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';
import { getSessionOrNull } from '@/auth/session';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const id = searchParams.get('id');

        const filters: any = {};
        if (id) filters.id = id;

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "parts",
            filters,
            limit: limit ? parseInt(limit) : 100,
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching parts:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch parts" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const session = await getSessionOrNull();

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "parts",
            item: {
                ...body,
                createdAt: new Date().toISOString(),
                createdBy: session ? { id: session.sub, name: session.name } : undefined
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating part:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create part" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const session = await getSessionOrNull();
        const { id, _id, ...data } = body;

        const targetId = id || _id;

        if (!targetId) {
            return NextResponse.json({ error: "Part ID is required" }, { status: 400 });
        }

        // Clean system fields just in case they slipped through
        const { _rid, _self, _etag, _attachments, _ts, ...cleanData } = data;

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "parts",
            filters: {
                _id: targetId
            },
            update: {
                "$set": {
                    ...cleanData,
                    updatedAt: new Date().toISOString(),
                    updatedBy: session ? { id: session.sub, name: session.name } : undefined
                }
            }
        };

        // Use PUT method and updated payload structure
        const response = await apiClient.put('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error updating part:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update part" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Part ID is required" }, { status: 400 });
        }

        // First, lookup the item to get its _id
        let targetId = id;

        const payloadCheck = {
            db_name: "andechser_maintenance_system",
            coll_name: "parts",
            filters: { id: id },
            limit: 1
        };
        const checkRes = await apiClient.post('/api/v2/cosmosdb/query-items', payloadCheck);
        const item = (checkRes.data && Array.isArray(checkRes.data)) ? checkRes.data[0]
            : (checkRes.data?.items && checkRes.data.items.length > 0) ? checkRes.data.items[0] : null;

        if (item && item._id) {
            targetId = item._id;
        } else {
            // Fallback: Check if it was passed AS _id
            const payloadIdCheck = {
                db_name: "andechser_maintenance_system",
                coll_name: "parts",
                filters: { _id: id }
            };
            const checkRes2 = await apiClient.post('/api/v2/cosmosdb/query-items', payloadIdCheck);
            const item2 = (checkRes2.data && Array.isArray(checkRes2.data)) ? checkRes2.data[0]
                : (checkRes2.data?.items && checkRes2.data.items.length > 0) ? checkRes2.data.items[0] : null;
            if (item2) {
                targetId = item2._id;
            }
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "parts",
            filters: {
                _id: targetId
            }
        };

        const response = await apiClient.delete('/api/v2/cosmosdb/items', { data: payload });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting part:", error.response?.data || error);
        return NextResponse.json(
            { error: error.response?.data || error.message || "Failed to delete part" },
            { status: error.response?.status || 500 }
        );
    }
}

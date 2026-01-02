import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';
import { getSessionOrNull } from '@/auth/session';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const blockId = searchParams.get('block_id');
        const limit = searchParams.get('limit');
        const id = searchParams.get('id');

        const filters: any = {};
        if (id) filters._id = id;

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "vendors",
            filters: filters,
            limit: limit ? parseInt(limit) : 50,
            block_id: blockId || undefined
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching vendors:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch vendors" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const vendorData = await request.json();
        const session = await getSessionOrNull();

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "vendors",
            item: {
                ...vendorData,
                createdAt: new Date().toISOString(),
                createdBy: session ? { id: session.sub, name: session.name } : undefined
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating vendor:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create vendor" },
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
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "vendors",
            filters: {
                _id: id
            },
            update: {
                "$set": {
                    ...updateData,
                    updatedAt: new Date().toISOString(),
                    updatedBy: session ? { id: session.sub, name: session.name } : undefined
                }
            }
        };

        const response = await apiClient.put('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error updating vendor:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update vendor" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "vendors",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.delete('/api/v2/cosmosdb/items', { data: payload });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting vendor:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete vendor" },
            { status: error.response?.status || 500 }
        );
    }
}

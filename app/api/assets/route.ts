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
            coll_name: "assets",
            filters: filters,
            limit: limit ? parseInt(limit) : 50,
            block_id: blockId || undefined
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching assets:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch assets" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const assetData = await request.json();
        const session = await getSessionOrNull();

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "assets",
            item: {
                ...assetData,
                createdAt: new Date().toISOString(),
                createdBy: session ? { id: session.sub, name: session.name } : undefined
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating asset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create asset" },
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
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "assets",
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
        console.error("Error updating asset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update asset" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "assets",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.delete('/api/v2/cosmosdb/items', { data: payload });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting asset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete asset" },
            { status: error.response?.status || 500 }
        );
    }
}

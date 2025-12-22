import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const blockId = searchParams.get('block_id');

        const limit = searchParams.get('limit');

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "assets",
            filters: {},
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

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "assets",
            item: assetData
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
                "$set": updateData
            }
        };

        const response = await apiClient.put('/api/v2/cosmosdb/items', payload);
        console.log("API Response:", response.data);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error updating asset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update asset" },
            { status: error.response?.status || 500 }
        );
    }
}

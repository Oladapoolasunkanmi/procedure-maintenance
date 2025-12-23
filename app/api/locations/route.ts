import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const blockId = searchParams.get('block_id');
        const limit = searchParams.get('limit');

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "locations",
            filters: {},
            limit: limit ? parseInt(limit) : 50,
            block_id: blockId || undefined
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching locations:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch locations" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const locationData = await request.json();

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "locations",
            item: locationData
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating location:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create location" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Location ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "locations",
            filters: {
                _id: id
            },
            update: {
                "$set": updateData
            }
        };

        const response = await apiClient.put('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error updating location:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update location" },
            { status: error.response?.status || 500 }
        );
    }
}

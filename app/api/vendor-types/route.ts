import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';
import { getSessionOrNull } from '@/auth/session';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');

        // Fetch from vendor_types collection
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "vendor_types",
            filters: {}, // Fetch all
            limit: limit ? parseInt(limit) : 1000,
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching vendor types:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch vendor types" },
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
            coll_name: "vendor_types",
            item: {
                ...body,
                name: body.name, // Ensure name is passed
                createdAt: new Date().toISOString(),
                createdBy: session ? { id: session.sub, name: session.name } : undefined
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating vendor type:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create vendor type" },
            { status: error.response?.status || 500 }
        );
    }
}

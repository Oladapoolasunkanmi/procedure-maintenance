import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';
import { getSessionOrNull } from '@/auth/session';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const id = searchParams.get('id');

        const filters: any = {};
        if (id) filters._id = id;

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "procedures",
            filters: filters,
            limit: limit ? parseInt(limit) : 100,
        };

        const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching procedures:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch procedures" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const procedureData = await request.json();
        const session = await getSessionOrNull();

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "procedures",
            item: {
                ...procedureData,
                createdAt: new Date().toISOString(),
                createdBy: session ? { id: session.sub, name: session.name } : undefined
            }
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating procedure:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create procedure" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, _id, ...updateData } = body;
        const session = await getSessionOrNull();

        if (!id) {
            return NextResponse.json({ error: "Procedure ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "procedures",
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
        console.error("Error updating procedure:", error.response);
        return NextResponse.json(
            { error: error.response.data || "Failed to update procedure" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Procedure ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "procedures",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.delete('/api/v2/cosmosdb/items', { data: payload });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting procedure:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete procedure" },
            { status: error.response?.status || 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Fetch single item
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "teams",
                filters: {
                    "_id": id
                }
            };
            const response = await apiClient.post('/api/v2/cosmosdb/get-item', payload);
            return NextResponse.json(response.data);
        } else {
            // Fetch list
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "teams",
                filters: {},
                limit: 100
            };
            const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
            return NextResponse.json(response.data);
        }

    } catch (error: any) {
        console.error("Error fetching teams:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch teams" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const teamData = await request.json();

        // Construct the payload for Cosmos DB
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "teams",
            item: teamData
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating team:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create team" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "teams",
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
        console.error("Error updating team:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update team" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "teams",
            filters: {
                _id: id
            }
        };

        // Note: DELETE requests often don't support body in strict HTTP compliant proxies/clients, 
        // but Axios usually handles it or we can use a custom request. 
        // However, the upstream API seems to expect a payload.
        // If the upstream is our own proxy wrapper, we just call it.
        // Assuming apiClient.delete with data option works.
        const response = await apiClient.delete('/api/v2/cosmosdb/items', {
            data: payload
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting team:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete team" },
            { status: error.response?.status || 500 }
        );
    }
}

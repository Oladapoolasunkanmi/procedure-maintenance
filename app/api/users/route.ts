import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const email = searchParams.get('email');

        if (id) {
            // Fetch single item by ID
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "users",
                filters: {
                    "_id": id
                }
            };
            const response = await apiClient.post('/api/v2/cosmosdb/get-item', payload);
            return NextResponse.json(response.data);
        } else if (email) {
            // Fetch single item by Email
            // We use query-items to find by email
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "users",
                filters: {
                    "email": email
                }
            };
            const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
            // Return first item or null? query-items returns { items: [...] }
            return NextResponse.json(response.data);
        } else {
            // Fetch list
            const payload = {
                db_name: "andechser_maintenance_system",
                coll_name: "users",
                filters: {},
                limit: 1000
            };
            const response = await apiClient.post('/api/v2/cosmosdb/query-items', payload);
            return NextResponse.json(response.data);
        }

    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch users" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const userData = await request.json();

        // Construct the payload for Cosmos DB
        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "users",
            item: userData
        };

        const response = await apiClient.post('/api/v2/cosmosdb/items', payload);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create user" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "users",
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
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update user" },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const payload = {
            db_name: "andechser_maintenance_system",
            coll_name: "users",
            filters: {
                _id: id
            }
        };

        const response = await apiClient.delete('/api/v2/cosmosdb/items', {
            data: payload
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete user" },
            { status: error.response?.status || 500 }
        );
    }
}

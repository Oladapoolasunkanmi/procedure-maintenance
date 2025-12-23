import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        // We need to pass the FormData to the external API.
        // axios automatically sets the Content-Type to multipart/form-data when passing FormData,
        // and calculates the boundary. However, since we are in Node environment (Next.js server),
        // we might need to be careful.

        // apiClient has default Content-Type: application/json, so we must override it.
        // Sending the formData object directly usually works with axios in Node if it's the standard FormData (Undici in Node 18+).

        const response = await apiClient.post('/api/v2/blob-storage/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error uploading file:", error);
        // Log detailed error from axios if available
        if (error.response) {
            console.error("Axios error response:", error.response.data);
            return NextResponse.json(
                { error: error.response.data || "Failed to upload file" },
                { status: error.response.status }
            );
        }
        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
        return new NextResponse("Path is required", { status: 400 });
    }

    try {
        // We need to fetch the image as a stream or arraybuffer
        const response = await apiClient.get('/api/v2/blob-storage/download', {
            params: { path },
            responseType: 'arraybuffer' // Important for binary data
        });

        // Determine content type (fallback to octet-stream)
        const contentType = response.headers['content-type'] || 'application/octet-stream';

        return new NextResponse(response.data, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

    } catch (error: any) {
        console.error("Error fetching image:", error);
        return new NextResponse("Failed to fetch image", { status: error.response?.status || 500 });
    }
}

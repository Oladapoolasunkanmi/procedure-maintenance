import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/auth/config";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "Not authenticated with Graph" }, { status: 401 });
    }

    let graphUrl = "https://graph.microsoft.com/v1.0/users";

    // Build filter string
    // Graph API $filter with startswith can be case-sensitive depending on property.
    // But typically displayName is okay.
    // If query is provided:
    if (query) {
        // We check displayName and mail.
        // Note: simple OR with startswith might be sufficient.
        graphUrl += `?$filter=startswith(displayName,'${query}') or startswith(mail,'${query}') or startswith(userPrincipalName,'${query}')`;
        graphUrl += `&$select=id,displayName,mail,userPrincipalName,jobTitle&$top=10`;
    } else {
        graphUrl += `?$select=id,displayName,mail,userPrincipalName,jobTitle&$top=10`;
    }

    try {
        const res = await fetch(graphUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "ConsistencyLevel": "eventual"
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Graph API Error:", errText);
            return NextResponse.json({ error: "Failed to fetch users from Graph", details: errText }, { status: res.status });
        }

        const data = await res.json();

        const mappedUsers = data.value.map((u: any) => ({
            id: u.id,
            name: u.displayName,
            email: u.mail || u.userPrincipalName,
            role: "Requester Only"
        }));

        return NextResponse.json({ items: mappedUsers });
    } catch (error: any) {
        console.error("Graph execute error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

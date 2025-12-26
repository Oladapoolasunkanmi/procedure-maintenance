
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/auth/config";

export async function GET(request: Request) {
    const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsEnv.split(',').map(e => e.trim()).filter(Boolean);

    if (adminEmails.length === 0) {
        return NextResponse.json({ items: [] });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        // Fallback or error? If we can't query graph, we can't get names.
        // We could return just emails?
        // User said "get the name of the microsoft user".
        return NextResponse.json({ error: "Not authenticated with Graph" }, { status: 401 });
    }

    const admins: any[] = [];

    // Parallel fetch for each email
    // Limit concurrency if needed, but for a few admins, Promise.all is fine.
    const fetchPromises = adminEmails.map(async (email) => {
        try {
            // Encode email? Graph handles it.
            // Filter by mail or userPrincipalName
            const graphUrl = `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${email}' or userPrincipalName eq '${email}'&$select=id,displayName,mail,userPrincipalName,jobTitle`;

            const res = await fetch(graphUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "ConsistencyLevel": "eventual"
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.value && data.value.length > 0) {
                    const u = data.value[0];
                    return {
                        id: u.id,
                        name: u.displayName,
                        email: u.mail || u.userPrincipalName,
                        role: "Team Administrator", // Global admin
                        avatar: "", // could fetch photo?
                        isAdmin: true
                    };
                }
            }
            return null;
        } catch (e) {
            console.error(`Failed to fetch admin ${email}`, e);
            return null;
        }
    });

    const results = await Promise.all(fetchPromises);
    const foundAdmins = results.filter(Boolean);

    return NextResponse.json({ items: foundAdmins });
}

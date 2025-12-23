import { NextResponse } from "next/server";
import { getSessionOrNull } from "@/auth/session";

export async function GET() {
    const session = await getSessionOrNull();
    if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(session);
}

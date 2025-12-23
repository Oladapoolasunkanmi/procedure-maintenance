import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, LOGIN_PATH } from "./config";
import { verifyIdToken } from "./tokens";

export type AuthSession = {
    sub: string;
    name?: string;
    preferred_username?: string;
    email?: string;
};

async function parseToken(idToken: string | undefined): Promise<AuthSession | null> {
    if (!idToken) return null;
    try {
        const payload = await verifyIdToken(idToken);
        return {
            sub: String(payload.sub),
            name: typeof payload.name === "string" ? payload.name : undefined,
            preferred_username: typeof (payload as Record<string, unknown>).preferred_username === "string" ? (payload as Record<string, unknown>).preferred_username as string : undefined,
            email: typeof payload.email === "string" ? payload.email : undefined,
        };
    } catch {
        return null;
    }
}

export async function getSessionOrNull(): Promise<AuthSession | null> {
    const cookieStore = await cookies();
    const idToken = cookieStore.get(AUTH_COOKIE)?.value;
    return parseToken(idToken);
}

export async function requireSession(): Promise<AuthSession> {
    const session = await getSessionOrNull();
    if (!session) {
        redirect(LOGIN_PATH);
    }
    return session;
}

export async function readSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
    const idToken = request.cookies.get(AUTH_COOKIE)?.value;
    return parseToken(idToken);
}

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, buildLoginRedirect, isPublicPath } from "./config";

import { verifyIdToken } from "./tokens";



export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const normalizedPath = pathname;

    if (normalizedPath.startsWith("/api")) {
        return NextResponse.next();
    }

    if (isPublicPath(normalizedPath)) {
        return NextResponse.next();
    }

    const idToken = request.cookies.get(AUTH_COOKIE)?.value;
    if (!idToken) {
        return NextResponse.redirect(buildLoginRedirect(request));
    }

    try {
        await verifyIdToken(idToken);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(buildLoginRedirect(request));
    }
}

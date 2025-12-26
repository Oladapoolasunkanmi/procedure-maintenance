import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, ACCESS_TOKEN_COOKIE } from "../config";
import { getMsalApp, getMsalRedirectUri, getMsalScopes } from "../msal";

export async function handleCallback(request: NextRequest): Promise<NextResponse> {
    const url = request.nextUrl;
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const tokenResult = await getMsalApp().acquireTokenByCode({
        code,
        redirectUri: getMsalRedirectUri(),
        scopes: getMsalScopes(),
    });

    const idToken = tokenResult?.idToken;
    const accessToken = tokenResult?.accessToken;
    const expiresOn = tokenResult?.expiresOn;

    if (!idToken || !accessToken || !expiresOn) {
        return NextResponse.json({ error: "Failed to acquire token" }, { status: 401 });
    }

    // ... (rest of redirection logic)

    let redirectTo = "/";
    let isPopup = false;
    if (stateRaw) {
        try {
            const parsed = JSON.parse(stateRaw);
            if (typeof parsed?.returnTo === "string") redirectTo = parsed.returnTo;
            if (parsed?.popup === true) isPopup = true;
        } catch {
            redirectTo = stateRaw;
        }
    }

    const redirectUrl = (() => {
        try {
            return new URL(redirectTo, request.nextUrl.origin);
        } catch {
            return new URL("/", request.nextUrl.origin);
        }
    })();

    const response = isPopup
        ? new NextResponse(`<!doctype html><html><body><script>try{window.opener&&window.opener.postMessage({type:'msal-auth-complete'},'*');window.close();}catch(e){}</script></body></html>`, {
            headers: { "content-type": "text/html" },
        })
        : NextResponse.redirect(redirectUrl);

    response.cookies.set(AUTH_COOKIE, idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresOn,
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresOn,
    });

    return response;
}

import { NextRequest, NextResponse } from "next/server";
import { getMsalApp, getMsalRedirectUri, getMsalScopes } from "../msal";

export async function handleLogin(request: NextRequest): Promise<NextResponse> {
    const nextUrl = request.nextUrl;
    const returnTo = nextUrl.searchParams.get("next") || "/";
    const isPopup = nextUrl.searchParams.get("popup") === "1";

    const authCodeUrl = await getMsalApp().getAuthCodeUrl({
        scopes: getMsalScopes(),
        redirectUri: getMsalRedirectUri(),
        state: JSON.stringify({ returnTo, popup: isPopup }),
        prompt: "select_account",
    });

    return NextResponse.redirect(authCodeUrl);
}

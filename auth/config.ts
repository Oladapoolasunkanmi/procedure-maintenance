import { NextRequest } from "next/server";

export const AUTH_COOKIE = "id_token";
export const ACCESS_TOKEN_COOKIE = "access_token";
export const LOGIN_PATH = "/login";
export const LOGOUT_PATH = "/api/auth/logout";

const PUBLIC_PATHS = new Set<string>(["/", "/api", "/login"]);
const PUBLIC_PREFIXES = ["/api/", "/_next", "/favicon.ico"];
const FILE_EXTENSION_REGEX = /\.[^/]+$/;

export function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PATHS.has(pathname)) return true;
    if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
    return FILE_EXTENSION_REGEX.test(pathname);
}

export function buildReturnTo(request: NextRequest): string {
    const { pathname, search } = request.nextUrl;
    return `${pathname}${search || ""}`;
}

export function buildLoginRedirect(request: NextRequest): URL {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", buildReturnTo(request));
    return loginUrl;
}

export function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export function getOptionalEnv(name: string): string | undefined {
    const value = process.env[name];
    return value && value.length > 0 ? value : undefined;
}

export function getAzureTenantId(): string {
    const tenantId = getOptionalEnv("AZURE_AD_TENANT_ID");
    if (tenantId) {
        return tenantId;
    }

    const authority = getOptionalEnv("AZURE_AD_AUTHORITY");
    if (authority) {
        try {
            const { pathname } = new URL(authority);
            const parts = pathname.split("/").filter(Boolean);
            if (parts[0]) {
                return parts[0];
            }
        } catch {
            // ignore parsing errors and fall through to throw below
        }
    }

    throw new Error("Set AZURE_AD_TENANT_ID or provide an AZURE_AD_AUTHORITY that includes the tenant segment.");
}

export function getAzureAuthority(): string {
    const tenantId = getOptionalEnv("AZURE_AD_TENANT_ID");
    const authority = getOptionalEnv("AZURE_AD_AUTHORITY") || (tenantId ? `https://login.microsoftonline.com/${tenantId}` : undefined);
    if (!authority) {
        throw new Error("Missing Azure authority configuration. Set AZURE_AD_AUTHORITY or AZURE_AD_TENANT_ID.");
    }
    return authority;
}

export function getAzureClientId(): string {
    return getRequiredEnv("AZURE_AD_CLIENT_ID");
}

export function getAzureClientSecret(): string {
    return getRequiredEnv("AZURE_AD_CLIENT_SECRET");
}

export function getConfiguredAzureScopes(): string[] {
    const raw = getOptionalEnv("AZURE_AD_SCOPES") || "";
    const scopes = raw
        .split(/[ ,]+/)
        .map((scope) => scope.trim())
        .filter(Boolean);
    const baseScopes = ["openid", "profile", "offline_access", "User.ReadBasic.All"];
    return Array.from(new Set([...baseScopes, ...scopes]));
}

export function getPostLogoutRedirect(request: NextRequest): string {
    const fromEnv = getOptionalEnv("AZURE_AD_POST_LOGOUT_REDIRECT_URI");
    if (fromEnv) return fromEnv;

    const isCodespace = getOptionalEnv("CODESPACES") === "true";
    if (isCodespace) {
        const codespaceName = getOptionalEnv("CODESPACE_NAME");
        const forwardingDomain = getOptionalEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN");
        const port = getOptionalEnv("PORT") || "3000";
        if (codespaceName && forwardingDomain) {
            return `https://${codespaceName}-${port}.${forwardingDomain}/`;
        }
    }

    return `${request.nextUrl.origin}/`;
}

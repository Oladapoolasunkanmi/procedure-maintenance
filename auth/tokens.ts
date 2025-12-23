import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";
import { getAzureAuthority, getAzureClientId } from "./config";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
    if (jwks) return jwks;
    const authority = normalizeAuthority(getAzureAuthority());
    const jwksUrl = new URL(`${authority.base}/discovery/v2.0/keys`);
    jwks = createRemoteJWKSet(jwksUrl);
    return jwks;
}

export async function verifyIdToken(idToken: string): Promise<JWTPayload> {
    const audience = getAzureClientId();
    const authority = normalizeAuthority(getAzureAuthority());
    const { payload } = await jwtVerify(idToken, getJwks(), { audience, issuer: authority.issuer });
    return payload;
}

function normalizeAuthority(authority: string): { base: string; issuer: string } {
    const trimmed = authority.replace(/\/+$/, "");
    const hasVersion = trimmed.endsWith("/v2.0");
    const base = hasVersion ? trimmed.slice(0, -"/v2.0".length) : trimmed;
    const issuer = hasVersion ? trimmed : `${trimmed}/v2.0`;
    return { base, issuer };
}

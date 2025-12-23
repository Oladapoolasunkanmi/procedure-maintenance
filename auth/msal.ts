import { ConfidentialClientApplication, Configuration, LogLevel } from "@azure/msal-node";
import {
    getAzureAuthority,
    getAzureClientId,
    getAzureClientSecret,
    getConfiguredAzureScopes,
    getOptionalEnv,
} from "./config";

let cachedMsalApp: ConfidentialClientApplication | null = null;

export function getMsalApp(): ConfidentialClientApplication {
    if (!cachedMsalApp) {
        const msalConfig: Configuration = {
            auth: {
                clientId: getAzureClientId(),
                clientSecret: getAzureClientSecret(),
                authority: getAzureAuthority(),
            },
            system: {
                loggerOptions: {
                    logLevel: LogLevel.Warning,
                    piiLoggingEnabled: false,
                },
            },
        };

        cachedMsalApp = new ConfidentialClientApplication(msalConfig);
    }

    return cachedMsalApp;
}

export function getMsalRedirectUri(): string {
    const fromEnv = getOptionalEnv("AZURE_AD_REDIRECT_URI");
    if (fromEnv) return fromEnv;

    const isCodespace = getOptionalEnv("CODESPACES") === "true";
    if (isCodespace) {
        const codespaceName = getOptionalEnv("CODESPACE_NAME");
        const forwardingDomain = getOptionalEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN");
        if (codespaceName && forwardingDomain) {
            return `https://${codespaceName}-3000.${forwardingDomain}/api/auth/callback`;
        }
    }

    return "http://localhost:3000/api/auth/callback";
}

export function getMsalScopes(): string[] {
    return getConfiguredAzureScopes();
}

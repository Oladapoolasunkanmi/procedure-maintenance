import createMiddleware from "next-intl/middleware";
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from "./i18n/config";

export default createMiddleware({
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    localePrefix: "always",
    localeDetection: false,
});

export const config = {
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};

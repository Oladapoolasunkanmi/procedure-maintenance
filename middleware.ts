import { proxy } from "@/auth/proxy";

export default proxy;

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (if any)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};

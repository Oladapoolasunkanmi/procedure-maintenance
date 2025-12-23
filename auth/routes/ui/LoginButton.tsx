"use client";
import { useEffect, useRef } from "react";


type LoginButtonProps = {
    children?: React.ReactNode;
};

export default function LoginButton({ children }: LoginButtonProps) {
    const popupRef = useRef<Window | null>(null);


    useEffect(() => {
        function onMessage(event: MessageEvent) {
            if (typeof event.data === "object" && event.data && (event.data as { type?: string }).type === "msal-auth-complete") {
                try {
                    popupRef.current?.close();
                } catch {
                    // ignore popup closing failures
                }
                window.location.reload();
            }
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    function openPopup() {
        const width = 500;
        const height = 650;
        const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
        const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,location=no,menubar=no`;
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`);
        popupRef.current = window.open(`/api/auth/login?popup=1&next=${next}`, "msal_login", features);
    }

    return (
        <button
            onClick={openPopup}
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary-weak text-neutral-900 hover:bg-primary-weak/80 focus:outline-none focus:ring-2 focus:ring-ring"
        >
            {children ?? "Sign in"}
        </button>
    );
}

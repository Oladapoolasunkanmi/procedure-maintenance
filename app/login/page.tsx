"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Wrench } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function LoginContent() {
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/";

    const handleLogin = () => {
        window.location.assign(`/api/auth/login?next=${encodeURIComponent(next)}`);
    };

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] h-screen">
            <div className="hidden bg-muted lg:block relative h-full">
                {/* Background Pattern/Gradient */}
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-10 flex flex-col justify-between h-full p-10 text-white">
                    <div className="flex items-center text-lg font-medium">
                        <Wrench className="mr-2 h-6 w-6" />
                        OpsCMMS
                    </div>
                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-3xl font-bold tracking-tight">
                            Streamline your maintenance operations with intelligence.
                        </h2>
                        <blockquote className="space-y-2">
                            <p className="text-lg opacity-90">
                                &ldquo;This platform has completely transformed how we manage our assets and work orders. The efficiency gains are remarkable.&rdquo;
                            </p>
                            <footer className="text-sm font-medium opacity-75">Sofia Davis, Head of Maintenance</footer>
                        </blockquote>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center py-12 px-6">
                <div className="mx-auto grid w-full max-w-[350px] gap-6">
                    <div className="grid gap-2 text-left">
                        <h1 className="text-3xl font-bold">Welcome back</h1>
                        <p className="text-balance text-muted-foreground">
                            Sign in to your account to continue
                        </p>
                    </div>
                    <div className="grid gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span>Secure Enterprise SSO Enabled</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleLogin}
                            className="w-full h-11"
                            size="lg"
                        >
                            Sign in with Microsoft Entra ID
                        </Button>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="#" className="underline underline-offset-4 hover:text-primary">
                            Contact your administrator
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}

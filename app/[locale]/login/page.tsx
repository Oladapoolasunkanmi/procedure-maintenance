"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Wrench } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

import { useTranslations } from "next-intl";

function LoginContent() {
    const t = useTranslations('Login');
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
                            {t('tagline')}
                        </h2>
                        <blockquote className="space-y-2">
                            <p className="text-lg opacity-90">
                                &ldquo;{t('quote')}&rdquo;
                            </p>
                            <footer className="text-sm font-medium opacity-75">{t('quoteAuthor')}</footer>
                        </blockquote>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center py-12 px-6">
                <div className="mx-auto grid w-full max-w-[350px] gap-6">
                    <div className="grid gap-2 text-left">
                        <h1 className="text-3xl font-bold">{t('welcomeBack')}</h1>
                        <p className="text-balance text-muted-foreground">
                            {t('signInToContinue')}
                        </p>
                    </div>
                    <div className="grid gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span>{t('secureSSO')}</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleLogin}
                            className="w-full h-11"
                            size="lg"
                        >
                            {t('signInWithMicrosoft')}
                        </Button>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        {t('noAccount')} {" "}
                        <Link href="#" className="underline underline-offset-4 hover:text-primary">
                            {t('contactAdmin')}
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

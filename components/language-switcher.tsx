"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const toggleLanguage = () => {
        const nextLocale = locale === 'en' ? 'de' : 'en';
        startTransition(() => {
            const segments = pathname.split('/');
            segments[1] = nextLocale;
            const newPath = segments.join('/');
            router.replace(newPath);
        });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground px-2"
            onClick={toggleLanguage}
            disabled={isPending}
        >
            <Globe className="h-4 w-4 mr-2" />
            <span className="font-medium text-xs">{locale.toUpperCase()}</span>
            <span className="sr-only">Switch to {locale === 'en' ? 'German' : 'English'}</span>
        </Button>
    );
}

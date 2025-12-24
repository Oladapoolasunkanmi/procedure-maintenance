import { createNavigation } from 'next-intl/navigation';
import { LOCALES } from './config';

export const { Link, redirect, usePathname, useRouter } =
    createNavigation({ locales: LOCALES, localePrefix: 'always' });

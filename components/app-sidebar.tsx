"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
    Archive,
    BarChart3,
    BookOpen,
    Box,
    Building2,
    Calendar,
    ClipboardList,
    FileText,
    Gauge,
    LayoutDashboard,
    MapPin,
    MessageSquare,
    Package,
    Settings,
    ShoppingCart,
    Users,
    Wrench,
    LogOut,
    ChevronsUpDown,
    CreditCard,
    Sparkles,
    BadgeCheck,
    Bell
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"

// Menu items.
// Removed static arrays and interface to integrate inside component
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "./language-switcher"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user?: {
        name?: string;
        email?: string;
        image?: string;
    };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const t = useTranslations('Sidebar')

    const navMain = [
        {
            title: t('workOrders'),
            url: "/work-orders",
            icon: ClipboardList,
            isActive: true,
        },
        {
            title: t('assets'),
            url: "/assets",
            icon: Box,
        },
        {
            title: t('procedures'),
            url: "/procedures",
            icon: FileText,
        },
        {
            title: t('requests'),
            url: "/requests",
            icon: FileText,
        },
        {
            title: t('locations'),
            url: "/locations",
            icon: MapPin,
        },
        {
            title: t('teams'),
            url: "/teams",
            icon: Users,
        },
    ]

    const navSecondary: {
        title: string
        url: string
        icon: React.ElementType
    }[] = []

    return (
        <Sidebar collapsible="icon" {...props}>

            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                                    <Wrench className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">{t('title')}</span>
                                    <span className="">{t('version')}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navMain.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                                <Link href={item.url || "#"}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                <SidebarSeparator className="mx-2" />
                <SidebarMenu>
                    {navSecondary.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                                <Link href={item.url}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="p-2 flex justify-end gap-2">
                    <LanguageSwitcher />
                    <ModeToggle />
                </div>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user?.image || "https://github.com/shadcn.png"} alt={user?.name || "User"} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user?.name || t('user')}</span>
                                    <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side="bottom"
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user?.image || "https://github.com/shadcn.png"} alt={user?.name || "User"} />
                                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.name || t('user')}</span>
                                        <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Sparkles className="mr-2 size-4" />
                                    {t('upgrade')}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <BadgeCheck className="mr-2 size-4" />
                                    {t('account')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <CreditCard className="mr-2 size-4" />
                                    {t('billing')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell className="mr-2 size-4" />
                                    {t('notifications')}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <a href="/api/auth/logout">
                                <DropdownMenuItem>
                                    <LogOut className="mr-2 size-4" />
                                    {t('logout')}
                                </DropdownMenuItem>
                            </a>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

"use client"

import * as React from "react"
import Link from "next/link"
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
} from "lucide-react"

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
const navMain = [
    {
        title: "Work Orders",
        url: "/work-orders",
        icon: ClipboardList,
        isActive: true,
    },
    {
        title: "Purchase Orders",
        url: "/purchase-orders",
        icon: ShoppingCart,
    },
    {
        title: "Reporting",
        url: "/reporting",
        icon: BarChart3,
    },
    {
        title: "Requests",
        url: "/requests",
        icon: FileText,
    },
    {
        title: "Assets",
        url: "/assets",
        icon: Box,
    },
    {
        title: "Procedures",
        url: "/procedures",
        icon: FileText,
    },
    {
        title: "Messages",
        url: "/messages",
        icon: MessageSquare,
    },
]

const navSecondary = [
    {
        title: "Categories",
        url: "/categories",
        icon: Archive,
    },
    {
        title: "Parts Inventory",
        url: "/parts",
        icon: Package,
    },
    {
        title: "Library",
        url: "/library",
        icon: BookOpen,
    },
    {
        title: "Meters",
        url: "/meters",
        icon: Gauge,
    },
    {
        title: "Locations",
        url: "/locations",
        icon: MapPin,
    },
    {
        title: "Teams / Users",
        url: "/teams",
        icon: Users,
    },
    {
        title: "Vendors",
        url: "/vendors",
        icon: Building2,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                                    <span className="font-semibold">OpsCMMS</span>
                                    <span className="">v1.0.0</span>
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
                <div className="p-2 flex justify-end">
                    <ModeToggle />
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="#">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Zach Brown</span>
                                    <span className="truncate text-xs">zach@example.com</span>
                                </div>
                                <Settings className="ml-auto size-4" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

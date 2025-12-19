"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
    Box,
    Filter,
    MoreVertical,
    Plus,
    Search,
    MapPin,
    QrCode,
    FileText,
    History,
    Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

import { assets, locations, Asset } from "@/lib/data"
import { cn } from "@/lib/utils"

export function AssetsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const selectedAsset = React.useMemo(() => {
        return assets.find((a) => a.id === selectedId)
    }, [selectedId])

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("id", id)
        router.replace(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:flex-row">
            {/* List View */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", selectedId ? "hidden w-full md:flex md:w-1/3 lg:w-[400px]" : "w-full md:w-[800px]")}>
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
                    <Button asChild>
                        <Link href="/assets/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Asset
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search Assets" className="pl-8" />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <MapPin className="mr-2 h-3.5 w-3.5" />
                        Location
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Settings className="mr-2 h-3.5 w-3.5" />
                        Status
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 lg:px-3">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Filter
                    </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                    <div className="flex flex-col">
                        {assets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                selected={asset.id === selectedId}
                                onClick={() => handleSelect(asset.id)}
                            />
                        ))}
                        {assets.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No assets found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail View */}
            {selectedAsset ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <AssetDetail asset={selectedAsset} onClose={() => router.replace(pathname)} />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <Box className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">No Asset Selected</h3>
                        <p className="text-sm">Select an asset from the list to view details.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function AssetCard({ asset, selected, onClick }: { asset: Asset; selected: boolean; onClick: () => void }) {
    const location = locations.find((l) => l.id === asset.locationId)

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-center gap-4 border-b p-4 transition-all hover:bg-accent last:border-0",
                selected && "bg-accent"
            )}
        >
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {asset.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                ) : (
                    <Box className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{asset.name}</span>
                    <Badge variant={asset.status === "Online" ? "default" : "destructive"} className={cn("text-[10px] px-1.5 py-0 h-5", asset.status === "Online" ? "bg-green-500 hover:bg-green-600" : "")}>
                        {asset.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{location?.name || "Unknown Location"}</span>
                </div>
            </div>
        </div>
    )
}

function AssetDetail({ asset, onClose }: { asset: Asset; onClose: () => void }) {
    const location = locations.find((l) => l.id === asset.locationId)

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold line-clamp-1">{asset.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/assets/${asset.id}/edit`}>
                            Edit
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Print QR Code</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">
                    {/* Header Info */}
                    <div className="flex gap-4">
                        <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
                            {asset.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                            ) : (
                                <Box className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Badge variant={asset.status === "Online" ? "default" : "destructive"} className={cn(asset.status === "Online" ? "bg-green-500" : "")}>
                                    {asset.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">Updated today</span>
                            </div>
                            <h3 className="text-xl font-bold">{asset.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {location?.name}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <DetailItem label="Model" value={asset.model} />
                        <DetailItem label="Manufacturer" value={asset.manufacturer} />
                        <DetailItem label="Serial Number" value={asset.serialNumber} />
                        <DetailItem label="Criticality" value={asset.criticality} />
                        <DetailItem label="Purchase Date" value={asset.purchaseDate} />
                        <DetailItem label="Cost" value={asset.purchasePrice ? `$${asset.purchasePrice}` : undefined} />
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button className="flex-1">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Work Order
                        </Button>
                        <Button variant="outline" className="flex-1">
                            <QrCode className="mr-2 h-4 w-4" />
                            View QR Code
                        </Button>
                    </div>

                    <Separator />

                    {/* History / Tabs Placeholder */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <History className="h-4 w-4" />
                            History
                        </h4>
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            No history available.
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

function DetailItem({ label, value }: { label: string; value?: string | number }) {
    if (!value) return null
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    )
}

import { ArrowLeft } from "lucide-react"

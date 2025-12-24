"use client"

import * as React from "react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    MoreVertical,
    Plus,
    Search,
    User as UserIcon,
    MapPin,
    AlertCircle,
    Lock,
    PauseCircle,
    PlayCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

import { workOrders, assets, users, WorkOrder, Status, Priority } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function WorkOrdersClient() {
    const t = useTranslations('WorkOrders')
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const selectedId = searchParams.get("id")

    const [activeTab, setActiveTab] = React.useState("todo")

    const filteredWorkOrders = React.useMemo(() => {
        return workOrders.filter((wo) => {
            if (activeTab === "todo") {
                return wo.status !== "Done"
            } else {
                return wo.status === "Done"
            }
        })
    }, [activeTab])

    const selectedWorkOrder = React.useMemo(() => {
        return workOrders.find((wo) => wo.id === selectedId)
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
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <Button asChild>
                        <Link href="/work-orders/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('newWorkOrder')}
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t('searchPlaceholder')} className="pl-8" />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <UserIcon className="mr-2 h-3.5 w-3.5" />
                        {t('assignedTo')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        {t('dueDate')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <MapPin className="mr-2 h-3.5 w-3.5" />
                        {t('location')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                        <AlertCircle className="mr-2 h-3.5 w-3.5" />
                        {t('priority')}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 lg:px-3">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('addFilter')}
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="todo">{t('todo')}</TabsTrigger>
                        <TabsTrigger value="done">{t('done')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="todo" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-2 p-1">
                                {filteredWorkOrders.map((wo) => (
                                    <WorkOrderCard
                                        key={wo.id}
                                        workOrder={wo}
                                        selected={wo.id === selectedId}
                                        onClick={() => handleSelect(wo.id)}
                                    />
                                ))}
                                {filteredWorkOrders.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {t('noWorkOrders')}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="done" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-2 p-1">
                                {filteredWorkOrders.map((wo) => (
                                    <WorkOrderCard
                                        key={wo.id}
                                        workOrder={wo}
                                        selected={wo.id === selectedId}
                                        onClick={() => handleSelect(wo.id)}
                                    />
                                ))}
                                {filteredWorkOrders.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {t('noCompletedWorkOrders')}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Detail View */}
            {selectedWorkOrder ? (
                <div className={cn("flex-1 flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300", !selectedId && "hidden md:flex")}>
                    <WorkOrderDetail workOrder={selectedWorkOrder} onClose={() => router.replace(pathname)} />
                </div>
            ) : (
                <div className="hidden flex-1 items-center justify-center rounded-lg border border-dashed md:flex">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <ClipboardListIcon className="h-12 w-12 opacity-20" />
                        <h3 className="text-lg font-semibold">{t('noSelection')}</h3>
                        <p className="text-sm">{t('selectToView')}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function WorkOrderCard({ workOrder, selected, onClick }: { workOrder: WorkOrder; selected: boolean; onClick: () => void }) {
    const t = useTranslations('WorkOrders')
    const asset = assets.find((a) => a.id === workOrder.assetId)

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent",
                selected && "bg-accent border-primary"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-semibold line-clamp-1">{workOrder.title}</span>
                <Badge variant={getPriorityVariant(workOrder.priority)} className="shrink-0 text-[10px] px-1.5 py-0 h-5">
                    {t(`priorities.${workOrder.priority}` as any)}
                </Badge>
            </div>

            {asset && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                    {asset.name} • {asset.model}
                </div>
            )}

            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                    <StatusBadge status={workOrder.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                    {workOrder.id}
                </div>
            </div>
        </div>
    )
}

function WorkOrderDetail({ workOrder, onClose }: { workOrder: WorkOrder; onClose: () => void }) {
    const t = useTranslations('WorkOrders')
    const asset = assets.find((a) => a.id === workOrder.assetId)
    const assignee = users.find((u) => workOrder.assignedTo.includes(u.id))
    const [showChat, setShowChat] = React.useState(false)

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold line-clamp-1">{workOrder.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowChat(true)}>
                        <MessageSquareIcon className="mr-2 h-4 w-4" />
                        {t('comments')}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/work-orders/${encodeURIComponent(workOrder.id)}/edit`}>
                            {t('edit')}
                        </Link>
                    </Button>
                    <ChatInterface open={showChat} onOpenChange={setShowChat} title={`${t('comments')}: ${workOrder.title}`} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>{t('duplicate')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('print')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">{t('delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">
                    {/* Status Actions */}
                    <div className="grid grid-cols-4 gap-2">
                        <StatusActionButton status="Open" current={workOrder.status} icon={Lock} label={t('status.open')} color="bg-muted text-foreground" />
                        <StatusActionButton status="On Hold" current={workOrder.status} icon={PauseCircle} label={t('status.onHold')} color="bg-orange-500" />
                        <StatusActionButton status="In Progress" current={workOrder.status} icon={PlayCircle} label={t('status.inProgress')} color="bg-blue-500" />
                        <StatusActionButton status="Done" current={workOrder.status} icon={CheckCircle2} label={t('status.done')} color="bg-green-600" />
                    </div>

                    {/* Key Fields */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">{t('dueDate')}</span>
                            <span className="text-sm">{format(new Date(workOrder.dueDate), "MMM d, h:mm a")}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">{t('priority')}</span>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", getPriorityColor(workOrder.priority))} />
                                <span className="text-sm">{t(`priorities.${workOrder.priority}` as any)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">{t('workOrderId')}</span>
                            <span className="text-sm">{workOrder.id}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Assigned To */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{t('assignedTo')}</span>
                        <div className="flex items-center gap-2">
                            {assignee ? (
                                <>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assignee.avatar} />
                                        <AvatarFallback>{assignee.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{assignee.name}</span>
                                </>
                            ) : (
                                <span className="text-sm text-muted-foreground">{t('unassigned')}</span>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{t('description')}</span>
                        <p className="text-sm leading-relaxed">
                            {workOrder.description || t('noDescription')}
                        </p>
                    </div>

                    <Separator />

                    {/* Asset */}
                    {asset && (
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">{t('asset')}</span>
                            <div className="flex items-center gap-4 rounded-lg border p-3">
                                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                    <BoxIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{asset.name}</span>
                                    <span className="text-xs text-muted-foreground">{asset.model} • {asset.serialNumber}</span>
                                </div>
                                <Button variant="outline" size="sm" className="ml-auto">
                                    {t('viewProcedure')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

function StatusActionButton({ status, current, icon: Icon, label, color }: { status: Status; current: Status; icon: any; label: string; color: string }) {
    const isActive = status === current
    return (
        <Button
            variant={isActive ? "default" : "outline"}
            className={cn("flex flex-col h-auto py-2 gap-1", isActive ? color : "text-muted-foreground")}
        >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
        </Button>
    )
}

function StatusBadge({ status }: { status: Status }) {
    const t = useTranslations('WorkOrders')
    const variants: Record<Status, string> = {
        "Open": "text-blue-600 bg-blue-50 border-blue-200",
        "In Progress": "text-blue-600 bg-blue-50 border-blue-200",
        "On Hold": "text-orange-600 bg-orange-50 border-orange-200",
        "Done": "text-green-600 bg-green-50 border-green-200",
    }

    const icons: Record<Status, any> = {
        "Open": Lock,
        "In Progress": PlayCircle,
        "On Hold": PauseCircle,
        "Done": CheckCircle2,
    }

    const statusKeys: Record<Status, string> = {
        "Open": "open",
        "On Hold": "onHold",
        "In Progress": "inProgress",
        "Done": "done"
    }

    const Icon = icons[status]

    return (
        <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", variants[status])}>
            <Icon className="h-3 w-3" />
            {t(`status.${statusKeys[status]}` as any)}
        </div>
    )
}

function getPriorityVariant(priority: Priority) {
    switch (priority) {
        case "High": return "destructive"
        case "Medium": return "default" // Using default (primary) for medium
        case "Low": return "secondary"
        default: return "outline"
    }
}

function getPriorityColor(priority: Priority) {
    switch (priority) {
        case "High": return "bg-red-500"
        case "Medium": return "bg-orange-500"
        case "Low": return "bg-green-500"
        default: return "bg-gray-500"
    }
}

import { ArrowLeft, Box as BoxIcon, ClipboardList as ClipboardListIcon, MessageSquare as MessageSquareIcon } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"

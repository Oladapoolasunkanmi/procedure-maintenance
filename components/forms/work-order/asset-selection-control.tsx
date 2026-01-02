"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, FolderTree, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Asset {
    id: string
    _id?: string
    name: string
    status?: string
    parentAssetId?: string
}

interface Procedure {
    id: string
    _id?: string
    name: string
    description?: string
}

interface AssetSelectionControlProps {
    assets: Asset[]
    procedures: Procedure[]
    selectedAssetIds: string[]
    onAssetsChange: (ids: string[]) => void
    assignedProcedures: Record<string, string>
    onProceduresChange: (map: Record<string, string>) => void
}

type TreeNode = {
    id: string
    label: string
    status?: string
    children?: TreeNode[]
    original: Asset
}

const buildAssetTree = (items: Asset[]): TreeNode[] => {
    const map = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    const getId = (i: Asset) => i.id || i._id || ""

    // Initialize nodes
    items.forEach(item => {
        const id = getId(item)
        if (id) map.set(id, { id, label: item.name, status: item.status, children: [], original: item })
    })

    // Build hierarchy
    items.forEach(item => {
        const id = getId(item)
        if (!id) return
        const node = map.get(id)
        const parentId = item.parentAssetId
        if (parentId && map.has(parentId)) {
            map.get(parentId)!.children!.push(node!)
        } else {
            roots.push(node!)
        }
    })

    return roots
}

const getStatusBadgeStyles = (status?: string) => {
    switch (status?.toLowerCase()) {
        case 'online':
            return "bg-green-100 text-green-700 border-green-200"
        case 'offline':
            return "bg-red-100 text-red-700 border-red-200"
        case 'do not track':
            return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100/80"
        default:
            return "bg-gray-100 text-gray-700 border-gray-200"
    }
}

const getStatusColorDot = (status?: string) => {
    switch (status?.toLowerCase()) {
        case 'online': return "bg-green-500"
        case 'offline': return "bg-red-500"
        case 'do not track': return "bg-gray-500" // Changed to gray for 'do not track' or keep yellow? User said "warning yellow" earlier. Keeping yellow.
        default: return "bg-gray-500"
    }
}

// Override getStatusColorDot for 'do not track' to be yellow as requested previously
const getStatusColorDotFixed = (status?: string) => {
    switch (status?.toLowerCase()) {
        case 'online': return "bg-green-500"
        case 'offline': return "bg-red-500"
        case 'do not track': return "bg-yellow-500"
        default: return "bg-gray-500"
    }
}

export function AssetSelectionControl({
    assets,
    procedures,
    selectedAssetIds,
    onAssetsChange,
    assignedProcedures,
    onProceduresChange,
}: AssetSelectionControlProps) {
    const [isMultiDialogOpen, setIsMultiDialogOpen] = React.useState(false)
    const [isProcedureDialogOpen, setIsProcedureDialogOpen] = React.useState(false)
    const [currentAssetForProcedure, setCurrentAssetForProcedure] = React.useState<string | null>(null)
    const [multiSelectTempIds, setMultiSelectTempIds] = React.useState<string[]>([])
    const [useRunningProcedure, setUseRunningProcedure] = React.useState(false)

    // Single Select Popover State
    const [openSingle, setOpenSingle] = React.useState(false)

    // Tree State
    const [treeData, setTreeData] = React.useState<TreeNode[]>([])
    const [expandedNodes, setExpandedNodes] = React.useState<string[]>([])

    // Initialize Tree
    React.useEffect(() => {
        setTreeData(buildAssetTree(assets))
    }, [assets])

    const getId = (item: any) => item.id || item._id

    // Multi-Select Logic
    const openMultiSelect = () => {
        setMultiSelectTempIds([...selectedAssetIds])
        setIsMultiDialogOpen(true)
    }

    const toggleMultiSelectId = (id: string) => {
        setMultiSelectTempIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const confirmMultiSelect = () => {
        onAssetsChange(multiSelectTempIds)
        setIsMultiDialogOpen(false)
    }

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedNodes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    // Procedure Assignment Logic
    const openProcedureDialog = (assetId?: string) => {
        setCurrentAssetForProcedure(assetId || null)
        setUseRunningProcedure(false)
        setIsProcedureDialogOpen(true)
    }

    const assignProcedure = (procedureId: string) => {
        const newMap = { ...assignedProcedures }

        if (useRunningProcedure || !currentAssetForProcedure) {
            // Apply to all selected assets
            selectedAssetIds.forEach(id => {
                newMap[id] = procedureId
            })
        } else {
            // Apply to specific asset
            newMap[currentAssetForProcedure] = procedureId
        }

        onProceduresChange(newMap)
        setIsProcedureDialogOpen(false)
    }

    // Recursive Tree Renderer for CommandItems
    const renderTreeItems = (nodes: TreeNode[], level = 0, isMulti: boolean = false, tempIds: string[] = [], onSelect?: (id: string) => void) => {
        return nodes.map(node => (
            <React.Fragment key={node.id}>
                <CommandItem
                    value={node.label + " " + node.id} // Searchable text with ID to ensure uniqueness
                    onSelect={() => {
                        if (onSelect) onSelect(node.id)
                    }}
                    className={cn(
                        "flex items-center gap-2 py-2 cursor-pointer",
                        // Force orange selection style to matching theme
                        "aria-selected:bg-orange-50 aria-selected:text-orange-900 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-900"
                    )}
                    style={{ paddingLeft: `${(level * 16) + 12}px` }}
                >
                    {/* Expand/Collapse Icon */}
                    <div
                        onClick={(e) => {
                            if (node.children?.length) toggleExpand(node.id, e)
                        }}
                        className={cn(
                            "flex items-center justify-center w-4 h-4 rounded-sm hover:bg-muted/50 transition-colors",
                            node.children?.length ? "cursor-pointer" : "opacity-0 pointer-events-none"
                        )}
                    >
                        {expandedNodes.includes(node.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </div>

                    {/* Checkbox for Multi */}
                    {isMulti && (
                        <Checkbox
                            checked={tempIds.includes(node.id)}
                            onCheckedChange={() => onSelect && onSelect(node.id)}
                            className="mr-2 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                        />
                    )}

                    {/* Label */}
                    <span className="font-medium flex-1 truncate">{node.label}</span>

                    {/* Status Badge (Right aligned) */}
                    {node.status && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "ml-2 shrink-0 font-normal border rounded-full px-2.5 py-0.5 text-xs capitalize",
                                getStatusBadgeStyles(node.status)
                            )}
                        >
                            <div className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", getStatusColorDotFixed(node.status))} />
                            {node.status}
                        </Badge>
                    )}

                    {/* Check icon for Single Select */}
                    {!isMulti && selectedAssetIds.includes(node.id) && (
                        <Check className="ml-2 h-4 w-4 text-orange-600" />
                    )}
                </CommandItem>

                {/* Children */}
                {node.children && node.children.length > 0 && expandedNodes.includes(node.id) && (
                    renderTreeItems(node.children, level + 1, isMulti, tempIds, onSelect)
                )}
            </React.Fragment>
        ))
    }

    // --------------------------------------------------------------------------------
    // RENDER: Single Select View
    // --------------------------------------------------------------------------------
    if (selectedAssetIds.length <= 1) {
        const selectedAsset = selectedAssetIds.length === 1
            ? assets.find(a => getId(a) === selectedAssetIds[0])
            : null

        return (
            <div className="space-y-2">
                <Popover open={openSingle} onOpenChange={setOpenSingle}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSingle}
                            className="w-full justify-between bg-background text-left font-normal hover:bg-muted/50"
                        >
                            {selectedAsset ? (
                                <div className="flex items-center gap-2 flex-1 w-full overflow-hidden">
                                    <span className="truncate">{selectedAsset.name}</span>
                                    {selectedAsset.status && (
                                        <Badge variant="outline" className={cn(
                                            "ml-auto h-5 text-[10px] font-medium px-1.5 py-0 capitalize",
                                            getStatusBadgeStyles(selectedAsset.status)
                                        )}>
                                            <div className={cn("mr-1 h-1.5 w-1.5 rounded-full", getStatusColorDotFixed(selectedAsset.status))} />
                                            {selectedAsset.status}
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Start typing...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search assets..." />
                            <CommandList className="max-h-[300px]">
                                <CommandEmpty>No asset found.</CommandEmpty>
                                <CommandGroup>
                                    {renderTreeItems(treeData, 0, false, [], (id) => {
                                        onAssetsChange([id])
                                        setOpenSingle(false)
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <div
                    onClick={openMultiSelect}
                    className="flex items-center gap-1 text-sm text-orange-600 font-medium cursor-pointer hover:underline w-fit transition-colors hover:text-orange-700"
                >
                    + Add multiple assets
                </div>

                {/* Dialogs */}
                <MultiAssetDialog
                    open={isMultiDialogOpen}
                    onOpenChange={setIsMultiDialogOpen}
                    assets={assets}
                    tempIds={multiSelectTempIds}
                    onToggle={toggleMultiSelectId}
                    onConfirm={confirmMultiSelect}
                    getId={getId}
                    renderTreeItems={renderTreeItems} // Pass this down
                    treeData={treeData} // Pass treeData
                />
            </div>
        )
    }

    // --------------------------------------------------------------------------------
    // RENDER: Multi-Select Table View
    // --------------------------------------------------------------------------------
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Selected Assets ({selectedAssetIds.length})</h3>
                </div>
                <div
                    onClick={openMultiSelect}
                    className="flex items-center gap-1 text-sm text-orange-600 font-medium cursor-pointer hover:underline hover:text-orange-700"
                >
                    + Add Assets
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-background">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[40%]">Asset Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Procedure</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedAssetIds.map(id => {
                            const asset = assets.find(a => getId(a) === id)
                            const assignedProcId = assignedProcedures[id]
                            const assignedProc = procedures.find(p => getId(p) === assignedProcId)

                            if (!asset) return null

                            return (
                                <TableRow key={id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FolderTree className="h-4 w-4 text-orange-500" />
                                            {asset.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "font-normal border rounded-full px-2.5 py-0.5 text-xs capitalize",
                                            getStatusBadgeStyles(asset.status)
                                        )}>
                                            <div className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", getStatusColorDotFixed(asset.status))} />
                                            {asset.status || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {assignedProc ? (
                                            <div
                                                className="flex items-center gap-2 cursor-pointer group max-w-[250px]"
                                                onClick={() => openProcedureDialog(id)}
                                            >
                                                <span
                                                    className="text-sm font-medium group-hover:underline truncate block w-full"
                                                    title={assignedProc.name}
                                                >
                                                    {assignedProc.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                onClick={() => openProcedureDialog(id)}
                                                className="text-sm font-medium text-orange-600 cursor-pointer hover:underline"
                                            >
                                                Add procedure
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => onAssetsChange(selectedAssetIds.filter(i => i !== id))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <MultiAssetDialog
                open={isMultiDialogOpen}
                onOpenChange={setIsMultiDialogOpen}
                assets={assets}
                tempIds={multiSelectTempIds}
                onToggle={toggleMultiSelectId}
                onConfirm={confirmMultiSelect}
                getId={getId}
                renderTreeItems={renderTreeItems}
                treeData={treeData}
            />

            <Dialog open={isProcedureDialogOpen} onOpenChange={setIsProcedureDialogOpen}>
                <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col pl-0 pr-0 gap-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Add Procedure</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <Command className="h-full border-none shadow-none">
                            <CommandInput placeholder="Search Procedure Templates" className="border-none focus:ring-0 mx-4" />
                            <CommandList className="h-full max-h-full px-2">
                                <CommandEmpty>No procedure found.</CommandEmpty>
                                <CommandGroup heading="All Procedures">
                                    <ScrollArea className="h-full">
                                        {procedures.map(proc => (
                                            <CommandItem
                                                key={getId(proc)}
                                                value={proc.name + " " + (proc.description || "")} // Make searchable by desc too
                                                onSelect={() => assignProcedure(getId(proc))}
                                                className="cursor-pointer py-3 px-4 aria-selected:bg-orange-50 data-[selected=true]:bg-orange-50"
                                            >
                                                <div className="flex flex-col gap-1 items-start w-full">
                                                    <span className="font-medium text-base text-foreground">{proc.name}</span>
                                                    {proc.description && (
                                                        <span className="text-sm text-muted-foreground line-clamp-2">{proc.description}</span>
                                                    )}
                                                </div>
                                                {/* Check if this procedure is selected for current asset? Optional but nice. */}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>

                    <div className="px-6 py-4 border-t bg-muted/50 mt-auto">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="use-same"
                                checked={useRunningProcedure}
                                onCheckedChange={(c) => setUseRunningProcedure(!!c)}
                                className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                            />
                            <label
                                htmlFor="use-same"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Use the same procedure for all assets
                            </label>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function MultiAssetDialog({ open, onOpenChange, assets, tempIds, onToggle, onConfirm, getId, renderTreeItems, treeData }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col pl-0 pr-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Select assets for sub-work orders</DialogTitle>
                    <DialogDescription>
                        Sub-work orders will be created for each asset.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Command className="h-full border-none shadow-none">
                        <CommandInput placeholder="Search assets..." className="border-none focus:ring-0 mx-4" />
                        <CommandList className="h-full max-h-full px-2">
                            <CommandEmpty>No assets found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-full">
                                    {renderTreeItems(treeData, 0, true, tempIds, onToggle)}
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/50 mt-auto">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-muted-foreground">
                            {tempIds.length} assets selected
                        </span>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="button" onClick={onConfirm} className="bg-orange-600 hover:bg-orange-700 text-white">Add Assets</Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

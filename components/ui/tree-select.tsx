"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, ChevronRight, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type TreeNode = {
    id: string
    label: string
    children?: TreeNode[]
}

export const buildTree = (items: any[], parentIdKey: string = 'parentLocationId', idKey: string = 'id', labelKey: string = 'name') => {
    if (!Array.isArray(items)) {
        console.warn('buildTree received non-array items:', items)
        return []
    }
    const map = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    // Initialize nodes
    items.forEach(item => {
        const id = item[idKey] || item._id || item.id
        map.set(id, { id, label: item[labelKey], children: [] })
    })

    // Build hierarchy
    items.forEach(item => {
        const id = item[idKey] || item._id || item.id
        const node = map.get(id)
        const parentId = item[parentIdKey]
        if (parentId && map.has(parentId)) {
            map.get(parentId)!.children!.push(node!)
        } else {
            roots.push(node!)
        }
    })

    return roots
}

interface TreeSelectProps {
    data: TreeNode[]
    selectedIds: string[]
    onSelect: (ids: string[]) => void
    placeholder?: string
    singleSelect?: boolean
    onCreateNew?: () => void
}

export function TreeSelect({
    data,
    selectedIds,
    onSelect,
    placeholder = "Select items...",
    singleSelect = false,
    onCreateNew
}: TreeSelectProps) {
    const [open, setOpen] = useState(false)
    const [expanded, setExpanded] = useState<string[]>([])

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const handleSelect = (id: string) => {
        if (singleSelect) {
            onSelect([id])
            setOpen(false)
        } else {
            onSelect(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])
        }
    }

    const renderTree = (nodes: TreeNode[], level = 0) => {
        return nodes.map(node => (
            <div key={node.id}>
                <CommandItem
                    value={node.label + node.id} // unique value for search
                    onSelect={() => handleSelect(node.id)}
                    className="flex justify-between"
                    style={{ paddingLeft: `${(level + 1) * 12}px` }}
                >
                    <div className="flex items-center gap-2">
                        {node.children && node.children.length > 0 ? (
                            <div onClick={(e) => toggleExpand(node.id, e)} className="cursor-pointer p-0.5 hover:bg-muted rounded">
                                {expanded.includes(node.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </div>
                        ) : <span className="w-4" />}
                        <span>{node.label}</span>
                    </div>
                    {selectedIds.includes(node.id) && <Check className="h-4 w-4" />}
                </CommandItem>
                {node.children && node.children.length > 0 && expanded.includes(node.id) && (
                    renderTree(node.children, level + 1)
                )}
            </div>
        ))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
                    {selectedIds.length > 0
                        ? (singleSelect
                            ? (() => {
                                const findLabel = (nodes: TreeNode[], id: string): string | undefined => {
                                    for (const node of nodes) {
                                        if (node.id === id) return node.label
                                        if (node.children) {
                                            const found = findLabel(node.children, id)
                                            if (found) return found
                                        }
                                    }
                                    return undefined
                                }
                                return findLabel(data, selectedIds[0]) || selectedIds[0]
                            })()
                            : `${selectedIds.length} selected`)
                        : <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {renderTree(data)}
                            {onCreateNew && (
                                <CommandItem
                                    onSelect={() => {
                                        onCreateNew()
                                        setOpen(false)
                                    }}
                                    className="text-primary font-medium cursor-pointer border-t mt-2 pt-2"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Asset
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

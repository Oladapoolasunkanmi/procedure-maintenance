"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Trash2, Eye, FileText, CheckCircle2, X, Calendar as CalendarIcon, Type, Hash, DollarSign, ListChecks, PenTool, Image as ImageIcon, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Procedure {
    id: string
    _id?: string
    name: string
    description?: string
    // Add other fields as necessary for preview
    fields?: any[]
}

interface ProcedureSelectorProps {
    procedures: Procedure[]
    value?: string | string[]
    onChange: (ids: any) => void
    disabled?: boolean
}

export function ProcedureSelector({
    procedures,
    value,
    onChange,
    disabled
}: ProcedureSelectorProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [previewId, setPreviewId] = React.useState<string | null>(null)
    const [isMobileListOpen, setIsMobileListOpen] = React.useState(true)

    const getId = (item: Procedure) => item.id || item._id || ""

    const selectedIds = Array.isArray(value) ? value : (value ? [value] : [])
    const selectedProcedures = procedures.filter(p => selectedIds.includes(getId(p)))

    // Filter procedures
    const filteredProcedures = procedures.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handleSelect = (id: string, select: boolean) => {
        let newIds
        if (select) {
            newIds = [...selectedIds, id]
        } else {
            newIds = selectedIds.filter(i => i !== id)
        }
        onChange(newIds)
    }

    const toggleProcedure = (id: string) => {
        if (selectedIds.includes(id)) {
            handleSelect(id, false)
        } else {
            handleSelect(id, true)
        }
    }

    const handlePreview = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setPreviewId(id)
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileListOpen(false)
        }
    }

    const previewProcedure = procedures.find(p => getId(p) === previewId)

    // Group fields by section
    const renderItems = React.useMemo(() => {
        if (!previewProcedure?.fields) return []

        const chunks: { type: 'section_group' | 'flat_group', id: string, label?: string, fields: any[] }[] = []
        let currentChunk: { type: 'section_group' | 'flat_group', id: string, label?: string, fields: any[] } = {
            type: 'flat_group',
            id: 'initial',
            fields: []
        }

        previewProcedure.fields.forEach((field, index) => {
            if (field.type === 'section') {
                // Close current chunk if it has items
                if (currentChunk.fields.length > 0) {
                    chunks.push(currentChunk)
                }
                // Start new Section chunk
                currentChunk = {
                    type: 'section_group',
                    id: field.id || `sec-${index}`,
                    label: field.label,
                    fields: []
                }
            } else if (field.sectionBreak) {
                // Close current chunk if it has items
                if (currentChunk.fields.length > 0) {
                    chunks.push(currentChunk)
                }
                // Start new Flat chunk for this break-out field and subsequent fields
                currentChunk = {
                    type: 'flat_group',
                    id: `group-${index}`,
                    fields: [field]
                }
            } else {
                // Regular field, add to current chunk
                currentChunk.fields.push(field)
            }
        })

        // Push final chunk
        if (currentChunk.fields.length > 0) {
            chunks.push(currentChunk)
        }

        return chunks
    }, [previewProcedure])

    return (
        <div className="space-y-4">
            {selectedProcedures.length > 0 ? (
                <div className="space-y-3">
                    {selectedProcedures.map(proc => (
                        <Card key={getId(proc)} className="bg-orange-50/50 border-orange-100 shadow-none rounded-md py-4">
                            <CardContent className="px-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                        <FileText className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-medium truncate">{proc.name}</h4>
                                        <p className="text-sm text-muted-foreground truncate max-w-[400px]">
                                            {proc.description || "No description"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                        onClick={() => {
                                            setPreviewId(getId(proc))
                                            setIsOpen(true)
                                        }}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                    {!disabled && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-red-50"
                                            onClick={() => handleSelect(getId(proc), false)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-start">
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setIsOpen(true)}
                            className="text-orange-600 h-auto p-0 hover:no-underline hover:text-orange-700"
                        >
                            + Add new procedure
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                    <div className="p-2 bg-background rounded-full border shadow-sm">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Create or attach new Form, Procedure or Checklist</p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        disabled={disabled}
                        variant="outline"
                        className="bg-background"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Procedure
                    </Button>
                </div>
            )
            }

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl lg:max-w-4xl h-[800px] flex flex-col p-0 gap-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10">
                        <div className="flex items-center gap-2">
                            {/* Mobile Back Button */}
                            {!isMobileListOpen && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileListOpen(true)}
                                    className="lg:hidden mr-1 -ml-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className={cn("mr-2 -ml-2", !isMobileListOpen && "hidden lg:flex")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <h2 className="text-lg font-semibold">Add Procedure</h2>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => {
                                setIsOpen(false)
                                router.push('/procedures/builder')
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create a New Procedure
                        </Button>
                    </div>

                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Left Column: List */}
                        <div className={cn(
                            "flex flex-col border-r transition-all duration-300 ease-in-out bg-background z-20",
                            // Mobile styles
                            "absolute inset-y-0 left-0 w-full lg:static",
                            isMobileListOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                            // Desktop styles
                            previewId ? "lg:w-1/3 lg:min-w-[300px]" : "lg:w-full"
                        )}>
                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search Procedure Templates"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {filteredProcedures.map(proc => {
                                        const id = getId(proc)
                                        const isSelected = selectedIds.includes(id)
                                        const isPreviewing = previewId === id

                                        return (
                                            <div
                                                key={id}
                                                className={cn(
                                                    "group relative flex items-start gap-3 p-3 rounded-lg border border-transparent cursor-pointer transition-all",
                                                    isSelected ? "bg-orange-50 border-orange-200" : "hover:bg-muted/50 border-border/40",
                                                    isPreviewing ? "bg-muted" : ""
                                                )}
                                                onClick={() => toggleProcedure(id)}
                                            >
                                                <div className="mt-0.5 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                                                    {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-medium text-sm truncate">{proc.name}</h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {proc.description || "No description"}
                                                        </p>
                                                    </div>
                                                    <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity ml-auto shrink-0">
                                                        <span
                                                            role="button"
                                                            onClick={(e) => handlePreview(e, id)}
                                                            className="text-xs font-medium text-orange-600 hover:underline flex items-center"
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Preview
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {filteredProcedures.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No procedures found.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right Column: Preview */}
                        <div className={cn(
                            "bg-muted/30 flex flex-col transition-all duration-300 ease-in-out overflow-auto border-l",
                            "w-full h-full", // Full width/height on mobile, and desktop fills remaining flex space
                            previewId ? "lg:flex-1 opacity-100" : "lg:w-0 lg:opacity-0"
                        )}>
                            <div className="h-full flex flex-col w-full min-w-0">
                                {previewProcedure && (
                                    <>
                                        <ScrollArea className="flex-1">
                                            <div className="p-6 space-y-6 max-w-2xl mx-auto">
                                                {/* Render Groups and Fields */}
                                                {renderItems.map((item, index) => {
                                                    if (item.type === 'section_group') {
                                                        return (
                                                            <CollapsibleSection key={item.id || index} title={item.label || "Section"} defaultOpen={true}>
                                                                <div className="space-y-4 pt-2">
                                                                    {item.fields.map((field: any) => (
                                                                        <PreviewField key={field.id} field={field} />
                                                                    ))}
                                                                </div>
                                                            </CollapsibleSection>
                                                        )
                                                    } else {
                                                        // flat_group
                                                        return (
                                                            <div key={item.id || index} className="space-y-4">
                                                                {item.fields.map((field: any) => (
                                                                    <PreviewField key={field.id} field={field} />
                                                                ))}
                                                            </div>
                                                        )
                                                    }
                                                })}
                                                {(!previewProcedure.fields || previewProcedure.fields.length === 0) && (
                                                    <div className="text-center py-12 text-muted-foreground">
                                                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                        <p>No fields in this procedure.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-background flex justify-end">
                        <Button type="button" onClick={() => setIsOpen(false)}>
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}

function PreviewField({ field }: { field: any }) {
    if (!field) return null
    return (
        <div className="space-y-2">
            {field.type === "heading" ? (
                <h5 className="text-base font-bold text-foreground mt-4">{field.label}</h5>
            ) : (
                <div className="p-4 rounded-lg border bg-background space-y-3">
                    <div className="flex items-start justify-between">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                        </label>
                        {field.type === "number" && <Badge variant="outline" className="text-xs">Number</Badge>}
                    </div>

                    {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}

                    {/* Attachments Preview */}
                    {field.attachments && field.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {field.attachments.map((att: any, idx: number) => (
                                <div key={idx} className="relative group/att border rounded-md overflow-hidden bg-muted/20 flex items-center pr-2">
                                    {(att.type === 'image' || att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                                        <div className="h-10 w-10 shrink-0 bg-background border-r">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 flex items-center justify-center bg-muted shrink-0 border-r">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <a href={att.url} target="_blank" rel="noreferrer" className="text-xs ml-2 hover:underline truncate max-w-[150px] font-medium block" onClick={(e) => e.stopPropagation()}>
                                        {att.name || "Attachment"}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-1">
                        {field.type === "text" && <Input disabled placeholder={field.placeholder} />}
                        {field.type === "number" && <Input disabled type="number" placeholder="0" />}
                        {field.type === "amount" && (
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input disabled className="pl-9" placeholder="0.00" />
                            </div>
                        )}
                        {(field.type === "multiple_choice" || field.type === "checklist") && (
                            <div className="space-y-2">
                                {field.options?.map((opt: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {field.type === "multiple_choice" ? (
                                            <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                        ) : (
                                            <div className="h-4 w-4 rounded border border-muted-foreground/30" />
                                        )}
                                        <span className="text-sm text-muted-foreground">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {field.type === "yes_no_na" && (
                            <div className="flex gap-2">
                                {["Yes", "No", "N/A"].map(opt => (
                                    <Button key={opt} type="button" variant="outline" size="sm" disabled className="flex-1">{opt}</Button>
                                ))}
                            </div>
                        )}
                        {field.type === "inspection_check" && (
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" disabled className="flex-1 bg-green-50 text-green-700 border-green-200">Pass</Button>
                                <Button type="button" variant="outline" size="sm" disabled className="flex-1 bg-orange-50 text-orange-700 border-orange-200">Flag</Button>
                                <Button type="button" variant="outline" size="sm" disabled className="flex-1 bg-red-50 text-red-700 border-red-200">Fail</Button>
                            </div>
                        )}
                        {field.type === "photo" && (
                            <div className="h-24 bg-muted/10 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-1">
                                    <ImageIcon className="h-6 w-6 opacity-50" />
                                    <span className="text-xs">Add Photo</span>
                                </div>
                            </div>
                        )}
                        {field.type === "signature" && (
                            <div className="h-16 bg-muted/10 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                                <span className="text-xs italic">Signature Required</span>
                            </div>
                        )}
                        {field.type === "date" && (
                            <div className="relative">
                                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input disabled className="pl-9" placeholder="Select date" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    return (
        <div className="border rounded-lg bg-card text-card-foreground shadow-none overflow-hidden mb-4">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
            >
                <h4 className="font-semibold text-lg">{title}</h4>
                {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </button>
            {isOpen && (
                <div className="p-4 border-t bg-background">
                    {children}
                </div>
            )}
        </div>
    )
}

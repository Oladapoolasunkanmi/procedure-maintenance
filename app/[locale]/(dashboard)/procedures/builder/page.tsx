"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    CheckSquare,
    ChevronDown,
    Copy,
    Eye,
    FileText,
    GripVertical,
    Heading,
    Image as ImageIcon,
    Layout,
    MoreVertical,
    PenTool,
    Plus,
    Search,
    Calendar,
    MousePointer2,
    CheckCircle2,
    Trash2,
    Type,
    X,
    Paperclip,
    File as FileIcon,
    Zap,
    Wrench,
    RefreshCw,
    Snowflake,
    ShieldCheck,
    Users,
    Save,
    RotateCcw,
    Check,
    Loader2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useToast } from "@/components/ui/use-toast"
import { TreeSelect, buildTree } from "@/components/ui/tree-select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Location, Asset, Team } from "@/lib/data"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SlidingTabsList, SlidingTabsTrigger } from "@/components/ui/sliding-tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FieldType = "text" | "checkbox" | "number" | "amount" | "multiple_choice" | "checklist" | "inspection_check" | "yes_no_na" | "heading" | "section" | "photo" | "instruction" | "signature" | "date"

interface FormField {
    id: string
    type: FieldType
    label: string
    required: boolean
    placeholder?: string
    attachments?: Array<{ id: string, url: string, name: string, type: 'image' | 'file' }>
    options?: string[]
    description?: string
    sectionBreak?: boolean
    score?: number
}

interface SortableFieldProps {
    field: FormField
    isActive: boolean
    isInSection: boolean
    isLastInSection: boolean
    onActivate: () => void
    onUpdate: (id: string, updates: Partial<FormField>) => void
    onRemove: (id: string, e: React.MouseEvent) => void
    onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void
    onAddAfter: (id: string, type: FieldType) => void
    onDuplicate: (id: string) => void
    onOpenReorder: () => void
    isScoringEnabled: boolean
}

function SortableField({ field, isActive, isInSection, isLastInSection, onActivate, onUpdate, onRemove, onImageUpload, onAddAfter, onDuplicate, onOpenReorder, isScoringEnabled }: SortableFieldProps) {
    const t = useTranslations('Procedures')
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    if (field.type === "heading") {
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={(e) => {
                    e.stopPropagation()
                    onActivate()
                }}
                className={cn(
                    "group relative py-2 mt-4 transition-all -mx-4 px-4 rounded-xl",
                    isActive ? "bg-muted/10" : ""
                )}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 cursor-move text-muted-foreground p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex items-center gap-4 group/heading">
                    <Input
                        value={field.label}
                        onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                        placeholder="Heading"
                        className="border-transparent hover:border-border focus-visible:border-primary px-0 !text-3xl font-bold bg-transparent shadow-none h-auto py-1"
                    />
                    <div className="opacity-0 group-hover/heading:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => {
                            // Copy logic
                        }}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => onRemove(field.id, e)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const isSection = field.type === "section"
    const showTimeline = isSection || isInSection

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation()
                onActivate()
            }}
            className={cn(
                "group relative flex gap-4 w-full",
            )}
        >
            {/* Timeline Gutter - Only for Sections or Items in Section */}
            {showTimeline && (
                <div className="flex flex-col items-center w-10 shrink-0 relative">
                    {/* Vertical Line */}
                    <div
                        className={cn(
                            "absolute w-[2px] bg-border origin-top animate-in slide-in-from-top-full duration-500 ease-out",
                            isSection ? "top-[1.25rem] bottom-0" : "-top-2 bottom-0",
                            // If it's the last item in a section, stops at the dot? 
                            // Usually for a continuous section flow, it continues to the next item.
                            // If it's the very last item of the section, we might want it to stop.
                            // But usually sections are continuous. Let's keep it full height for now unless last.
                            isLastInSection && !isSection ? "h-[2rem]" : ""
                        )}
                    />

                    {/* Node/Icon */}
                    <div className={cn(
                        "relative z-10 flex items-center justify-center transition-colors bg-background",
                        isSection ? "w-10 h-10 rounded-full border-2 border-orange-500 text-orange-500 shadow-sm mt-0.5" : "w-3 h-3 rounded-full bg-orange-500 mt-6"
                    )}>
                        {isSection && <Layout className="h-5 w-5" />}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className={cn("flex-1 pb-6 min-w-0 flex gap-4", !showTimeline && "pl-0")}>
                {isSection ? (
                    // Section Header (Text Only, No Card)
                    <div className="flex-1 flex items-center gap-4 py-2 mt-2">
                        <div className="flex-1">
                            <Input
                                value={field.label}
                                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                                placeholder="Section Name"
                                className="border-0 p-0 h-auto !text-2xl font-bold bg-transparent placeholder:text-muted-foreground/40 focus-visible:ring-0 text-foreground"
                            />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => {
                                e.stopPropagation()
                                onAddAfter(field.id, "text")
                            }}>
                                <Plus className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onOpenReorder}>
                                        Reorder Sections
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(field.id)}>
                                        Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => onRemove(field.id, e)}>
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ) : (
                    // Standard Field Card
                    <div className={cn(
                        "relative flex-1 flex transition-all rounded-lg shadow-sm border bg-background",
                        isActive ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"
                    )}>
                        <div className="flex-1 min-w-0">
                            {/* Drag Handle */}
                            <div
                                {...attributes}
                                {...listeners}
                                className={cn(
                                    "absolute left-2 top-4 cursor-move text-muted-foreground p-1 rounded hover:bg-muted z-10",
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                            >
                                <GripVertical className="h-5 w-5" />
                            </div>

                            <div className="pl-10 pr-4 py-4">
                                {isActive ? (
                                    // Expanded View
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <Input
                                                    value={field.label}
                                                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                                                    placeholder="Field Name"
                                                    className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary font-medium text-lg placeholder:text-muted-foreground/50"
                                                    autoFocus
                                                />
                                            </div>
                                            <Select
                                                value={field.type}
                                                onValueChange={(v) => {
                                                    const newType = v as FieldType;
                                                    const updates: Partial<FormField> = { type: newType };

                                                    if ((newType === "multiple_choice" || newType === "checklist") && (!field.options || field.options.length === 0)) {
                                                        updates.options = ["Option 1"];
                                                    }

                                                    onUpdate(field.id, updates);
                                                }}
                                            >
                                                <SelectTrigger className="w-[180px] h-8">
                                                    <div className="flex items-center gap-2">
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text"><div className="flex items-center gap-2"><Type className="h-4 w-4 text-green-500" /> {t('fieldTypes.text')}</div></SelectItem>
                                                    <SelectItem value="checkbox"><div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-primary" /> {t('fieldTypes.checkbox')}</div></SelectItem>
                                                    <SelectItem value="number"><div className="flex items-center gap-2"><span className="h-4 w-4 flex items-center justify-center font-bold text-orange-500 text-xs">#</span> {t('fieldTypes.number')}</div></SelectItem>
                                                    <SelectItem value="amount"><div className="flex items-center gap-2"><span className="h-4 w-4 flex items-center justify-center font-bold text-green-600 text-xs">$</span> {t('fieldTypes.amount')}</div></SelectItem>
                                                    <SelectItem value="multiple_choice"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-500" /> {t('fieldTypes.multipleChoice')}</div></SelectItem>
                                                    <SelectItem value="checklist"><div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-blue-500" /> {t('fieldTypes.checklist')}</div></SelectItem>
                                                    <SelectItem value="yes_no_na"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> {t('fieldTypes.yesNo')}</div></SelectItem>
                                                    <SelectItem value="inspection_check"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-indigo-500" /> {t('fieldTypes.inspection')}</div></SelectItem>
                                                    <SelectItem value="signature"><div className="flex items-center gap-2"><PenTool className="h-4 w-4 text-pink-500" /> {t('fieldTypes.signature')}</div></SelectItem>
                                                    <SelectItem value="date"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-yellow-500" /> {t('fieldTypes.date')}</div></SelectItem>
                                                    <SelectItem value="photo"><div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-red-500" /> {t('fieldTypes.photo')}</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Optional Description */}
                                        {field.description !== undefined && (
                                            <div className="mt-2">
                                                <Textarea
                                                    value={field.description}
                                                    onChange={(e) => onUpdate(field.id, { description: e.target.value })}
                                                    placeholder="Add a description"
                                                    className="min-h-[60px] resize-none border-0 border-b rounded-none px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-primary text-sm text-muted-foreground"
                                                />
                                            </div>
                                        )}

                                        {/* Attachment Preview (Image or File) */}
                                        {field.attachments && field.attachments.length > 0 && (
                                            <div className="mt-4 grid gap-2">
                                                {field.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-muted/30 border rounded-md group/file">
                                                        <div className="h-10 w-10 flex items-center justify-center bg-background rounded border shrink-0 overflow-hidden">
                                                            {attachment.type === 'image' ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={attachment.url} alt="preview" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover/file:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const newAttachments = field.attachments?.filter(a => a.id !== attachment.id)
                                                                onUpdate(field.id, { attachments: newAttachments })
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Dynamic Content Based on Type */}
                                        <div className="pt-2">
                                            {field.type === "text" && (
                                                <Input disabled placeholder={field.placeholder} />
                                            )}
                                            {field.type === "number" && (
                                                <Input disabled className="font-mono" placeholder="Number will be entered here" type="number" />
                                            )}
                                            {field.type === "amount" && (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                                    <Input disabled className="pl-7 font-mono" placeholder="0.00" type="number" />
                                                </div>
                                            )}
                                            {(field.type === "multiple_choice" || field.type === "checklist") && (
                                                <div className="space-y-2">
                                                    {field.options?.map((option, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            {field.type === "multiple_choice" ? (
                                                                <div className="h-4 w-4 rounded-full border border-primary shrink-0" />
                                                            ) : (
                                                                <div className="h-4 w-4 rounded border border-primary shrink-0" />
                                                            )}
                                                            <Input
                                                                value={option}
                                                                onChange={(e) => {
                                                                    const newOptions = [...(field.options || [])];
                                                                    newOptions[index] = e.target.value;
                                                                    onUpdate(field.id, { options: newOptions });
                                                                }}
                                                                className="flex-1 h-8"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newOptions = [...(field.options || [])].filter((_, i) => i !== index);
                                                                    onUpdate(field.id, { options: newOptions });
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-primary hover:text-primary/90 px-0 h-auto font-normal"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdate(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] });
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1.5" /> Add Option
                                                    </Button>
                                                </div>
                                            )}
                                            {field.type === "yes_no_na" && (
                                                <div className="flex gap-4">
                                                    <Button variant="outline" size="sm" className="flex-1 pointer-events-none">Yes</Button>
                                                    <Button variant="outline" size="sm" className="flex-1 pointer-events-none">No</Button>
                                                    <Button variant="outline" size="sm" className="flex-1 pointer-events-none">N/A</Button>
                                                </div>
                                            )}
                                            {field.type === "inspection_check" && (
                                                <div className="flex gap-4">
                                                    <Button variant="outline" size="sm" className="flex-1 border-green-200 text-green-700 pointer-events-none bg-green-50/50">Pass</Button>
                                                    <Button variant="outline" size="sm" className="flex-1 border-orange-200 text-orange-700 pointer-events-none bg-orange-50/50">Flag</Button>
                                                    <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-700 pointer-events-none bg-red-50/50">Fail</Button>
                                                </div>
                                            )}
                                            {field.type === "instruction" && (
                                                <div className="p-4 bg-muted/20 rounded border border-dashed text-muted-foreground text-sm">
                                                    Instruction text is read-only for the technician.
                                                </div>
                                            )}
                                            {field.type === "date" && (
                                                <div className="relative">
                                                    <Input disabled placeholder="DD/MM/YYYY" className="pl-10" />
                                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            {field.type === "signature" && (
                                                <div className="h-24 bg-muted/5 rounded border border-dashed flex items-center justify-center text-muted-foreground italic">
                                                    Assignees will sign here
                                                </div>
                                            )}
                                            {field.type === "photo" && (
                                                <div className="h-24 bg-muted/5 rounded border border-dashed flex items-center justify-center text-muted-foreground italic">
                                                    Assignees will add a Picture/File here
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id={`file-${field.id}`}
                                                    className="hidden"
                                                    accept="*"
                                                    multiple
                                                    onChange={(e) => onImageUpload(field.id, e)}
                                                />
                                                <label htmlFor={`file-${field.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" asChild>
                                                        <span><Paperclip className="h-4 w-4" /></span>
                                                    </Button>
                                                </label>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(field.id)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => onRemove(field.id, e)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Separator orientation="vertical" className="h-4 mx-1" />
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`req-${field.id}`} className="text-xs">Required</Label>
                                                <Switch
                                                    id={`req-${field.id}`}
                                                    checked={field.required}
                                                    onCheckedChange={(c: boolean) => onUpdate(field.id, { required: c })}
                                                />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        if (field.description === undefined) {
                                                            onUpdate(field.id, { description: "" })
                                                        }
                                                    }}>
                                                        Add description
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ) : (
                                    // Collapsed View
                                    <div className="flex items-center justify-between mb-0">
                                        <div className="flex items-center gap-4">
                                            {getFieldIcon(field.type)}
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{field.label || "Untitled Field"}</span>
                                                {field.required && <span className="text-[10px] text-destructive font-medium uppercase tracking-wider">Required</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground text-muted-foreground" onClick={() => onDuplicate(field.id)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => onRemove(field.id, e)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <div className="cursor-grab p-1 text-muted-foreground hover:bg-muted rounded" {...attributes} {...listeners}>
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Middle Action Bar - for expanded view only? Or separate? 
                            The screenshot shows the Score input on the right side.
                            We need to render it OUTSIDE the main card body if we want that separator look,
                            or inside if it's part of the card.
                            The structure: Card | Score
                        */}
                        </div>

                        {isScoringEnabled && ["checkbox", "multiple_choice", "checklist", "inspection_check", "yes_no_na"].includes(field.type) && (
                            <div className="w-24 border-l flex flex-col items-center justify-center gap-1 bg-muted/5 rounded-r-lg">
                                <Input
                                    type="number"
                                    value={field.score || 0}
                                    onChange={(e) => onUpdate(field.id, { score: Number(e.target.value) })}
                                    className="text-center font-bold !text-2xl h-9 border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 bg-transparent shadow-none w-16"
                                    min={0}
                                />
                                <span className="text-[10px] text-muted-foreground text-center leading-tight">Max. Field Score</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function ProcedureBuilderContent() {
    const t = useTranslations('Procedures')
    const searchParams = useSearchParams()
    const router = useRouter()
    const [name, setName] = React.useState(searchParams.get("name") || t('builder.untitled'))
    const [description, setDescription] = React.useState(searchParams.get("description") || "")

    const [fields, setFields] = React.useState<FormField[]>([
        { id: "1", type: "text", label: "", required: false, placeholder: "Text will be entered here" }
    ])
    const [activeFieldId, setActiveFieldId] = React.useState<string | null>("1")
    const [isReorderOpen, setIsReorderOpen] = React.useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

    // Data State
    const [assetsList, setAssetsList] = React.useState<Asset[]>([])
    const [locationsList, setLocationsList] = React.useState<Location[]>([])
    const [teamsList, setTeamsList] = React.useState<Team[]>([])

    // Settings State
    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
    const [selectedAssets, setSelectedAssets] = React.useState<string[]>([])
    const [selectedLocations, setSelectedLocations] = React.useState<string[]>([])
    const [selectedTeams, setSelectedTeams] = React.useState<string[]>([])
    const [visibility, setVisibility] = React.useState<string>("private")
    const [isScoringEnabled, setIsScoringEnabled] = React.useState(false)
    const [minScoreGoal, setMinScoreGoal] = React.useState<number | null>(null)
    const [isCustomScore, setIsCustomScore] = React.useState(false)
    const [showScoreSummary, setShowScoreSummary] = React.useState(false)
    const [minScoreDialogOpen, setMinScoreDialogOpen] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const { toast } = useToast()

    // Edit Mode Logic
    const procedureId = searchParams.get('id')
    const [isEditing, setIsEditing] = React.useState(false)

    React.useEffect(() => {
        if (!procedureId) return

        const fetchProcedure = async () => {
            try {
                // Assuming we can leverage the same API for singular fetch by ID or using query-items
                // Simulating fetch by ID logic or direct call if API supported /api/procedures/[id]
                // Using existing pattern:
                const res = await fetch(`/api/procedures?id=${procedureId}`)
                const data = await res.json()
                const procedure = data.items?.[0]

                if (procedure) {
                    setIsEditing(true)
                    setName(procedure.name)
                    setDescription(procedure.description || "")
                    setFields(procedure.fields || []) // Simple map, complex logic might be needed for recreating structure if flattening happened differently but assuming 1:1 map

                    // Settings
                    if (procedure.settings) {
                        setSelectedCategories(procedure.settings.categories || [])
                        setSelectedTeams(procedure.settings.teams || [])
                        setSelectedLocations(procedure.settings.locations || [])
                        setSelectedAssets(procedure.settings.assets || [])
                        setVisibility(procedure.settings.visibility || "private")
                        if (procedure.settings.scoring) {
                            setIsScoringEnabled(procedure.settings.scoring.enabled)
                            setMinScoreGoal(procedure.settings.scoring.goal)
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load procedure for editing", error)
                toast({
                    title: "Error",
                    description: "Failed to load procedure data.",
                    variant: "destructive"
                })
            }
        }
        fetchProcedure()
    }, [procedureId, toast])

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [assetsRes, locationsRes, teamsRes] = await Promise.all([
                    fetch('/api/assets').then(res => res.json()),
                    fetch('/api/locations').then(res => res.json()),
                    fetch('/api/teams').then(res => res.json())
                ])

                const mapData = (data: any) => {
                    const items = data.items || (Array.isArray(data) ? data : [])
                    return items.map((item: any) => ({
                        ...item,
                        id: item._id || item.id
                    }))
                }

                setAssetsList(mapData(assetsRes))
                setLocationsList(mapData(locationsRes))
                setTeamsList(mapData(teamsRes))
            } catch (error) {
                console.error("Failed to fetch data:", error)
            }
        }
        fetchData()
    }, [])


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const addField = (type: FieldType, afterId?: string, customProps: Partial<FormField> = {}) => {
        const newId = Math.random().toString(36).substr(2, 9)
        const commonProps: FormField = {
            id: newId,
            type,
            label: "",
            required: false,
            placeholder: type === "text" ? "Text will be entered here" : undefined,
            options: (type === "multiple_choice" || type === "checklist") ? ["Option 1"] : undefined,
            ...customProps
        }

        if (type === "section") {
            const sectionCount = fields.filter(f => f.type === "section").length + 1
            const sectionField = { ...commonProps, label: `Section #${sectionCount}` }

            // Create a default text field to go inside the section
            const childId = Math.random().toString(36).substr(2, 9)
            const childField: FormField = {
                id: childId,
                type: "text",
                label: "",
                required: false,
                placeholder: "Text will be entered here"
            }

            let newFields = [...fields]

            if (afterId) {
                // Logic: If adding to a section header (afterId is section), we want to append to the END of that section, not the top.
                // Find the section, then find all subsequent items until the next section.
                const targetField = fields.find(f => f.id === afterId)
                if (targetField && targetField.type === "section") {
                    let insertIndex = fields.findIndex(f => f.id === afterId)
                    // Advance index until we hit another section or end of list
                    for (let i = insertIndex + 1; i < fields.length; i++) {
                        if (fields[i].type === "section" || fields[i].sectionBreak) {
                            break;
                        }
                        insertIndex = i
                    }

                    // Insert after the last child of this section
                    newFields.splice(insertIndex + 1, 0, sectionField, childField)
                    setFields(newFields)
                    setActiveFieldId(childId)
                    return
                }

                // If afterId is normal field?
                const activeIndex = fields.findIndex(f => f.id === afterId)
                newFields.splice(activeIndex + 1, 0, sectionField, childField)
                setFields(newFields)
                setActiveFieldId(childId)
                return

            } else if (activeFieldId) {
                const activeIndex = fields.findIndex(f => f.id === activeFieldId)
                if (activeIndex >= 0) {
                    newFields.splice(activeIndex + 1, 0, sectionField, childField)
                    setFields(newFields)
                    setActiveFieldId(childId)
                    return
                }
            }

            // Append to end
            setFields([...fields, sectionField, childField])
            setActiveFieldId(childId)
            return
        }

        // Normal Field Addition
        let newFields = [...fields]
        const targetId = afterId || activeFieldId

        // Refined Logic for "Plus" button on Section Header:
        // If `afterId` is provided and it is a Section, we want to append to the END of that section's children.
        if (afterId) {
            const targetField = fields.find(f => f.id === afterId)
            if (targetField && targetField.type === "section") {
                let insertIndex = fields.findIndex(f => f.id === afterId)
                // Walk to end of section
                for (let i = insertIndex + 1; i < fields.length; i++) {
                    if (fields[i].type === "section" || fields[i].sectionBreak) break
                    insertIndex = i
                }
                newFields.splice(insertIndex + 1, 0, commonProps)
                setFields(newFields)
                setActiveFieldId(newId)
                return
            }
        }

        // Parent/Child placement logic:
        // If we are adding via Toolbox (no afterId) but we have an activeFieldId
        // We want to insert AFTER the active card.
        // If the active card is inside a section, the new card should act as a sibling, i.e. inserted AFTER it (below it).
        // My previous splice logic `activeIndex + 1` does exactly this. A -> New -> B.
        // User said "A new child card item should be below the previous child card item not above it".
        // This usually means if I am at A, it should go to A's position + 1. 

        const activeIndex = fields.findIndex(f => f.id === targetId)

        if (activeIndex >= 0) {
            // Insert after active field
            newFields.splice(activeIndex + 1, 0, commonProps)
            setFields(newFields)
            setActiveFieldId(newId)
            return
        }

        // Append to end if no active field
        if (fields.length > 0) {
            setFields([...fields, { ...commonProps, sectionBreak: true }])
            setActiveFieldId(newId)
            return
        }

        setFields([...fields, commonProps])
        setActiveFieldId(newId)
    }

    const removeField = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setFields(fields.filter(f => f.id !== id))
        if (activeFieldId === id) setActiveFieldId(null)
    }

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const duplicateField = (id: string) => {
        const field = fields.find(f => f.id === id)
        if (!field) return

        if (field.type === "section") {
            // Duplicate Section AND its children
            const index = fields.findIndex(f => f.id === id)
            const children: FormField[] = []
            for (let i = index + 1; i < fields.length; i++) {
                if (fields[i].type === "section" || fields[i].sectionBreak) break
                children.push(fields[i])
            }

            const newSectionId = Math.random().toString(36).substr(2, 9)
            const newSection = { ...field, id: newSectionId, label: field.label + " (Copy)" }
            const newChildren = children.map(c => ({
                ...c,
                id: Math.random().toString(36).substr(2, 9)
            }))

            const newFields = [...fields]
            // Insert after the last child of original section
            const insertIndex = index + 1 + children.length
            newFields.splice(insertIndex, 0, newSection, ...newChildren)
            setFields(newFields)
        } else {
            // Simple duplicate
            const newField = { ...field, id: Math.random().toString(36).substr(2, 9), label: field.label + " (Copy)" }
            addField(field.type, id, newField)
        }
    }

    const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Indicate loading (reusing isSaving or might want a specific state, but isSaving blocks save button which is good)
        setIsSaving(true)
        toast({ title: "Uploading...", description: "Please wait while files are uploaded." })

        const newAttachments: { id: string, url: string, name: string, type: 'image' | 'file' }[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)
                // Use a clean path
                const timestamp = Date.now()
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                formData.append('path', `procedures/${timestamp}_${cleanName}`)

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (res.ok) {
                    const data = await res.json()
                    const url = data.url || (data.path ? `/api/image?path=${encodeURIComponent(data.path)}` : null)

                    if (url) {
                        newAttachments.push({
                            id: Math.random().toString(36).substr(2, 9),
                            url: url,
                            name: file.name,
                            type: file.type.startsWith('image/') ? 'image' : 'file'
                        })
                    }
                } else {
                    console.error("Upload failed for", file.name)
                    toast({ title: "Upload Failed", description: `Could not upload ${file.name}`, variant: "destructive" })
                }
            }

            if (newAttachments.length > 0) {
                const field = fields.find(f => f.id === id)
                if (field) {
                    const currentAttachments = field.attachments || []
                    updateField(id, { attachments: [...currentAttachments, ...newAttachments] })
                    toast({ title: "Uploaded", description: "Files attached successfully." })
                }
            }
        } catch (error) {
            console.error("Upload error", error)
            toast({ title: "Error", description: "An error occurred during upload.", variant: "destructive" })
        } finally {
            setIsSaving(false)
            // Reset input
            e.target.value = ''
        }
    }

    const getStructuredData = () => {
        let currentSectionId: string | null = null;
        return fields.map(f => {
            // Ensure prebuilt fields have their options in the payload
            let fieldPayload = { ...f };
            if (f.type === "inspection_check" && (!f.options || f.options.length === 0)) {
                fieldPayload.options = ["Pass", "Fail", "Flag"]
            }
            if (f.type === "yes_no_na" && (!f.options || f.options.length === 0)) {
                fieldPayload.options = ["Yes", "No", "N/A"]
            }

            if (f.type === "section") {
                currentSectionId = f.id
                return { ...fieldPayload, parentId: null }
            }
            if (f.sectionBreak) {
                currentSectionId = null
                return { ...fieldPayload, parentId: null }
            }
            return { ...fieldPayload, parentId: currentSectionId }
        })
    }

    // Helper to calculate section context for fields
    // This allows us to know if a field is "inside" a section (between a section header and the next/end)
    let currentSection: FormField | null = null;
    const fieldsWithContext = fields.map((field, index) => {
        if (field.type === "section") {
            currentSection = field
        } else if (field.sectionBreak) {
            currentSection = null
        }

        // Check if next item is a section (to determine if this is the last item in the section)
        const nextField = fields[index + 1]
        const isLastInSection = nextField?.type === "section" || index === fields.length - 1

        return {
            ...field,
            isInSection: !!currentSection && field.type !== "section", // Section itself is not "in" section, it IS section
            isLastInSection: isLastInSection
        }
    })

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/10">
            {/* Header */}
            <header className="flex items-center justify-between border-b bg-background px-6 py-3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">{name}</h1>
                        {description && <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="scoring" className="text-sm font-medium">{t('builder.settings.scoring')}</Label>
                        <Switch
                            id="scoring"
                            checked={isScoringEnabled}
                            onCheckedChange={setIsScoringEnabled}
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('builder.tabs.preview')}
                    </Button>
                    <Button
                        onClick={async () => {
                            if (isSaving) return
                            setIsSaving(true)
                            try {
                                const payload = {
                                    id: isEditing ? procedureId : undefined, // Only send ID if editing
                                    _id: isEditing ? procedureId : undefined,
                                    name,
                                    description,
                                    fields: fields.map(f => ({
                                        ...f,
                                        score: (isScoringEnabled && f.score) ? f.score : undefined
                                    })),
                                    settings: {
                                        categories: selectedCategories,
                                        teams: selectedTeams,
                                        locations: selectedLocations,
                                        assets: selectedAssets,
                                        visibility,
                                        scoring: {
                                            enabled: isScoringEnabled,
                                            goal: minScoreGoal
                                        }
                                    },
                                    // Use a mock user ID for now or get from session
                                    updatedBy: { id: "u1", name: "Zach Brown" },
                                    createdBy: isEditing ? undefined : { id: "u1", name: "Zach Brown" }
                                }

                                const method = isEditing ? 'PUT' : 'POST'
                                // Assuming apiClient is defined elsewhere or using native fetch
                                const res = await fetch('/api/procedures', {
                                    method,
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(payload),
                                });

                                if (!res.ok) {
                                    throw new Error('Failed to save procedure');
                                }
                                const data = await res.json();

                                toast({
                                    title: "Success",
                                    description: `Procedure ${isEditing ? 'updated' : 'saved'} successfully.`,
                                })
                                // Navigate to Details View
                                if (data?.id || (isEditing && procedureId)) {
                                    const targetId = data?.id || procedureId
                                    router.push(`/procedures?id=${targetId}`)
                                } else {
                                    router.push(`/procedures?id=${data?.item_id}`)
                                }
                            } catch (e) {
                                console.error(e)
                                toast({
                                    title: "Error",
                                    description: "Failed to save procedure. Please try again.",
                                    variant: "destructive"
                                })
                            } finally {
                                setIsSaving(false)
                            }
                        }}
                        disabled={isSaving}
                        className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('builder.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? t('builder.save') : t('builder.save')}
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* Score Summary Alert */}
            {showScoreSummary && isScoringEnabled && (
                <div className="px-6 mt-4">
                    <Alert className="bg-primary/5 border-primary/20 shadow-none flex items-center gap-0 p-0 pr-4 overflow-hidden text-primary">
                        <div className="flex flex-col items-center justify-center border-r border-primary/20 px-6 py-2 bg-white h-full self-stretch min-w-[100px]">
                            <span className="text-2xl font-bold text-primary">
                                {fields.reduce((acc, f) => acc + (f.score || 0), 0)}
                            </span>
                            <span className="text-[10px] text-primary/80 uppercase text-center font-bold tracking-wider">Max. Score</span>
                        </div>
                        <div className="flex-1 flex items-center justify-between px-6 py-2">
                            <span className="font-semibold text-sm text-primary">Min. Goal: {minScoreGoal || 0}%</span>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="sm" className="h-8 bg-white border-primary/20 hover:bg-primary/10 text-primary hover:text-primary/90" onClick={() => setMinScoreDialogOpen(true)}>
                                    Edit Goal
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary/90 hover:bg-primary/5" onClick={() => setShowScoreSummary(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Alert>
                </div>
            )}

            <Dialog open={minScoreDialogOpen} onOpenChange={setMinScoreDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select minimum score goal</DialogTitle>
                        <DialogDescription>
                            If procedure’s score is below this percentage, you will be prompted to create a corrective action.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex rounded-md shadow-sm">
                            {[null, 25, 50, 75].map((score) => (
                                <button
                                    key={score === null ? 'none' : score}
                                    onClick={() => {
                                        setMinScoreGoal(score)
                                        // setIsCustomScore(false) // Optional: keep custom mode state separate or reset
                                    }}
                                    className={cn(
                                        "flex-1 px-4 py-2 text-sm font-medium border first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 transition-colors focus:z-10",
                                        minScoreGoal === score
                                            ? "bg-primary text-primary-foreground border-primary z-10"
                                            : "bg-background text-foreground hover:bg-muted"
                                    )}
                                >
                                    {score === null ? "None" : `${score}%`}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button variant="link" className="px-0 text-primary" onClick={() => {
                                // Toggle custom input or just focus it?
                                // For this simple dialog, let's just show the input always or toggle it?
                                // User request image implies a toggle or inline.
                                // Let's perform a simple toggle for "Customize"
                                setIsCustomScore(true)
                            }}>Customize minimum goal</Button>
                        </div>

                        {isCustomScore && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <Input
                                    type="number"
                                    value={minScoreGoal || ''}
                                    onChange={(e) => setMinScoreGoal(Number(e.target.value))}
                                    className="w-full"
                                    placeholder="Enter custom percentage"
                                    min={0}
                                    max={100}
                                />
                                <span className="text-sm font-medium">%</span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setMinScoreDialogOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="fields" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 bg-background">
                    <SlidingTabsList>
                        <SlidingTabsTrigger value="fields">{t('builder.tabs.canvas')}</SlidingTabsTrigger>
                        <SlidingTabsTrigger value="settings">{t('builder.tabs.settings')}</SlidingTabsTrigger>
                    </SlidingTabsList>
                </div>

                <TabsContent value="fields" className="flex-1 flex overflow-hidden m-0 data-[state=inactive]:hidden">
                    {/* Form Area */}
                    <div className="flex-1 overflow-y-auto p-8" onClick={() => setActiveFieldId(null)}>
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold">{name}</h2>
                                <p className="text-muted-foreground">{description || "Routine inspection form to ensure operability."}</p>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={fields.map(f => f.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-0 relative">
                                        {/* Render items */}
                                        {fieldsWithContext.map((item) => (
                                            <SortableField
                                                key={item.id}
                                                field={item}
                                                isActive={activeFieldId === item.id}
                                                isInSection={item.isInSection}
                                                isLastInSection={item.isLastInSection}
                                                onActivate={() => setActiveFieldId(item.id)}
                                                onUpdate={updateField}
                                                onRemove={removeField}
                                                onImageUpload={handleImageUpload}
                                                onAddAfter={(id, type) => addField(type, id)}
                                                onDuplicate={duplicateField}
                                                onOpenReorder={() => setIsReorderOpen(true)}
                                                isScoringEnabled={isScoringEnabled}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>

                    <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Reorder Sections</DialogTitle>
                                <DialogDescription>Drag and drop to reorder sections.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e) => {
                                        const { active, over } = e
                                        if (over && active.id !== over.id) {
                                            // Reorder Logic for Sections
                                            // We need to reorder the BLOCKS of fields.
                                            // 1. Group fields into blocks (Section + Children)
                                            // 2. Reorder blocks
                                            // 3. Flatten back

                                            // Identify headers
                                            const sectionHeaders = fields.filter(f => f.type === "section")
                                            const oldIndex = sectionHeaders.findIndex(s => s.id === active.id)
                                            const newIndex = sectionHeaders.findIndex(s => s.id === over.id)

                                            if (oldIndex >= 0 && newIndex >= 0) {
                                                // Extract all blocks
                                                const blocks: FormField[][] = []
                                                let currentBlock: FormField[] = []

                                                fields.forEach((field) => {
                                                    if (field.type === "section") {
                                                        if (currentBlock.length > 0) blocks.push(currentBlock)
                                                        currentBlock = [field]
                                                    } else {
                                                        currentBlock.push(field)
                                                    }
                                                })
                                                if (currentBlock.length > 0) blocks.push(currentBlock)

                                                // Assuming purely section-based reordering for this dialog
                                                // Only swap blocks that START with a section
                                                const sectionBlocks = blocks.filter(b => b[0].type === "section")
                                                // Note: Non-section blocks (orphans at start) stay put or we ignore them for this specific reorder tool per user request "Reorder Sections"

                                                const movedBlock = sectionBlocks[oldIndex]
                                                sectionBlocks.splice(oldIndex, 1) // Remove
                                                sectionBlocks.splice(newIndex, 0, movedBlock) // Insert

                                                // Reconstruct: Orphans at start + Reordered Sections + Orphans at end (if any logic allowed that, but our logic is linear)
                                                // Simple reconstruction:
                                                // Handle items before first section
                                                const preSectionItems = fields.slice(0, fields.findIndex(f => f.type === "section"))

                                                const flatten = sectionBlocks.flat()
                                                setFields([...preSectionItems, ...flatten])
                                            }
                                        }
                                    }}
                                >
                                    <SortableContext items={fields.filter(f => f.type === "section").map(f => f.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {fields.filter(f => f.type === "section").map((section) => (
                                                <SectionReorderItem key={section.id} id={section.id} label={section.label} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                            <DialogFooter>
                                <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => setIsReorderOpen(false)}>Done</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Sidebar Toolbox */}
                    <div className="w-64 bg-background border-l p-4 flex flex-col gap-6">
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('toolbox.newItem')}</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <ToolboxItem icon={Plus} label={t('toolbox.field')} onClick={() => addField("text")} />
                                <ToolboxItem icon={Type} label={t('toolbox.heading')} onClick={() => addField("heading")} />
                                <ToolboxItem icon={Layout} label={t('toolbox.section')} onClick={() => addField("section")} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 overflow-y-auto p-8 m-0 data-[state=inactive]:hidden">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="bg-background border rounded-md shadow-none p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Tag your procedure</h3>
                                <p className="text-sm text-muted-foreground mb-4">Add tags to this procedure so you can easily find it on your Library</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Categories</Label>
                                        <CustomMultiSelect
                                            options={[
                                                { id: "electrical", label: "Electrical", icon: Zap, color: "text-yellow-500 bg-yellow-500/10" },
                                                { id: "mechanical", label: "Mechanical", icon: Wrench, color: "text-purple-500 bg-purple-500/10" },
                                                { id: "preventive", label: "Preventive", icon: RefreshCw, color: "text-green-500 bg-green-500/10" },
                                                { id: "refrigeration", label: "Refrigeration", icon: Snowflake, color: "text-cyan-500 bg-cyan-500/10" },
                                                { id: "safety", label: "Safety", icon: ShieldCheck, color: "text-teal-500 bg-teal-500/10" },
                                                { id: "sop", label: "Standard Operating Procedure", icon: FileText, color: "text-pink-500 bg-pink-500/10" },
                                            ]}
                                            placeholder="Select categories..."
                                            onSelect={setSelectedCategories}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assets</Label>
                                        <TreeSelect
                                            data={buildTree(assetsList, 'parentAssetId')}
                                            selectedIds={selectedAssets}
                                            onSelect={setSelectedAssets}
                                            placeholder="Select assets..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Locations</Label>
                                        <TreeSelect
                                            data={buildTree(locationsList)}
                                            selectedIds={selectedLocations}
                                            onSelect={setSelectedLocations}
                                            placeholder="Select locations..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background border rounded-md shadow-none p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Teams in charge</h3>
                                <p className="text-sm text-muted-foreground mb-4">Manage who is responsible for this procedure</p>

                                <div className="space-y-2">
                                    <CustomMultiSelect
                                        options={teamsList.map(t => {
                                            const colorMap: Record<string, string> = {
                                                blue: "bg-blue-500",
                                                green: "bg-green-500",
                                                yellow: "bg-yellow-500",
                                                red: "bg-red-500",
                                                teal: "bg-teal-500",
                                                pink: "bg-pink-500",
                                                purple: "bg-purple-500",
                                                orange: "bg-orange-500",
                                            }
                                            return {
                                                id: t.id,
                                                label: t.name,
                                                rightText: `${t.memberIds.length} Members`,
                                                avatar: t.name.substring(0, 2).toUpperCase(),
                                                color: colorMap[t.color || 'blue'] || "bg-gray-500"
                                            }
                                        })}
                                        placeholder="Select teams..."
                                        onSelect={setSelectedTeams}
                                    />
                                </div>
                            </div>
                        </div>
                        {isScoringEnabled && (
                            <div className="mb-6 p-4 border rounded-md bg-card shadow-none animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-base font-semibold mb-1">Select minimum score goal</h4>
                                <p className="text-sm text-muted-foreground mb-4">If procedure’s score is below this percentage, you will be prompted to create a corrective action.</p>

                                <div className="space-y-4">
                                    {!isCustomScore && <div className="flex rounded-md shadow-sm">
                                        {[null, 25, 50, 75].map((score) => (
                                            <button
                                                key={score === null ? 'none' : score}
                                                onClick={() => {
                                                    setMinScoreGoal(score)
                                                    setIsCustomScore(false)
                                                }}
                                                className={cn(
                                                    "flex-1 px-4 py-2 text-sm font-medium border first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 transition-colors focus:z-10",
                                                    minScoreGoal === score && !isCustomScore
                                                        ? "bg-primary text-primary-foreground border-primary z-10"
                                                        : "bg-background text-foreground hover:bg-muted"
                                                )}
                                            >
                                                {score === null ? "None" : `${score}%`}
                                            </button>
                                        ))}
                                    </div>}

                                    {isCustomScore ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={minScoreGoal || ''}
                                                onChange={(e) => setMinScoreGoal(Number(e.target.value))}
                                                className="w-full"
                                                placeholder="%"
                                                min={0}
                                                max={100}
                                            />
                                            <span className="text-sm">%</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCustomScore(true)}
                                            className="text-sm text-primary font-medium hover:underline"
                                        >
                                            Customize minimum goal
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 
                        <div className="bg-background border rounded-md shadow-none p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Procedure Visibility</h3>
                                <p className="text-sm text-muted-foreground mb-4">Control who can see this procedure</p>

                                <RadioGroup defaultValue="private" value={visibility} onValueChange={setVisibility}>
                                    <div className="flex items-start space-x-2 mb-4">
                                        <RadioGroupItem value="private" id="private" className="mt-1" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="private" className="font-medium">Keep Private</Label>
                                            <p className="text-sm text-muted-foreground">This Procedure will only be visible to your teammates at MaintainX.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="public" id="public" className="mt-1" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="public" className="font-medium">Make Public</Label>
                                            <p className="text-sm text-muted-foreground">Publish this Procedure to the Global Procedure Library for everyone in the MaintainX Community to see.</p>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div> 
                        */}
                    </div>
                </TabsContent>

                <PreviewDialog
                    open={isPreviewOpen}
                    onOpenChange={setIsPreviewOpen}
                    name={name}
                    description={description}
                    fields={fields}
                />
            </Tabs>
        </div>
    )
}

function PreviewDialog({ open, onOpenChange, name, description, fields }: { open: boolean, onOpenChange: (open: boolean) => void, name: string, description: string | null, fields: FormField[] }) {
    // Process sections for preview
    const renderPreviewContent = () => {
        // New Pass
        const nodes = []
        let i = 0
        while (i < fields.length) {
            const field = fields[i]
            if (field.type === 'section') {
                const children = []
                let j = i + 1
                while (j < fields.length && fields[j].type !== 'section' && !fields[j].sectionBreak) {
                    children.push(fields[j])
                    j++
                }
                nodes.push(renderSection(field, children))
                i = j
            } else {
                if (!field.sectionBreak) {
                    nodes.push(renderField(field))
                }
                i++
            }
        }
        return nodes
    }

    const renderSection = (section: FormField, children: FormField[]) => (
        <div key={section.id} className="mt-4 border rounded-lg bg-background overflow-hidden">
            <Accordion type="single" collapsible defaultValue="open" className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/5">
                        <span className="font-semibold text-base">{section.label}</span>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 space-y-4 pt-2">
                        {children.map(renderField)}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )

    const renderField = (field: FormField) => (
        <div key={field.id} className="bg-background rounded-lg border p-4 space-y-2">
            <Label className="text-sm font-medium text-foreground/80">{field.label || "Untitled Field"}</Label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}

            <div className="pt-1">
                {field.type === 'text' && <Input placeholder="Enter Text" />}
                {field.type === 'number' && <Input type="number" placeholder="Enter Number" />}
                {field.type === 'checkbox' && (
                    <div className="flex items-center space-x-2">
                        <Checkbox id={field.id} />
                        <label htmlFor={field.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {field.label}
                        </label>
                    </div>
                )}
                {field.type === 'multiple_choice' && (
                    <RadioGroup>
                        {field.options?.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`${field.id}-${idx}`} />
                                <Label htmlFor={`${field.id}-${idx}`}>{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
                {/* Add other types as needed for preview */}
                {['photo', 'signature', 'date', 'location'].includes(field.type) && (
                    <div className="h-10 bg-muted/10 border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
                        {field.type} picker placeholder
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
                <div className="bg-muted/40 text-foreground p-6 border-b z-10">
                    <h2 className="text-xl font-bold">{name}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{description || "Procedure Description..."}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {renderPreviewContent()}
                </div>
                <div className="p-4 bg-background border-t">
                    <Button className="w-full" onClick={() => onOpenChange(false)}>Close Preview</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ToolboxItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border text-center"
        >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}

function CustomMultiSelect({
    options,
    placeholder = "Select...",
    onSelect
}: {
    options: {
        id: string
        label: string
        icon?: any
        color?: string
        rightText?: string
        avatar?: string
    }[]
    placeholder?: string
    onSelect?: (ids: string[]) => void
}) {
    const [selected, setSelected] = React.useState<string[]>([])
    const [open, setOpen] = React.useState(false)

    const handleSelect = (id: string) => {
        const newSelected = selected.includes(id)
            ? selected.filter(i => i !== id)
            : [...selected, id]
        setSelected(newSelected)
        onSelect?.(newSelected)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" role="combobox">
                    {selected.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {selected.map(id => {
                                const opt = options.find(o => o.id === id)
                                return (
                                    <Badge key={id} variant="secondary" className="mr-1 mb-1">
                                        {opt?.label}
                                        <button
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSelect(id);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={() => handleSelect(id)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </Badge>
                                )
                            })}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] p-0" align="start">
                <div className="max-h-[300px] overflow-auto p-1">
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={cn(
                                "relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer mb-1",
                                selected.includes(option.id) && "bg-accent"
                            )}
                            onClick={() => handleSelect(option.id)}
                        >
                            <div className="flex items-center flex-1 gap-2">
                                {option.icon && (
                                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-full", option.color || "bg-muted text-muted-foreground")}>
                                        <option.icon className="h-4 w-4" />
                                    </div>
                                )}
                                {option.avatar && (
                                    <Avatar className="h-8 w-8">
                                        {/* Assuming AvatarImage logic if available, else Fallback */}
                                        <AvatarFallback className={cn("text-white", option.color)}>{option.avatar}</AvatarFallback>
                                    </Avatar>
                                )}
                                <span className="font-medium">{option.label}</span>
                            </div>
                            {option.rightText && (
                                <span className="text-xs text-muted-foreground ml-auto">{option.rightText}</span>
                            )}
                            {selected.includes(option.id) && (
                                <CheckCircle2 className="ml-2 h-4 w-4 text-primary" />
                            )}
                        </div>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function getFieldIcon(type: FieldType) {
    switch (type) {
        case "text": return <Type className="h-4 w-4 text-green-500" />
        case "checkbox": return <CheckSquare className="h-4 w-4 text-primary" />
        case "number": return <span className="h-4 w-4 flex items-center justify-center font-bold text-orange-500 text-xs">#</span>
        case "amount": return <span className="h-4 w-4 flex items-center justify-center font-bold text-green-600 text-xs">$</span>
        case "multiple_choice": return <CheckCircle2 className="h-4 w-4 text-purple-500" />
        case "checklist": return <CheckSquare className="h-4 w-4 text-blue-500" />
        case "inspection_check": return <Search className="h-4 w-4 text-indigo-500" />
        case "yes_no_na": return <CheckCircle2 className="h-4 w-4 text-teal-500" />
        case "signature": return <PenTool className="h-4 w-4 text-pink-500" />
        case "date": return <Calendar className="h-4 w-4 text-yellow-500" />
        case "photo": return <ImageIcon className="h-4 w-4 text-red-500" />
        case "instruction": return <FileText className="h-4 w-4 text-gray-500" />
        case "heading": return <Heading className="h-4 w-4 text-foreground" />
        case "section": return <Layout className="h-4 w-4 text-primary" />
    }
}

function SectionReorderItem({ id, label }: { id: string, label: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-move hover:bg-muted/50">
            <div className="h-8 w-8 rounded bg-background flex items-center justify-center border shadow-sm">
                <Layout className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm">{label}</span>
        </div>
    )
}

export default function ProcedureBuilderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProcedureBuilderContent />
        </Suspense>
    )
}

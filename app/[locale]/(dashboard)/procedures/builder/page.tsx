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
    Plus,
    Search,
    Trash2,
    Type,
    X,
} from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type FieldType = "text" | "checkbox" | "number" | "amount" | "multiple_choice" | "checklist" | "inspection_check" | "heading" | "photo" | "instruction"

interface FormField {
    id: string
    type: FieldType
    label: string
    required: boolean
    placeholder?: string
    image?: string
}

interface SortableFieldProps {
    field: FormField
    isActive: boolean
    onActivate: () => void
    onUpdate: (id: string, updates: Partial<FormField>) => void
    onRemove: (id: string, e: React.MouseEvent) => void
    onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void
}

function SortableField({ field, isActive, onActivate, onUpdate, onRemove, onImageUpload }: SortableFieldProps) {
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
                className="group relative py-4 transition-all"
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute left-[-2rem] top-1/2 -translate-y-1/2 cursor-move text-muted-foreground p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex items-center gap-4 group/heading">
                    <Input
                        value={field.label}
                        onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                        placeholder="Section Heading"
                        className="border-transparent hover:border-border focus-visible:border-primary px-0 text-2xl font-bold bg-transparent shadow-none h-auto py-1"
                    />
                    <div className="opacity-0 group-hover/heading:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => {
                            // Duplicate logic could go here
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation()
                onActivate()
            }}
            className={cn(
                "group relative bg-background border rounded-lg shadow-sm transition-all",
                isActive ? "border-primary ring-primary" : "hover:border-primary/50"
            )}
        >
            {/* Drag Handle - Always visible but subtle */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 cursor-move text-muted-foreground p-1 rounded hover:bg-muted z-10",
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
                                onValueChange={(v) => onUpdate(field.id, { type: v as FieldType })}
                            >
                                <SelectTrigger className="w-[180px] h-8">
                                    <div className="flex items-center gap-2">
                                        {getFieldIcon(field.type)}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text Field</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="number">Number Field</SelectItem>
                                    <SelectItem value="amount">Amount ($)</SelectItem>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="checklist">Checklist</SelectItem>
                                    <SelectItem value="inspection_check">Inspection Check</SelectItem>
                                    <SelectItem value="photo">Photo</SelectItem>
                                    <SelectItem value="instruction">Instruction</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Inspection Check Specifics */}
                        {field.type === "inspection_check" && (
                            <div className="flex gap-4 pt-2">
                                <Button variant="outline" className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" disabled>Pass</Button>
                                <Button variant="outline" className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800" disabled>Flag</Button>
                                <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" disabled>Fail</Button>
                            </div>
                        )}

                        {/* Image Preview */}
                        {field.image && (
                            <div className="relative w-32 h-32 group/image">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={field.image} alt="Field attachment" className="w-full h-full object-cover rounded-md border" />
                                <button
                                    onClick={() => onUpdate(field.id, { image: undefined })}
                                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover/image:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        <div className="bg-muted/30 p-3 rounded border border-dashed text-muted-foreground text-sm italic">
                            {field.placeholder || "Content will appear here"}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    id={`file-${field.id}`}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => onImageUpload(field.id, e)}
                                />
                                <label htmlFor={`file-${field.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" asChild>
                                        <span><ImageIcon className="h-4 w-4" /></span>
                                    </Button>
                                </label>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Collapsed View
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {getFieldIcon(field.type)}
                            <span className={cn("font-medium", !field.label && "text-muted-foreground italic")}>
                                {field.label || "Untitled Field"}
                            </span>
                            {field.required && <span className="text-xs text-destructive">*</span>}
                            {field.image && <ImageIcon className="h-4 w-4 text-muted-foreground ml-2" />}
                        </div>

                        {/* Inspection Check Preview in Collapsed State */}
                        {field.type === "inspection_check" && (
                            <div className="flex gap-4 pl-7 opacity-75">
                                <Button variant="outline" size="sm" className="flex-1 border-green-200 text-green-700 h-8 pointer-events-none">Pass</Button>
                                <Button variant="outline" size="sm" className="flex-1 border-orange-200 text-orange-700 h-8 pointer-events-none">Flag</Button>
                                <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-700 h-8 pointer-events-none">Fail</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function ProcedureBuilderContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const name = searchParams.get("name") || "Untitled Procedure"
    const description = searchParams.get("description")

    const [fields, setFields] = React.useState<FormField[]>([
        { id: "1", type: "text", label: "", required: false, placeholder: "Text will be entered here" }
    ])
    const [activeFieldId, setActiveFieldId] = React.useState<string | null>("1")

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

    const addField = (type: FieldType) => {
        const newId = Math.random().toString(36).substr(2, 9)
        const newField: FormField = {
            id: newId,
            type,
            label: "",
            required: false,
            placeholder: type === "text" ? "Text will be entered here" : undefined
        }
        setFields([...fields, newField])
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

    const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            updateField(id, { image: imageUrl })
        }
    }

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
                        <Label htmlFor="scoring" className="text-sm font-medium">Scoring</Label>
                        <Switch id="scoring" />
                    </div>
                    <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => router.push("/procedures")}>
                        Save Template
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="fields" className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-background border-b px-6">
                    <TabsList className="h-12 w-full justify-start gap-8 bg-transparent p-0">
                        <TabsTrigger
                            value="fields"
                            className="h-full rounded-none border-b border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Procedure Fields
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="h-full rounded-none border-b border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Settings
                        </TabsTrigger>
                    </TabsList>
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
                                    <div className="space-y-4">
                                        {fields.map((field) => (
                                            <SortableField
                                                key={field.id}
                                                field={field}
                                                isActive={activeFieldId === field.id}
                                                onActivate={() => setActiveFieldId(field.id)}
                                                onUpdate={updateField}
                                                onRemove={removeField}
                                                onImageUpload={handleImageUpload}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>

                    {/* Sidebar Toolbox */}
                    <div className="w-64 bg-background border-l p-4 flex flex-col gap-6">
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">New Item</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <ToolboxItem icon={Plus} label="Field" onClick={() => addField("text")} />
                                <ToolboxItem icon={Type} label="Heading" onClick={() => addField("heading")} />
                                <ToolboxItem icon={Layout} label="Section" onClick={() => { }} />
                                <ToolboxItem icon={FileText} label="Procedure" onClick={() => { }} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 overflow-y-auto p-8 m-0 data-[state=inactive]:hidden">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="bg-background border rounded-lg p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Tag your procedure</h3>
                                <p className="text-sm text-muted-foreground mb-4">Add tags to this procedure so you can easily find it on your Library</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Categories</Label>
                                        <Select>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Start typing..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="safety">Safety</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assets</Label>
                                        <Select>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Start typing..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hvac">HVAC Unit</SelectItem>
                                                <SelectItem value="generator">Generator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Locations</Label>
                                        <Select>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Start typing..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ny">New York Office</SelectItem>
                                                <SelectItem value="la">Los Angeles Warehouse</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background border rounded-lg p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Teams in charge</h3>
                                <p className="text-sm text-muted-foreground mb-4">Manage who is responsible for this procedure</p>

                                <div className="space-y-2">
                                    <Select>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Start typing..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="maintenance_team">Maintenance Team</SelectItem>
                                            <SelectItem value="safety_team">Safety Team</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background border rounded-lg p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Procedure Visibility</h3>
                                <p className="text-sm text-muted-foreground mb-4">Control who can see this procedure</p>

                                <RadioGroup defaultValue="private">
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
                    </div>
                </TabsContent>
            </Tabs>
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

function getFieldIcon(type: FieldType) {
    switch (type) {
        case "text": return <Type className="h-4 w-4 text-green-500" />
        case "checkbox": return <CheckSquare className="h-4 w-4 text-primary" />
        case "number": return <span className="h-4 w-4 flex items-center justify-center font-bold text-orange-500 text-xs">#</span>
        case "amount": return <span className="h-4 w-4 flex items-center justify-center font-bold text-green-600 text-xs">$</span>
        case "multiple_choice": return <ChevronDown className="h-4 w-4 text-purple-500" />
        case "checklist": return <CheckSquare className="h-4 w-4 text-blue-500" />
        case "inspection_check": return <Search className="h-4 w-4 text-indigo-500" />
        case "photo": return <ImageIcon className="h-4 w-4 text-pink-500" />
        case "instruction": return <FileText className="h-4 w-4 text-gray-500" />
        case "heading": return <Heading className="h-4 w-4 text-foreground" />
    }
}

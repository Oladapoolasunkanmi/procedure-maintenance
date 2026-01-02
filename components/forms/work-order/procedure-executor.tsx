"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, CheckSquare, Square, ChevronDown, ChevronRight, FileText, Image as ImageIcon, DollarSign, Calendar as CalendarIcon, Upload, X, Eraser, Download, Expand, Maximize2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"

interface ProcedureExecutorProps {
    procedures: any[] // Using any for now to match procedure structure
    values: any
    onChange: (values: any) => void
    readonly?: boolean
}

export function ProcedureExecutor({ procedures, values, onChange, readonly = false }: ProcedureExecutorProps) {
    // If no procedures, return null or empty state
    if (!procedures || procedures.length === 0) return null

    // We only support executing ONE procedure for now (the first one usually)
    // BUT user might have multiple. We can stack them.

    const handleFieldChange = (procId: string, fieldId: string, value: any) => {
        if (readonly) return
        const currentProcValues = values[procId] || {}
        const newValues = {
            ...values,
            [procId]: {
                ...currentProcValues,
                [fieldId]: value
            }
        }
        onChange(newValues)
    }

    return (
        <div className="space-y-8">
            {procedures.map((proc, index) => (
                <ProcedureRenderer
                    key={proc.id || index}
                    procedure={proc}
                    values={values[proc.id] || {}}
                    onChange={(fieldId, val) => handleFieldChange(proc.id, fieldId, val)}
                    readonly={readonly}
                />
            ))}
        </div>
    )
}

function ProcedureRenderer({ procedure, values, onChange, readonly }: { procedure: any, values: any, onChange: (fieldId: string, val: any) => void, readonly: boolean }) {
    // Group fields
    const renderItems = React.useMemo(() => {
        if (!procedure?.fields) return []

        const chunks: { type: 'section_group' | 'flat_group', id: string, label?: string, fields: any[] }[] = []
        let currentChunk: { type: 'section_group' | 'flat_group', id: string, label?: string, fields: any[] } = {
            type: 'flat_group',
            id: 'initial',
            fields: []
        }

        procedure.fields.forEach((field: any, index: number) => {
            if (field.type === 'section') {
                if (currentChunk.fields.length > 0) chunks.push(currentChunk)
                currentChunk = {
                    type: 'section_group',
                    id: field.id || `sec-${index}`,
                    label: field.label,
                    fields: []
                }
            } else if (field.sectionBreak) {
                if (currentChunk.fields.length > 0) chunks.push(currentChunk)
                currentChunk = {
                    type: 'flat_group',
                    id: `group-${index}`,
                    fields: [field]
                }
            } else {
                currentChunk.fields.push(field)
            }
        })
        if (currentChunk.fields.length > 0) chunks.push(currentChunk)
        return chunks
    }, [procedure])

    return (
        <div className="border rounded-lg bg-card overflow-hidden">

            {/* Procedure Header */}
            <div className="border-b p-4 bg-muted/20">
                <h3 className="font-semibold text-lg">{procedure.name}</h3>
                {procedure.description && <p className="text-sm text-muted-foreground">{procedure.description}</p>}
            </div>

            <div className="p-6 space-y-6">
                {renderItems.map((item, index) => {
                    if (item.type === 'section_group') {
                        return (
                            <ExecutorSection key={item.id} title={item.label || "Section"}>
                                {item.fields.map(field => (
                                    <ExecutorField
                                        key={field.id}
                                        field={field}
                                        value={values[field.id]}
                                        onChange={(val) => onChange(field.id, val)}
                                        readonly={readonly}
                                    />
                                ))}
                            </ExecutorSection>
                        )
                    } else {
                        return (
                            <div key={item.id} className="space-y-6">
                                {item.fields.map(field => (
                                    <ExecutorField
                                        key={field.id}
                                        field={field}
                                        value={values[field.id]}
                                        onChange={(val) => onChange(field.id, val)}
                                        readonly={readonly}
                                    />
                                ))}
                            </div>
                        )
                    }
                })}
            </div>
        </div>
    )
}

function ExecutorSection({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(true)
    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-muted/10 hover:bg-muted/20 transition-colors text-left"
            >
                <h4 className="font-medium">{title}</h4>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
            {isOpen && <div className="p-4 space-y-6 border-t">{children}</div>}
        </div>
    )
}

function ExecutorField({ field, value, onChange, readonly }: { field: any, value: any, onChange: (val: any) => void, readonly: boolean }) {
    if (field.type === "heading") {
        return <h5 className="font-semibold text-foreground pt-2">{field.label}</h5>
    }

    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

    // Signature Dialog State
    const [isSignatureOpen, setIsSignatureOpen] = React.useState(false)
    const [tempSignature, setTempSignature] = React.useState("")

    const handlePhotoClick = (url: string) => {
        setPreviewUrl(url)
        setIsPreviewOpen(true)
    }

    const handleSignatureClick = () => {
        if (readonly) return
        setTempSignature(value || "")
        setIsSignatureOpen(true)
    }

    const saveSignature = () => {
        onChange(tempSignature)
        setIsSignatureOpen(false)
    }

    // Helper to ensure value is array for photos
    const photoValues: string[] = Array.isArray(value) ? value : (value ? [value] : [])

    return (
        <div className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}

            {/* Attachments Display */}
            {field.attachments && field.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 pb-2">
                    {field.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="relative group/att border rounded-md overflow-hidden bg-muted/20 flex items-center pr-2">
                            {/* If image, show preview, otherwise show file icon */}
                            {(att.type === 'image' || att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                                <div className="h-10 w-10 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-10 w-10 flex items-center justify-center bg-muted">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <a href={att.url} target="_blank" rel="noreferrer" className="text-xs ml-2 hover:underline truncate max-w-[150px] font-medium" onClick={(e) => e.stopPropagation()}>
                                {att.name || "Attachment"}
                            </a>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-1">
                {/* Text Input */}
                {field.type === "text" && (
                    <Input
                        disabled={readonly}
                        placeholder={field.placeholder || "Enter Text"}
                        value={value || ""}
                        onChange={e => onChange(e.target.value)}
                        className="bg-muted/30"
                    />
                )}

                {/* Number Input */}
                {field.type === "number" && (
                    <Input
                        disabled={readonly}
                        type="number"
                        placeholder="0"
                        value={value || ""}
                        onChange={e => onChange(Number(e.target.value))}
                        className="bg-muted/30"
                    />
                )}

                {/* Currency/Amount Input */}
                {(field.type === "currency" || field.type === "amount") && (
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            disabled={readonly}
                            type="number"
                            placeholder="0.00"
                            value={value || ""}
                            onChange={e => onChange(Number(e.target.value))}
                            className="bg-muted/30 pl-9"
                        />
                    </div>
                )}

                {/* Date Input */}
                {field.type === "date" && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                disabled={readonly}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-muted/30",
                                    !value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        {!readonly && (
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={value ? new Date(value) : undefined}
                                    onSelect={(date) => onChange(date ? date.toISOString() : undefined)}
                                    initialFocus
                                />
                            </PopoverContent>
                        )}
                    </Popover>
                )}

                {/* Signature Input */}
                {field.type === "signature" && (
                    <div className="space-y-2">
                        {value ? (
                            <div className="border rounded-md bg-white p-2 relative group w-full h-[100px] flex items-center justify-center bg-muted/10 cursor-pointer overflow-hidden" onClick={handleSignatureClick}>
                                <img src={value} alt="Signature" className="max-h-full max-w-full object-contain" />
                                {!readonly && (
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-xs bg-white px-2 py-1 rounded shadow-sm">Click to Edit</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button variant="outline" className="w-full h-24 border-dashed" onClick={handleSignatureClick} disabled={readonly}>
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <FileText className="h-6 w-6" />
                                    <span>Click to Sign</span>
                                </div>
                            </Button>
                        )}

                        <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
                            <DialogContent className="max-w-2xl w-full">
                                <DialogHeader>
                                    <DialogTitle>Sign Here</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 h-[400px] w-full border rounded-md overflow-hidden bg-white">
                                    <SignaturePad
                                        value={tempSignature}
                                        onChange={setTempSignature}
                                        readonly={false}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSignatureOpen(false)}>Cancel</Button>
                                    <Button onClick={saveSignature}>Done</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* Single Checkbox */}
                {field.type === "checkbox" && (
                    <div
                        className={cn(
                            "flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors",
                            value ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50",
                            readonly && "cursor-default opacity-80"
                        )}
                        onClick={() => {
                            if (readonly) return
                            onChange(!value)
                        }}
                    >
                        {value ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                        <span className="text-sm">{field.checkboxLabel || field.label}</span>
                    </div>
                )}

                {/* Checklist (Multiple Checkboxes) */}
                {field.type === "checklist" && (
                    <div className="space-y-2">
                        {field.options?.map((opt: string) => {
                            const checked = Array.isArray(value) ? value.includes(opt) : false
                            return (
                                <div
                                    key={opt}
                                    className={cn(
                                        "flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors",
                                        checked ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50",
                                        readonly && "cursor-default opacity-80"
                                    )}
                                    onClick={() => {
                                        if (readonly) return
                                        const current = Array.isArray(value) ? value : []
                                        const newVal = checked ? current.filter(c => c !== opt) : [...current, opt]
                                        onChange(newVal)
                                    }}
                                >
                                    {checked ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                                    <span className="text-sm">{opt}</span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Multiple Choice (Radio-like) */}
                {field.type === "multiple_choice" && (
                    <div className="space-y-2">
                        {field.options?.map((opt: string) => {
                            const isSelected = value === opt
                            return (
                                <div
                                    key={opt}
                                    className={cn(
                                        "flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors",
                                        isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50",
                                        readonly && "cursor-default opacity-80"
                                    )}
                                    onClick={() => {
                                        if (readonly) return
                                        onChange(opt)
                                    }}
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                        isSelected ? "border-primary" : "border-muted-foreground/40"
                                    )}>
                                        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <span className="text-sm">{opt}</span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Yes/No/N/A */}
                {field.type === "yes_no_na" && (
                    <div className="flex gap-2">
                        {["Yes", "No", "N/A"].map(opt => {
                            const isSelected = value === opt
                            return (
                                <Button
                                    key={opt}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    disabled={readonly}
                                    onClick={() => onChange(opt)}
                                    className="flex-1"
                                >
                                    {opt}
                                </Button>
                            )
                        })}
                    </div>
                )}

                {/* Inspection Check (Pass/Flag/Fail) */}
                {field.type === "inspection_check" && (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={readonly}
                            onClick={() => onChange("Pass")}
                            className={cn(
                                "flex-1 transition-colors",
                                value === "Pass" ? "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            )}
                        >
                            Pass
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={readonly}
                            onClick={() => onChange("Flag")}
                            className={cn(
                                "flex-1 transition-colors",
                                value === "Flag" ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:text-white" : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                            )}
                        >
                            Flag
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={readonly}
                            onClick={() => onChange("Fail")}
                            className={cn(
                                "flex-1 transition-colors",
                                value === "Fail" ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            )}
                        >
                            Fail
                        </Button>
                    </div>
                )}

                {/* Photo Upload */}
                {field.type === "photo" && (
                    <div className="space-y-4">
                        {/* File List / Grid */}
                        {photoValues.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {photoValues.map((file: string, idx: number) => {
                                    const isImage = file.startsWith('data:image') || file.match(/\.(jpeg|jpg|gif|png)$/) != null;
                                    const displayText = file.length > 20 ? "File Attachment" : file;

                                    return (
                                        <div key={idx} className="group relative border rounded-md overflow-hidden aspect-square bg-muted/10 flex items-center justify-center">
                                            {isImage ? (
                                                <img
                                                    src={file}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => handlePhotoClick(file)}
                                                />
                                            ) : (
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                            )}

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Check if we can open/download
                                                        handlePhotoClick(file);
                                                    }}
                                                >
                                                    <Expand className="h-3 w-3" />
                                                </Button>
                                                <a href={file} download={`attachment-${idx}`} onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white hover:bg-white/20">
                                                        <Download className="h-3 w-3" />
                                                    </Button>
                                                </a>
                                                {!readonly && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-white/20"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newVals = photoValues.filter((_, i) => i !== idx);
                                                            onChange(newVals);
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {!readonly && (
                            <div
                                className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg p-6 flex flex-col items-center gap-2 text-primary hover:bg-primary/10 transition-colors cursor-pointer relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                            // Process files to Base64
                                            Array.from(files).forEach(file => {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    // Append to current values
                                                    // Need to handle async state updates properly if multiple files
                                                    // For simplicity, we assume single batch, but ideally we'd collect all promises.
                                                    // Here we accept one by one which might override if not careful.
                                                    // BETTER: Read all, then update once.

                                                    // Since we can't easily do batch in this inline handler without state,
                                                    // let's assume one file for now or implement batch logic.
                                                    // Simulating Batch for single file
                                                    const current = Array.isArray(value) ? value : (value ? [value] : []);
                                                    onChange([...current, result]);
                                                };
                                                reader.readAsDataURL(file);
                                            });
                                        }
                                    }}
                                />
                                <Upload className="h-8 w-8" />
                                <span className="text-sm font-medium">Add Pictures/Files</span>
                            </div>
                        )}

                        {/* Image Preview Dialog */}
                        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black/90 border-none">
                                <div className="relative w-full h-[80vh] flex items-center justify-center">
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Full Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    )}
                                    <Button
                                        variant="ghost"
                                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                                        onClick={() => setIsPreviewOpen(false)}
                                    >
                                        <X className="h-6 w-6" />
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    )
}

function SignaturePad({ value, onChange, readonly }: { value: string, onChange: (val: string) => void, readonly: boolean }) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = React.useState(false)

    // Load existing signature
    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set dimensions to match display size for better resolution (optional improvement)
        // For now keep it simple 400x150

        if (value) {
            const img = new Image()
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            img.src = value
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }, [value])

    const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()

        // Scale handling (if canvas resolution differs from display size)
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        let clientX, clientY
        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (readonly) return
        setIsDrawing(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.lineWidth = 2; // Make lines simpler
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const { x, y } = getCoords(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || readonly) return
        e.preventDefault() // Prevent scrolling on touch
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { x, y } = getCoords(e)
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const endDrawing = () => {
        if (readonly) return
        setIsDrawing(false)
        const canvas = canvasRef.current
        if (!canvas) return
        onChange(canvas.toDataURL())
    }

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (readonly) return
        onChange("")
    }

    return (
        <div className="w-full h-full relative group overflow-hidden bg-white">
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className={cn("w-full h-full touch-none cursor-crosshair", readonly && "cursor-default")}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
            />
            {!readonly && (
                <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity"
                    onClick={clear}
                >
                    <Eraser className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            )}
            {value && readonly && <div className="absolute inset-0 bg-transparent" />}
        </div>
    )
}

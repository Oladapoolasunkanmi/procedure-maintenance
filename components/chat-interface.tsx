"use client"

import * as React from "react"
import { Send, Mic, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export interface ChatMessage {
    id: string
    sender: "me" | "other"
    text: string
    timestamp: string
    senderName?: string
    senderAvatar?: string
    attachments?: { name: string, type: string, url: string }[]
}

interface ChatInterfaceProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    messages: ChatMessage[]
    onSendMessage: (text: string, attachments?: File[]) => void
    currentUserId?: string
}

export function ChatInterface({
    open,
    onOpenChange,
    title = "Comments",
    messages,
    onSendMessage,
    currentUserId
}: ChatInterfaceProps) {
    const [inputValue, setInputValue] = React.useState<{ text: string, attachments: File[] }>({ text: "", attachments: [] })

    const handleSend = () => {
        if (!inputValue.text.trim() && inputValue.attachments.length === 0) return
        // You might need to handle file uploads here (e.g., convert to base64 or upload to server)
        // For now, we'll just pass the text. Ideally onSendMessage should accept attachments too.
        onSendMessage(inputValue.text, inputValue.attachments)
        setInputValue({ text: "", attachments: [] })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 h-full">
                <SheetHeader className="p-4 border-b flex-shrink-0">
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4 min-h-0">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.sender === "me" ? "flex-row-reverse" : ""}`}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.sender === "me" ? "https://github.com/shadcn.png" : undefined} />
                                    <AvatarFallback>{msg.sender === "me" ? "ME" : "OT"}</AvatarFallback>
                                </Avatar>
                                <div
                                    className={`rounded-lg p-3 max-w-[80%] text-sm ${msg.sender === "me"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                        }`}
                                >
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="rounded overflow-hidden">
                                                    {att.type.startsWith('image/') ? (
                                                        <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer">
                                                            <img src={att.url} alt={att.name} className="max-w-[150px] max-h-[150px] object-cover rounded" />
                                                        </a>
                                                    ) : (
                                                        <a href={att.url} download={att.name} className="flex items-center gap-1 text-xs underline">
                                                            <Paperclip className="h-3 w-3" />
                                                            {att.name}
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p>{msg.text}</p>
                                    <span className={`text-[10px] mt-1 block opacity-70 ${msg.sender === "me" ? "text-primary-foreground" : "text-muted-foreground"}`}>
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="relative p-4 border-t mt-auto bg-background z-20 flex-shrink-0">
                    {/* File Previews - Absolute positioned "tray" */}
                    {inputValue.attachments && inputValue.attachments.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 bg-background border-t p-2 flex gap-2 overflow-x-auto z-10 shadow-sm">
                            {inputValue.attachments.map((file, i) => (
                                <div key={i} className="relative flex-shrink-0 group">
                                    <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <Paperclip className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newFiles = [...inputValue.attachments!]
                                            newFiles.splice(i, 1)
                                            setInputValue({ ...inputValue, attachments: newFiles })
                                        }}
                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow-sm"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            id="chat-file-upload"
                            className="hidden"
                            multiple
                            onChange={(e) => {
                                if (e.target.files) {
                                    setInputValue({
                                        ...inputValue,
                                        attachments: [...(inputValue.attachments || []), ...Array.from(e.target.files)]
                                    })
                                }
                            }}
                        />
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                            <label htmlFor="chat-file-upload" className="cursor-pointer">
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                            </label>
                        </Button>

                        <Input
                            placeholder="Type a message..."
                            value={inputValue.text}
                            onChange={(e) => setInputValue({ ...inputValue, text: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="flex-1"
                        />
                        <Button size="icon" onClick={handleSend} disabled={!inputValue.text.trim() && (!inputValue.attachments || inputValue.attachments.length === 0)}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

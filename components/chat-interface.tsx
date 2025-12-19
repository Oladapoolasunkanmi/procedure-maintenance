"use client"

import * as React from "react"
import { Send, Mic, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface Message {
    id: string
    sender: "me" | "other"
    text: string
    timestamp: string
    attachments?: string[]
}

const MOCK_MESSAGES: Message[] = [
    {
        id: "1",
        sender: "other",
        text: "Hey, I noticed the wrapper belt is loose again.",
        timestamp: "10:30 AM",
    },
    {
        id: "2",
        sender: "me",
        text: "Thanks for reporting. I'll check it out during the inspection.",
        timestamp: "10:32 AM",
    },
    {
        id: "3",
        sender: "other",
        text: "Great, let me know if you need any help.",
        timestamp: "10:35 AM",
    },
]

interface ChatInterfaceProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
}

export function ChatInterface({ open, onOpenChange, title = "Comments" }: ChatInterfaceProps) {
    const [messages, setMessages] = React.useState<Message[]>(MOCK_MESSAGES)
    const [inputValue, setInputValue] = React.useState("")

    const handleSend = () => {
        if (!inputValue.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: "me",
            text: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }

        setMessages([...messages, newMessage])
        setInputValue("")
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4">
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
                                    <p>{msg.text}</p>
                                    <span className={`text-[10px] mt-1 block opacity-70 ${msg.sender === "me" ? "text-primary-foreground" : "text-muted-foreground"}`}>
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t mt-auto">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <Mic className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Input
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="flex-1"
                        />
                        <Button size="icon" onClick={handleSend} disabled={!inputValue.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

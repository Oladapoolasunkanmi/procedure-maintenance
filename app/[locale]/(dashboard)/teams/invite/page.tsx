"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2, Plus, X, ChevronLeft, Loader2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface InviteRow {
    id: string
    name: string
    emailOrPhone: string
    accountType: string
}

import { useTranslations } from "next-intl"

export default function InviteUsersPage() {
    const t = useTranslations('Teams')
    const router = useRouter()
    const { toast } = useToast()
    const [invites, setInvites] = useState<InviteRow[]>([
        { id: "1", name: "", emailOrPhone: "", accountType: "Requester Only" }
    ])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [suggestions, setSuggestions] = useState<{ [key: string]: any[] }>({})
    const timeouts = useRef<{ [key: string]: NodeJS.Timeout }>({})

    const addRow = () => {
        setInvites([
            ...invites,
            { id: Date.now().toString(), name: "", emailOrPhone: "", accountType: "Requester Only" }
        ])
    }

    const removeRow = (id: string) => {
        if (invites.length === 1) return
        setInvites(invites.filter(row => row.id !== id))
        const newSuggestions = { ...suggestions }
        delete newSuggestions[id]
        setSuggestions(newSuggestions)
    }

    const updateRow = (id: string, field: keyof InviteRow, value: string) => {
        setInvites(invites.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ))

        if (field === "name" || field === "emailOrPhone") {
            if (timeouts.current[id]) {
                clearTimeout(timeouts.current[id])
            }

            if (value.length < 2) {
                setSuggestions({ ...suggestions, [id]: [] })
                return
            }

            timeouts.current[id] = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/graph/users?q=${encodeURIComponent(value)}`)
                    if (res.ok) {
                        const data = await res.json()
                        setSuggestions(prev => ({ ...prev, [id]: data.items || [] }))
                    }
                } catch (error) {
                    console.error("Failed to fetch suggestions", error)
                }
            }, 300)
        }
    }

    const selectUser = (rowId: string, user: any) => {
        setInvites(invites.map(row =>
            row.id === rowId ? {
                ...row,
                name: user.name,
                emailOrPhone: user.email || user.contact || "",
                // Preserve account type or map it if user has one? 
                // Requirement says "autopopulated", usually implies details.
                // But account type might be what we want to *assign*?
                // I'll keep the one selected or default, but if user has a role, maybe use it?
                // Let's just fill name/email for now.
            } : row
        ))
        setSuggestions({ ...suggestions, [rowId]: [] })
    }

    const handleSendInvites = async () => {
        setIsSubmitting(true)
        try {
            const promises = invites.map(async (invite) => {
                // Check if user already exists (by email) to determine ID or update
                let existing = null
                try {
                    const checkRes = await fetch(`/api/users?email=${encodeURIComponent(invite.emailOrPhone)}`)
                    const checkData = await checkRes.json()
                    if (checkData.items && checkData.items.length > 0) {
                        existing = checkData.items[0]
                    }
                } catch (e) {
                    console.error("Failed to check existing user", e)
                }

                const userData = {
                    id: existing ? (existing._id || existing.id) : `u${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: invite.name,
                    email: invite.emailOrPhone,
                    role: invite.accountType,
                    hasJoined: existing ? existing.hasJoined : false, // Preserve or set false
                    createdAt: existing ? existing.createdAt : new Date().toISOString(),
                    // Add other fields as needed
                }

                let res;
                if (existing) {
                    res = await fetch("/api/users", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...userData })
                    })
                } else {
                    res = await fetch("/api/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(userData)
                    })
                }

                if (!res.ok) throw new Error(`Failed to invite ${invite.name}`)
                return res.json()
            })

            await Promise.all(promises)

            toast({
                title: t('invite.toast.sentTitle'),
                description: t('invite.toast.sentDesc', { count: invites.length }),
            })

            router.push("/teams")
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to send invites. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText("https://opscmms.com/invite/xyz123")
        toast({
            title: t('invite.toast.linkTitle'),
            description: t('invite.toast.linkDesc'),
        })
    }

    return (
        <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{t('invite.title')}</h1>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-1">
                            <div className="col-span-4">{t('invite.columns.name')}</div>
                            <div className="col-span-5">{t('invite.columns.contact')}</div>
                            <div className="col-span-3">{t('invite.columns.type')}</div>
                        </div>

                        {invites.map((row) => (
                            <div key={row.id} className="grid grid-cols-12 gap-4 items-start relative">
                                <div className="col-span-4 relative">
                                    <Input
                                        placeholder=""
                                        value={row.name}
                                        onChange={(e) => updateRow(row.id, "name", e.target.value)}
                                        className="w-full"
                                    />
                                    {suggestions[row.id] && suggestions[row.id].length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                            {suggestions[row.id].map(user => (
                                                <div
                                                    key={user.id || user._id}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => selectUser(row.id, user)}
                                                >
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-5">
                                    <Input
                                        placeholder=""
                                        value={row.emailOrPhone}
                                        onChange={(e) => updateRow(row.id, "emailOrPhone", e.target.value)}
                                    />
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Select
                                        value={row.accountType}
                                        onValueChange={(value) => updateRow(row.id, "accountType", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Administrator">Administrator</SelectItem>
                                            <SelectItem value="Full User">Full User</SelectItem>
                                            <SelectItem value="Requester Only">Requester Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {invites.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRow(row.id)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        onClick={addRow}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('invite.addAnother')}
                    </Button>

                    <div className="flex flex-col items-center gap-4 pt-8 max-w-md mx-auto">
                        <Button
                            className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold data-[active=true]:bg-orange-600 data-[active=true]:text-white data-[active=true]:hover:bg-orange-700"
                            onClick={handleSendInvites}
                            disabled={isSubmitting || invites.some(r => !r.name || !r.emailOrPhone)}
                            data-active={!invites.some(r => !r.name || !r.emailOrPhone)}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('invite.send')}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={handleCopyLink}
                        >
                            <Link2 className="mr-2 h-4 w-4" />
                            {t('invite.getLink')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { useState } from "react"
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
        { id: "1", name: "", emailOrPhone: "", accountType: "full" }
    ])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const addRow = () => {
        setInvites([
            ...invites,
            { id: Date.now().toString(), name: "", emailOrPhone: "", accountType: "full" }
        ])
    }

    const removeRow = (id: string) => {
        if (invites.length === 1) return
        setInvites(invites.filter(row => row.id !== id))
    }

    const updateRow = (id: string, field: keyof InviteRow, value: string) => {
        setInvites(invites.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ))
    }

    const handleSendInvites = async () => {
        setIsSubmitting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast({
            title: t('invite.toast.sentTitle'),
            description: t('invite.toast.sentDesc', { count: invites.length }),
        })

        setIsSubmitting(false)
        router.push("/teams")
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
                            <div key={row.id} className="grid grid-cols-12 gap-4 items-start">
                                <div className="col-span-4">
                                    <Input
                                        placeholder=""
                                        value={row.name}
                                        onChange={(e) => updateRow(row.id, "name", e.target.value)}
                                    />
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
                                            <SelectItem value="full">{t('invite.types.full')}</SelectItem>
                                            <SelectItem value="limited">{t('invite.types.limited')}</SelectItem>
                                            <SelectItem value="admin">{t('invite.types.admin')}</SelectItem>
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
                            className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold"
                            onClick={handleSendInvites}
                            disabled={isSubmitting || invites.some(r => !r.name || !r.emailOrPhone)}
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

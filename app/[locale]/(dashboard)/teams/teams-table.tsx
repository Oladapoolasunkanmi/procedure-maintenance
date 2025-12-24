"use client"

import { useState, useRef, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus, Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { User, Team, users as initialUsers, teams as initialTeams } from "@/lib/data"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"


import { useTranslations } from "next-intl"

export function TeamsTable() {
    const t = useTranslations('Teams')
    const [searchTerm, setSearchTerm] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [teams, setTeams] = useState<Team[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) return res.json()
                return null
            })
            .then(data => {
                if (data) {
                    setCurrentUser(data)
                    setUsers(prev => {
                        if (!prev.find(u => u.id === data.sub)) {
                            return [...prev, {
                                id: data.sub,
                                name: data.name || "Current User",
                                email: data.email || "",
                                avatar: "",
                                role: "Administrator",
                                lastVisit: "Just now"
                            }]
                        }
                        return prev
                    })
                }
            })
            .catch(err => console.error("Failed to fetch user", err))
    }, [])

    // Fetch teams on mount
    const fetchTeams = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/teams")
            const data = await res.json()
            if (data.items) {
                // Map API response items to our Team interface
                const mappedTeams = data.items.map((item: any) => ({
                    ...item,
                    id: item._id || item.id, // Ensure id is mapped
                }))
                setTeams(mappedTeams)
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error)
            toast({
                title: t('messages.error'),
                description: t('messages.loadFail'),
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTeams()
    }, [])

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false)
    const [newTeam, setNewTeam] = useState<Partial<Team>>({
        color: "blue",
        isEscalation: false
    })

    // Delete Confirmation State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [teamToDelete, setTeamToDelete] = useState<string | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Sanitize filename
            const parts = file.name.split('.')
            const ext = parts.pop()
            const base = parts.join('.')
            const sanitizedBase = base.replace(/[^a-zA-Z0-9]/g, "")
            const path = `andechser_maintenance_system/${sanitizedBase}.${ext}`

            const formData = new FormData()
            formData.append("path", path)
            formData.append("file", file)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) throw new Error("Upload failed")

            const data = await res.json()
            setNewTeam(prev => ({ ...prev, image: data.path }))
            toast({
                title: "Image uploaded",
                description: "Team icon updated successfully",
            })
        } catch (error) {
            console.error(error)
            toast({
                title: t('messages.uploadFail'),
                description: t('messages.uploadFailDesc'),
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    const [isSaving, setIsSaving] = useState(false)

    const handleCreateTeam = async () => {
        setIsSaving(true)
        try {
            const isEditing = !!newTeam.id
            const adminId = newTeam.administratorId || currentUser?.sub || users[0]?.id

            // Ensure admin is in memberIds
            const currentMembers = newTeam.memberIds || []
            if (adminId && !currentMembers.includes(adminId)) {
                currentMembers.push(adminId)
            }

            const teamData = {
                ...newTeam,
                id: isEditing ? newTeam.id : `t${Date.now()}`,
                memberIds: currentMembers,
                createdAt: isEditing ? newTeam.createdAt : new Date().toISOString(),
                administratorId: adminId
            }

            const url = isEditing ? "/api/teams" : "/api/teams"
            const method = isEditing ? "PUT" : "POST"

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(teamData)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || `Failed to ${isEditing ? "upate" : "create"} team`)
            }

            await fetchTeams()

            setIsCreateDialogOpen(false)
            if (!isEditing) {
                setIsAddMembersDialogOpen(true)
            }

            toast({
                title: isEditing ? t('messages.updated') : t('messages.created'),
                description: t('messages.success', { name: teamData.name || "Team", action: isEditing ? "updated" : "created" })
            })
            // Reset state
            setNewTeam({ color: "blue", isEscalation: false })
        } catch (error: any) {
            console.error(error)
            toast({
                title: t('messages.error'),
                description: error.message || t('messages.opFail'),
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setTeamToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const confirmDeleteTeam = async () => {
        if (!teamToDelete) return

        try {
            const res = await fetch(`/api/teams?id=${teamToDelete}`, {
                method: "DELETE"
            })

            if (!res.ok) {
                throw new Error("Failed to delete team")
            }

            await fetchTeams()
            toast({
                title: t('messages.deleted'),
                description: t('messages.deleteSuccess')
            })
        } catch (error) {
            console.error(error)
            toast({
                title: t('messages.error'),
                description: t('messages.deleteFail'),
                variant: "destructive"
            })
        } finally {
            setIsDeleteDialogOpen(false)
            setTeamToDelete(null)
        }
    }

    const openEditDialog = (team: Team, e: React.MouseEvent) => {
        e.stopPropagation()
        setNewTeam(team)
        setIsCreateDialogOpen(true)
    }

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const colors = ["blue", "green", "yellow", "red", "teal", "pink", "purple", "orange"]


    const [inviteEmail, setInviteEmail] = useState("")
    const [isInviting, setIsInviting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleInviteMember = async () => {
        setIsInviting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast({
            title: t('messages.invited'),
            description: `Invitation sent to ${inviteEmail}`,
        })

        setIsInviting(false)
        setIsAddMembersDialogOpen(false)
        setInviteEmail("")
    }

    return (
        <div className="space-y-4">
            {/* ... (Search and Create Button remain same) ... */}
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createTeam')}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.name')}</TableHead>
                            <TableHead>{t('table.admin')}</TableHead>
                            <TableHead>{t('table.members')}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                                        <p className="text-muted-foreground text-sm">{t('empty.loading')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTeams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                    {t('empty.noTeams')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTeams.map((team) => {
                                const admin = users.find(u => u.id === team.administratorId)
                                return (
                                    <TableRow
                                        key={team.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.push(`/teams/${team._id || team.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden relative`} style={{ backgroundColor: team.image ? 'transparent' : (team.color === 'blue' ? '#3b82f6' : team.color) }}>
                                                    {team.image ? (
                                                        <img
                                                            src={`/api/image?path=${encodeURIComponent(team.image)}`}
                                                            alt={team.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        team.name.substring(0, 1).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{team.name}</span>
                                                    <span className="text-xs text-muted-foreground">{team.description}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {admin ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={admin.avatar} />
                                                        <AvatarFallback>{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{admin.name}</span>
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {team.memberIds.slice(0, 3).map(mid => {
                                                        const m = users.find(u => u.id === mid)
                                                        if (!m) return null
                                                        return (
                                                            <Avatar key={mid} className="h-6 w-6 border-2 border-background">
                                                                <AvatarImage src={m.avatar} />
                                                                <AvatarFallback>{m.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                        )
                                                    })}
                                                </div>
                                                <span className="text-sm text-muted-foreground">{team.memberIds.length} Member{team.memberIds.length !== 1 && 's'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => openEditDialog(team, e)}>
                                                        {t('actions.edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={(e) => handleDeleteClick(team.id, e)}
                                                    >
                                                        {t('actions.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            }))
                        }
                    </TableBody>
                </Table>
            </div>

            {/* Create Team Dialog (Unchanged logic, just keeping structure valid) */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{newTeam.id ? t('form.editTitle') : t('form.newTitle')}</DialogTitle>
                    </DialogHeader>
                    {/* ... (Create Dialog Content same as before) ... */}
                    <div className="space-y-6 py-4">
                        <div className="flex justify-center">
                            <div
                                className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                ) : newTeam.image ? (
                                    <img
                                        src={newTeam.image.startsWith("andechser_") ? `/api/image?path=${encodeURIComponent(newTeam.image)}` : newTeam.image}
                                        alt="Team Icon"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <>
                                        <div className={`h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold`} style={{ backgroundColor: newTeam.color === 'blue' ? '#3b82f6' : newTeam.color }}>
                                            {(newTeam.name || "+").substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1 text-white border-2 border-white">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('form.nameLabel')}</Label>
                            <Input
                                placeholder={t('form.namePlaceholder')}
                                value={newTeam.name || ""}
                                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('form.descLabel')}</Label>
                            <Textarea
                                placeholder={t('form.descPlaceholder')}
                                value={newTeam.description || ""}
                                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('form.colorLabel')}</Label>
                            <div className="flex gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 ${newTeam.color === color ? 'border-black' : 'border-transparent'}`}
                                        style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color }}
                                        onClick={() => setNewTeam({ ...newTeam, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('form.escalationLabel')}</Label>
                            <p className="text-sm text-muted-foreground mb-2">{t('form.escalationDesc')}</p>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="escalation"
                                    checked={newTeam.isEscalation}
                                    onCheckedChange={(c) => setNewTeam({ ...newTeam, isEscalation: c as boolean })}
                                />
                                <Label htmlFor="escalation" className="font-normal">{t('form.criticalParts')}</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>{t('form.cancel')}</Button>
                        <Button
                            onClick={handleCreateTeam}
                            disabled={!newTeam.name || isSaving}
                            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {newTeam.id ? t('form.save') : t('form.create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Members Dialog - Updated */}
            <Dialog open={isAddMembersDialogOpen} onOpenChange={setIsAddMembersDialogOpen}>
                <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t('dialog.addMembers')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 flex-1 space-y-4">
                        <Input
                            placeholder={t('dialog.searchUser')}
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />

                        {!inviteEmail ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground -mt-10">
                                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 text-orange-600" />
                                </div>
                                <p>{t('empty.noMembers')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 -mt-10">
                                <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mb-2">
                                    <Search className="h-10 w-10 text-orange-500" />
                                </div>
                                <p className="text-muted-foreground text-center px-4">
                                    No results found for &quot;{inviteEmail}&quot;.
                                </p>
                                <Button
                                    className="bg-orange-600 hover:bg-orange-700 text-white w-full max-w-sm mt-4"
                                    onClick={handleInviteMember}
                                    disabled={isInviting}
                                >
                                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('dialog.invite', { email: inviteEmail })}
                                </Button>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddMembersDialogOpen(false)} className="text-orange-600">{t('dialog.skip')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('dialog.deleteTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>{t('dialog.deleteDesc')}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t('form.cancel')}</Button>
                        <Button variant="destructive" onClick={confirmDeleteTeam}>{t('dialog.deleteConfirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

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
import { MoreVertical, Plus, Search, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { User, Team, users as initialUsers, teams as initialTeams } from "@/lib/data"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

    // Fetch teams and users on mount
    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [teamsRes, usersRes] = await Promise.all([
                fetch("/api/teams"),
                fetch("/api/users")
            ])

            const teamsData = await teamsRes.json()
            const usersData = await usersRes.json()

            if (teamsData.items) {
                const mappedTeams = teamsData.items.map((item: any) => ({
                    ...item,
                    id: item._id || item.id,
                }))
                setTeams(mappedTeams)
            }

            if (usersData.items) {
                const mappedUsers = usersData.items.map((item: any) => ({
                    ...item,
                    id: item._id || item.id,
                }))
                setUsers(mappedUsers)
            }

        } catch (error) {
            console.error("Failed to fetch data:", error)
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
        fetchData()
    }, [])

    // ... (Dialog states) ...
    // ... (Dialog states) ...

    const handleAddMember = async () => {
        // Logic to add selectedMembers to the team (if we have a current team context)
        // But the dialog seems to be for a *newly created* team?
        // "On the dialog to add members to a team... once user chosen... add as chip... add multiple members"
        // Is this dialog for an existing team or the flow after creating a team?
        // The code `if (!isEditing) { setIsAddMembersDialogOpen(true) }` (line 199) suggests it opens after creating a team.
        // It doesn't seem to pass the `newTeam` ID to the dialog explicitly, but `newTeam` state might still hold it? 
        // Actually `newTeam` is reset on line 208.
        // We probably need to track which team we are adding members to. 
        // But let's assume valid flow:
        // If we just created a team, we need its ID. `teamData` had it (line 176).
        // But `newTeam` state is reset.
        // The previous code didn't seem to have a target team for "Add members" dialog except maybe conceptually? 
        // Ah, `handleCreateTeam` calls `fetchTeams`. The new team is in the list.
        // But how does "Add Members" dialog know which team?
        // Maybe we should store `createdTeamId`?

        // Wait, the user requirement says: "On the dialog to add members to a team..."
        // If I look at the screenshot, it's "Add Members to the Team".

        // Let's check `handleCreateTeam` again.
        // It resets `newTeam`.
        // So `isAddMembersDialogOpen` is true, but we don't know which team.

        // I will modify `handleCreateTeam` to NOT reset `newTeam` immediately or store the ID.
        // Or cleaner: `createdTeamId` state.
    }

    // Actually, I will search for the code chunk and replace the whole component's logical parts.

    // Re-implementation of Add Members Dialog Logic:

    // Re-implementation of Add Members Dialog Logic:

    // ... inside handleCreateTeam ...
    // Store ID before reset.
    // setCreatedTeamId(teamData.id)
    // ...

    // ... Dialog UI ...
    // Remove the "invite email" logic.
    // Use multi-select logic.

    // Let's implement this in parts using `replace_file_content` or `multi_replace`.
    // I'll use `replace_file_content` for the whole file if I can, but it is large.
    // The previous view_file `lines 1 to 581` shows it fits in one view. 
    // I need to be careful with `replace_file_content` on large files.
    // I'll try `multi_replace_file_content`.

    // 1. Update `fetchTeams` to `fetchData` (users + teams).
    // 2. Update `handleCreateTeam` to set `createdTeamId`.
    // 3. Update `Add Members` dialog JSX.

    // Let's start with `fetchData` and `useEffect`.



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

    // Add Members Dialog State
    // Add Members Dialog State
    const [selectedTeams, setSelectedTeams] = useState<string[]>([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [createdTeamId, setCreatedTeamId] = useState<string | null>(null)
    const [selectedMembers, setSelectedMembers] = useState<User[]>([])
    const [memberSearch, setMemberSearch] = useState("")

    // ... existing handleFileUpload ...

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTeams(filteredTeams.map(t => t.id))
        } else {
            setSelectedTeams([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedTeams(prev => [...prev, id])
        } else {
            setSelectedTeams(prev => prev.filter(tid => tid !== id))
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(t('dialog.deleteConfirm'))) return // Basic confirmation or use Dialog? User didn't specify, but safer. 
        // Or re-use the delete dialog logic? 
        // Let's use a simple confirm for bulk or just proceed with isBulkDeleting state if explicit button clicked.

        setIsBulkDeleting(true)
        try {
            await Promise.all(selectedTeams.map(id =>
                fetch(`/api/teams?id=${id}`, { method: "DELETE" })
            ))
            await fetchData()
            setSelectedTeams([])
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
            setIsBulkDeleting(false)
        }
    }

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

            // Do NOT auto-assign current user as admin or member
            const adminId = newTeam.administratorId // Keep existing if any, or undefined.
            const currentMembers = newTeam.memberIds || []

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

            const responseData = await res.json()

            await fetchData()

            setIsCreateDialogOpen(false)
            if (!isEditing) {
                // Use the ID returned by the API (item_id) if available, otherwise fallback
                const newId = responseData.item_id || teamData.id
                setCreatedTeamId(newId as string)
                setSelectedMembers([])
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

            await fetchData()
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
                <div className="flex items-center gap-2">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    {selectedTeams.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('actions.delete')} ({selectedTeams.length})
                        </Button>
                    )}
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
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredTeams.length > 0 && selectedTeams.length === filteredTeams.length}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                            </TableHead>
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
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedTeams.includes(team.id)}
                                                onCheckedChange={(checked) => handleSelectOne(team.id, checked as boolean)}
                                            />
                                        </TableCell>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('dialog.addMembers')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md min-h-[42px]">
                            {selectedMembers.map(member => (
                                <Badge key={member.id} variant="secondary" className="gap-1 pr-1">
                                    {member.name}
                                    <button
                                        onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))}
                                        className="hover:bg-muted rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            <Input
                                className="border-0 focus-visible:ring-0 px-1 min-w-[120px] flex-1 h-6"
                                placeholder={selectedMembers.length === 0 ? t('dialog.searchUser') : ""}
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                            />
                        </div>

                        {/* List users by default (excluding selected) */}
                        <div className="border rounded-md min-h-120 max-h-120 overflow-y-auto">
                            {users
                                .filter(u =>
                                    !selectedMembers.find(m => m.id === u.id) &&
                                    (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                        u.email.toLowerCase().includes(memberSearch.toLowerCase()))
                                )
                                .slice(0, 50) // Show more since it's the default list
                                .map(user => (
                                    <div
                                        key={user.id}
                                        className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                            setSelectedMembers(prev => [...prev, user])
                                            setMemberSearch("")
                                        }}
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{(user.name || "?").substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </div>
                                ))}
                            {users.filter(u => !selectedMembers.find(m => m.id === u.id)).length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    {t('empty.noMembers')}
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={async () => {
                                if (!createdTeamId || selectedMembers.length === 0) return
                                setIsInviting(true)
                                try {
                                    // Update team with new members
                                    // First get current team members to merge?
                                    // Assuming createdTeamId is fresh, we just append.
                                    // But safer to fetch or use what we know.
                                    // Wait, we have 'teams' state.
                                    const team = teams.find(t => t.id === createdTeamId)
                                    const currentMembers = team ? team.memberIds : []
                                    const newMemberIds = selectedMembers.map(u => u.id)
                                    const updatedMembers = [...new Set([...currentMembers, ...newMemberIds])]

                                    const res = await fetch("/api/teams", {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            id: createdTeamId,
                                            memberIds: updatedMembers
                                        })
                                    })

                                    if (!res.ok) throw new Error("Failed to add members")

                                    await fetchData()
                                    toast({
                                        title: t('messages.updated'),
                                        description: "Members added successfully"
                                    })
                                    setIsAddMembersDialogOpen(false)
                                    router.push(`/teams/${createdTeamId}`)
                                } catch (error) {
                                    console.error(error)
                                    toast({ variant: "destructive", title: "Error", description: "Failed to add members" })
                                } finally {
                                    setIsInviting(false)
                                }
                            }}
                            disabled={isInviting || selectedMembers.length === 0}
                        >
                            {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('dialog.addMembersButton')}
                        </Button>
                    </div>
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

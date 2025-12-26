"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogHeader,
    DialogFooter,
} from "@/components/ui/dialog"
import { ChevronLeft, MoreVertical, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { users as initialUsers, Team } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

import { useTranslations } from "next-intl"

export default function TeamDetailPage() {
    const t = useTranslations('Teams')
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [team, setTeam] = useState<Team | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [users, setUsers] = useState(initialUsers)

    const [currentUser, setCurrentUser] = useState<any>(null)
    const [globalAdmins, setGlobalAdmins] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Users
                const usersRes = await fetch("/api/users")
                const usersData = await usersRes.json()
                let mappedUsers: any[] = []
                if (usersData.items) {
                    mappedUsers = usersData.items.map((item: any) => ({
                        ...item,
                        id: item._id || item.id,
                    }))
                }

                // Fetch Global Admins (from API/Env)
                let fetchedAdmins: any[] = []
                try {
                    const adminsRes = await fetch("/api/admin/users")
                    if (adminsRes.ok) {
                        const adminsData = await adminsRes.json()
                        if (adminsData.items) {
                            fetchedAdmins = adminsData.items
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch admins", e)
                }
                setGlobalAdmins(fetchedAdmins)

                // Fetch Current User
                const meRes = await fetch('/api/auth/me')
                let meData = null
                if (meRes.ok) {
                    meData = await meRes.json()
                }

                if (meData) {
                    setCurrentUser(meData)
                }

                // Merge Global Admins into Users list if not present
                fetchedAdmins.forEach(admin => {
                    const exists = mappedUsers.find(u => u.id === admin.id || u.email === admin.email)
                    if (!exists) {
                        mappedUsers.push({
                            ...admin,
                            role: "Administrator", // Label as admin
                            hasJoined: true
                        })
                    }
                })

                if (meData) {
                    // Check if current user is in mappedUsers
                    // We check by ID or Email. 
                    // IMPORTANT: If they are already added as Global Admin (which happened in the step above), 
                    // we do NOT want to add them again as a 'Full User'.
                    const existingUserIndex = mappedUsers.findIndex(u => u.id === meData.sub || (u.email && meData.email && u.email.toLowerCase() === meData.email.toLowerCase()))

                    if (existingUserIndex === -1) {
                        mappedUsers.push({
                            id: meData.sub,
                            name: meData.name || "Current User",
                            email: meData.email || "",
                            avatar: meData.picture || "",
                            role: "Full User",
                            lastVisit: "Just now",
                            hasJoined: true
                        })
                    }
                }
                setUsers(mappedUsers)

            } catch (error) {
                console.error("Failed to fetch data", error)
            }
        }
        fetchData()
    }, [])


    const [assets, setAssets] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)

    // Add Members Dialog State
    const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false)
    const [selectedMembers, setSelectedMembers] = useState<any[]>([])
    const [memberSearch, setMemberSearch] = useState("")
    const [isInviting, setIsInviting] = useState(false)

    const fetchTeamData = async () => {
        setIsLoading(true)
        try {
            // Fetch Team
            const teamRes = await fetch(`/api/teams?id=${id}`)
            if (!teamRes.ok) throw new Error("Failed to fetch team")
            const teamData = await teamRes.json()
            const fetchedTeam = teamData.item

            setTeam(fetchedTeam)

            if (fetchedTeam) {
                const teamId = fetchedTeam._id || fetchedTeam.id

                // Fetch Assets
                const assetsRes = await fetch('/api/assets?limit=1000')
                const assetsData = await assetsRes.json()
                if (assetsData.items) {
                    const teamAssets = assetsData.items.filter((a: any) =>
                        a.teamsInCharge && a.teamsInCharge.includes(teamId)
                    )
                    setAssets(teamAssets)
                }

                // Fetch Locations
                const locationsRes = await fetch('/api/locations?limit=1000')
                const locationsData = await locationsRes.json()
                if (locationsData.items) {
                    const teamLocations = locationsData.items.filter((l: any) =>
                        l.teamsInCharge && l.teamsInCharge.includes(teamId)
                    )
                    setLocations(teamLocations)
                }
            }

        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchTeamData()
        }
    }, [id])

    const handleAddMembers = async () => {
        if (!team || selectedMembers.length === 0) return
        setIsInviting(true)
        try {
            const teamId = team._id || team.id
            const currentMembers = team.memberIds || []
            // Ensure admin is also in memberIds if not already
            const adminId = team.administratorId

            const newMemberIds = selectedMembers.map(u => u.id)
            // Combine current, new, and admin
            const updatedMembers = [...new Set([...currentMembers, ...newMemberIds, adminId].filter(Boolean))]

            const res = await fetch("/api/teams", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: teamId,
                    memberIds: updatedMembers
                })
            })

            if (!res.ok) throw new Error("Failed to add members")

            await fetchTeamData() // Refresh data
            setIsAddMembersDialogOpen(false)
            setSelectedMembers([])
            setMemberSearch("")

        } catch (error) {
            console.error("Failed to add members", error)
        } finally {
            setIsInviting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    if (!team) {
        return <div className="p-6">{t('empty.noTeams')}</div>
    }

    // Safely handle memberIds if undefined in some data
    const memberIds = team.memberIds || []

    // We filter users including Global Admins
    let members = users.filter(u => {
        return memberIds.includes(u.id) ||
            globalAdmins.find(ga => ga.id === u.id || ga.email === u.email)
    })

    // Remove duplicates if any
    members = Array.from(new Map(members.map(m => [m.id, m])).values())

    // Sort so global admins are first
    members.sort((a, b) => {
        const isAdminA = !!globalAdmins.find(ga => ga.id === a.id || ga.email === a.email)
        const isAdminB = !!globalAdmins.find(ga => ga.id === b.id || ga.email === b.email)
        if (isAdminA && !isAdminB) return -1
        if (!isAdminA && isAdminB) return 1
        return 0
    })

    return (
        <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 mb-6 cursor-pointer hover:text-orange-600 w-fit" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
                <h1 className="text-xl font-bold">{team.name || t('detail.title')}</h1>
            </div>

            <Card className="shadow-none rounded-lg">
                <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div
                                className={`h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden relative ring-4 ring-offset-2 cursor-pointer hover:opacity-90 transition-opacity`}
                                style={{
                                    backgroundColor: team.image ? 'transparent' : (team.color === 'blue' ? '#3b82f6' : team.color),
                                    '--tw-ring-color': team.color === 'blue' ? '#3b82f6' : team.color
                                } as React.CSSProperties}
                                onClick={() => setIsImagePreviewOpen(true)}
                            >
                                {team.image ? (
                                    <img
                                        src={`/api/image?path=${encodeURIComponent(team.image)}`}
                                        alt={team.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    (team.name || "T").substring(0, 1).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{team.name || "Unnamed Team"}</h2>
                                <p className="text-muted-foreground">{team.description}</p>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>{t('actions.edit')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">{t('actions.delete')}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{t('detail.membersTitle', { count: members.length })}</h3>
                            <Button
                                className="bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
                                onClick={() => setIsAddMembersDialogOpen(true)}
                            >
                                {t('dialog.addMembersButton')}
                            </Button>
                        </div>

                        <div className="rounded-md">
                            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-4 px-2">
                                <div className="col-span-5">{t('detail.memberTable.name')}</div>
                                <div className="col-span-4">{t('detail.memberTable.role')}</div>
                                <div className="col-span-3">{t('detail.memberTable.lastVisit')}</div>
                            </div>

                            {members.map(member => (
                                <div key={member.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0 px-2 hover:bg-muted/50">
                                    <div className="col-span-5 flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{member.name}</span>
                                    </div>
                                    <div className="col-span-4 text-sm">
                                        {(globalAdmins.find(ga => ga.id === member.id || ga.email === member.email)) ? t('detail.roles.admin') : member.role || t('detail.roles.member')}
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        {member.hasJoined === false ? "Didn't join yet" : (member.lastVisit || "-")}
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="text-destructive">{t('detail.removeMember')}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>



                        {members.length === 0 && (
                            <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="space-y-1">
                                    <h4 className="font-medium text-orange-900">
                                        {t('detail.onePersonTeam')}
                                    </h4>
                                    <p className="text-sm text-orange-700">{t('detail.inviteDesc')}</p>
                                </div>
                                <Button
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() => setIsAddMembersDialogOpen(true)}
                                >
                                    {t('dialog.addMembersButton')}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-12">
                        <div>
                            <h3 className="font-semibold text-lg mb-4">{t('detail.locationsTitle', { count: locations.length })}</h3>
                            {locations.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {locations.map(loc => (
                                        <div key={loc.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/locations?id=${loc._id}`)}>
                                            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                {loc.name.substring(0, 1)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{loc.name}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{loc.address || "No address"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-2">{t('detail.noLocations')}</p>
                            )}
                            <Button variant="link" className="p-0 text-orange-600 h-auto" onClick={() => router.push(`/locations/new?teamId=${team._id || team.id}`)}>{t('detail.assignLocations')}</Button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-4">{t('detail.assetsTitle', { count: assets.length })}</h3>
                            {assets.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {assets.map(asset => (
                                        <div key={asset.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/assets?id=${asset._id}`)}>
                                            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                {asset.name.substring(0, 1)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{asset.name}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{asset.model || "No model"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-2">{t('detail.noAssets')}</p>
                            )}
                            <Button variant="link" className="p-0 text-orange-600 h-auto" onClick={() => router.push(`/assets/new?teamId=${team._id || team.id}`)}>{t('detail.assignAssets')}</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{t('detail.imagePreview')}</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {team.image ? (
                            <img
                                src={`/api/image?path=${encodeURIComponent(team.image)}`}
                                alt={team.name}
                                className="max-w-full max-h-[80vh] rounded-md shadow-2xl object-contain bg-background"
                            />
                        ) : (
                            <div
                                className={`h-64 w-64 rounded-full flex items-center justify-center text-white text-8xl font-bold shadow-2xl`}
                                style={{ backgroundColor: team.image ? 'transparent' : (team.color === 'blue' ? '#3b82f6' : team.color) }}
                            >
                                {(team.name || "T").substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Members Dialog */}
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

                        {/* List users by default (excluding selected and already in team) */}
                        <div className="border rounded-md max-h-120 min-h-120 overflow-y-auto">
                            {users
                                .filter(u =>
                                    !selectedMembers.find(m => m.id === u.id) &&
                                    !((team?.memberIds || []).includes(u.id)) && // Exclude existing team members
                                    u.id !== team?.administratorId && // Exclude admin
                                    (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                        u.email.toLowerCase().includes(memberSearch.toLowerCase()))
                                )
                                .slice(0, 50)
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
                            {users.filter(u =>
                                !selectedMembers.find(m => m.id === u.id) &&
                                !((team?.memberIds || []).includes(u.id)) &&
                                u.id !== team?.administratorId
                            ).length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        {t('empty.noMembers')}
                                    </div>
                                )}
                        </div>

                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={handleAddMembers}
                            disabled={isInviting || selectedMembers.length === 0}
                        >
                            {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('dialog.addMembersButton')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}

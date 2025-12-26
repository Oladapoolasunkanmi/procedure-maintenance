"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus, Search, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { User, Team, users as initialUsers, teams as initialTeams } from "@/lib/data"

export function UsersTable() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [teams, setTeams] = useState<Team[]>([]) // Should fetch teams too if we want to show badges? Yes.
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [usersRes, teamsRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/teams')
                ])

                const usersData = await usersRes.json()
                const teamsData = await teamsRes.json()

                if (usersData.items) {
                    setUsers(usersData.items.map((u: any) => ({
                        ...u,
                        id: u._id || u.id
                    })))
                } else {
                    setUsers([])
                }

                if (teamsData.items) {
                    setTeams(teamsData.items.map((t: any) => ({
                        ...t,
                        id: t._id || t.id
                    })))
                }
            } catch (error) {
                console.error("Failed to fetch data", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const getUserTeams = (userId: string) => {
        return teams.filter(team => team.memberIds && team.memberIds.includes(userId))
    }

    const handleResendInvite = (e: React.MouseEvent, user: User) => {
        e.stopPropagation()
        // Logic to resend invite
        console.log("Resend invite to", user.email)
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(filteredUsers.map(u => u.id))
        } else {
            setSelectedUsers([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedUsers(prev => [...prev, id])
        } else {
            setSelectedUsers(prev => prev.filter(uid => uid !== id))
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm("Are you sure you want to delete selected users?")) return

        setIsBulkDeleting(true)
        try {
            await Promise.all(selectedUsers.map(id =>
                fetch(`/api/users?id=${id}`, { method: "DELETE" })
            ))

            // Refetch
            const usersRes = await fetch('/api/users')
            const usersData = await usersRes.json()
            if (usersData.items) {
                setUsers(usersData.items.map((u: any) => ({
                    ...u,
                    id: u._id || u.id
                })))
            } else {
                setUsers([])
            }

            setSelectedUsers([])
            toast({
                title: "Deleted",
                description: "Users deleted successfully"
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to delete users",
                variant: "destructive"
            })
        } finally {
            setIsBulkDeleting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Users"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    {selectedUsers.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"} ({selectedUsers.length})
                        </Button>
                    )}
                </div>
                <Button onClick={() => router.push("/teams/invite")} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Users
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                            </TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Teams</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{(user.name || "?").substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.role || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {getUserTeams(user.id).map(team => (
                                                <Badge key={team.id} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                                    {team.name}
                                                </Badge>
                                            ))}
                                            {getUserTeams(user.id).length === 0 && <span className="text-muted-foreground text-sm">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.hasJoined === false ? (
                                            <div className="flex flex-col items-start">
                                                <span className="text-muted-foreground">Didn&apos;t join yet</span>
                                                <button
                                                    onClick={(e) => handleResendInvite(e, user)}
                                                    className="text-blue-500 hover:underline text-sm"
                                                >
                                                    Resend Invite
                                                </button>
                                            </div>
                                        ) : (
                                            user.lastVisit || "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    1 - {filteredUsers.length} of {filteredUsers.length}
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>
                        &lt;
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        &gt;
                    </Button>
                </div>
            </div>
        </div>
    )
}

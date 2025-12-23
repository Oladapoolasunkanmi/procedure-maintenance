"use client"

import { useState } from "react"
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
import { MoreVertical, Plus, Search } from "lucide-react"
import { User, Team, users as initialUsers, teams as initialTeams } from "@/lib/data"

export function UsersTable() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [users] = useState<User[]>(initialUsers)
    const [teams] = useState<Team[]>(initialTeams)

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getUserTeams = (userId: string) => {
        return teams.filter(team => team.memberIds.includes(userId))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Users"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
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
                            <TableHead>Full Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Teams</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
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
                                <TableCell>{user.lastVisit || "-"}</TableCell>
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
                        ))}
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

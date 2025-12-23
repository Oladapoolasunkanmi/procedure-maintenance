"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
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
import { ChevronLeft, MoreVertical } from "lucide-react"
import { teams as initialTeams, users as initialUsers } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export default function TeamDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [team] = useState(initialTeams.find(t => t.id === id))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [users] = useState(initialUsers)

    if (!team) {
        return <div className="p-6">Team not found</div>
    }

    const members = users.filter(u => team.memberIds.includes(u.id))
    const admin = users.find(u => u.id === team.administratorId)

    return (
        <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 mb-6 cursor-pointer hover:text-orange-600 w-fit" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
                <h1 className="text-xl font-bold">{team.name}</h1>
            </div>

            <Card>
                <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold`} style={{ backgroundColor: team.color === 'blue' ? '#3b82f6' : team.color }}>
                                {team.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{team.name}</h2>
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
                                <DropdownMenuItem>Edit Team</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete Team</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg">Member ({members.length})</h3>

                        <div className="rounded-md">
                            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-4 px-2">
                                <div className="col-span-5">Full Name</div>
                                <div className="col-span-4">Role</div>
                                <div className="col-span-3">Last Visit</div>
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
                                        {member.id === team.administratorId ? "Team Administrator" : member.role || "Member"}
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        {member.lastVisit || "-"}
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="text-destructive">Remove from Team</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="space-y-1">
                                <h4 className="font-medium text-orange-900">
                                    {members.length === 1 ? "One person Team" : `${members.length} people Team`}
                                </h4>
                                <p className="text-sm text-orange-700">Invite people to join the Team and organize your workflows.</p>
                            </div>
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                                Add Members
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-12">
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Locations (0)</h3>
                            <p className="text-sm text-muted-foreground mb-2">Which locations is the Team responsible for?</p>
                            <Button variant="link" className="p-0 text-orange-600 h-auto">Assign locations to the Team</Button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Assets (0)</h3>
                            <p className="text-sm text-muted-foreground mb-2">Which assets is the Team responsible for?</p>
                            <Button variant="link" className="p-0 text-orange-600 h-auto">Assign assets to the Team</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

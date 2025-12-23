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
} from "@/components/ui/dialog"
import { ChevronLeft, MoreVertical, Loader2 } from "lucide-react"
import { users as initialUsers, Team } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export default function TeamDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [team, setTeam] = useState<Team | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [users] = useState(initialUsers)
    const [assets, setAssets] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)

    useEffect(() => {
        const fetchTeamData = async () => {
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

        if (id) {
            fetchTeamData()
        }
    }, [id])

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    if (!team) {
        return <div className="p-6">Team not found</div>
    }

    // Safely handle memberIds if undefined in some data
    const memberIds = team.memberIds || []
    const members = users.filter(u => memberIds.includes(u.id))
    const admin = users.find(u => u.id === team.administratorId)

    return (
        <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 mb-6 cursor-pointer hover:text-orange-600 w-fit" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
                <h1 className="text-xl font-bold">{team.name || "Team Details"}</h1>
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
                            <h3 className="font-semibold text-lg mb-4">Locations ({locations.length})</h3>
                            {locations.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {locations.map(loc => (
                                        <div key={loc.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/locations?id=${loc.id}`)}>
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
                                <p className="text-sm text-muted-foreground mb-2">Which locations is the Team responsible for?</p>
                            )}
                            <Button variant="link" className="p-0 text-orange-600 h-auto" onClick={() => router.push(`/locations/new?teamId=${team._id || team.id}`)}>Assign locations to the Team</Button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Assets ({assets.length})</h3>
                            {assets.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {assets.map(asset => (
                                        <div key={asset.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/assets?id=${asset.id}`)}>
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
                                <p className="text-sm text-muted-foreground mb-2">Which assets is the Team responsible for?</p>
                            )}
                            <Button variant="link" className="p-0 text-orange-600 h-auto" onClick={() => router.push(`/assets/new?teamId=${team._id || team.id}`)}>Assign assets to the Team</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Team Image Preview</DialogTitle>
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
        </div>
    )
}

"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SlidingTabsList, SlidingTabsTrigger } from "@/components/ui/sliding-tabs"
import { UsersTable } from "./users-table"
import { TeamsTable } from "./teams-table"

export default function TeamsPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Teams / Users</h1>
            </div>

            <Tabs defaultValue="teams" className="w-full">
                <SlidingTabsList>
                    {/* <SlidingTabsTrigger value="users">
                        Users
                    </SlidingTabsTrigger> */}
                    <SlidingTabsTrigger value="teams">
                        Teams
                    </SlidingTabsTrigger>
                </SlidingTabsList>

                {/* <TabsContent value="users" className="mt-0">
                    <UsersTable />
                </TabsContent> */}
                <TabsContent value="teams" className="mt-0">
                    <TeamsTable />
                </TabsContent>
            </Tabs>
        </div>
    )
}

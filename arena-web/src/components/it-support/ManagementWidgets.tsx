"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, MessageSquare, Ticket } from "lucide-react"

// --- User Support Ticket Queue ---
interface TicketQueueProps {
    tickets?: any[];
    loading?: boolean;
}

export function TicketQueue({ tickets, loading }: TicketQueueProps) {
    const displayTickets = (tickets || []).slice(0, 5).map(issue => ({
        id: issue.id?.substring(0, 8) || 'N/A',
        user: 'System', // Issue doesn't have user field in basic schema
        issue: issue.title || 'Untitled',
        priority: issue.priority?.toLowerCase() || 'low',
        status: issue.status?.toLowerCase() || 'open',
        time: new Date(issue.createdAt).toLocaleString()
    }));

    return (
        <Card className="border-white/10 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-[#0066FF]" /> Support Queue
                </CardTitle>
                <Badge variant="outline" className="text-[#0066FF] border-[#0066FF]">
                    {loading ? '-' : displayTickets.length} Pending
                </Badge>
            </CardHeader>
            <CardContent className="px-0">
                {loading && <div className="px-6 py-4 text-gray-500 text-sm">Loading tickets...</div>}

                {!loading && displayTickets.length === 0 && (
                    <div className="px-6 py-4 text-gray-500 text-sm">No open tickets</div>
                )}

                <div className="space-y-1">
                    {displayTickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-[#0066FF] cursor-pointer">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-500">#{ticket.id}</span>
                                    <span className="text-sm font-medium text-white truncate max-w-[200px]">{ticket.issue}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>{ticket.user}</span>
                                    <span>•</span>
                                    <span>{ticket.time}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {(ticket.priority === 'critical' || ticket.priority === 'urgent') && <Badge variant="destructive">CRIT</Badge>}
                                {ticket.priority === 'high' && <Badge className="bg-orange-500/20 text-orange-400">HIGH</Badge>}
                                {ticket.priority === 'low' && <Badge variant="secondary">LOW</Badge>}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 pt-2">
                    <Button variant="ghost" className="w-full text-xs text-gray-400 hover:text-white">View All Tickets</Button>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Integrations Monitor ---
export function IntegrationsMonitor() {
    const services = [
        { name: "M-Pesa API", status: "healthy", latency: "45ms" },
        { name: "Google Maps", status: "healthy", latency: "120ms" },
        { name: "Notification Svc", status: "degraded", latency: "800ms" },
        { name: "Internal DB", status: "healthy", latency: "12ms" },
    ]

    return (
        <Card className="border-white/10 bg-black/20 h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#0066FF]" /> Integrations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {services.map((svc) => (
                        <div key={svc.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {svc.status === 'healthy' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                {svc.status === 'degraded' && <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />}
                                {svc.status === 'down' && <XCircle className="w-4 h-4 text-red-500" />}
                                <span className="text-sm font-medium text-gray-300">{svc.name}</span>
                            </div>
                            <span className={cn(
                                "text-xs font-mono",
                                svc.latency === "800ms" ? "text-yellow-500" : "text-gray-500"
                            )}>{svc.latency}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

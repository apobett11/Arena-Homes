"use client"

import React, { useState } from "react"
import { AlertCircle, CheckCircle, Clock, Database, Shield, Terminal, XCircle, Search, Filter, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// --- Recent Activity Widget ---
export function RecentActivity() {
    const activities = [
        { time: "10:42 AM", event: "Admin Login (HP)", type: "info" },
        { time: "10:38 AM", event: "Backup Completed", type: "success" },
        { time: "10:15 AM", event: "Failed Login (IP 192.168.x)", type: "warning" },
        { time: "09:55 AM", event: "System Update: Patch v2.1", type: "info" },
        { time: "09:30 AM", event: "API Latency Spike (M-Pesa)", type: "error" },
    ]

    return (
        <Card className="h-full border-white/10 bg-black/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0066FF]" /> Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="space-y-1">
                    {activities.map((act, i) => (
                        <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 border-l-2 border-transparent hover:border-[#0066FF] transition-all cursor-default group">
                            <span className="text-xs font-mono text-gray-500 w-16">{act.time}</span>
                            <div className="flex-1 text-sm text-gray-300 group-hover:text-white transition-colors">{act.event}</div>
                            {act.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            {act.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                            {act.type === 'warning' && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
                            {act.type === 'error' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// --- Logs Viewer Widget ---
import { SystemLog } from "@/lib/api/domains/system"

interface LogsViewerProps {
    logs?: SystemLog[];
    loading?: boolean;
}

export function LogsViewer({ logs, loading }: LogsViewerProps) {
    const displayLogs = logs || [];

    return (
        <Card className="h-full border-white/10 bg-black/40 font-mono text-sm overflow-hidden flex flex-col">
            <div className="bg-black/60 p-2 px-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-400">
                    <Terminal size={14} />
                    <span className="text-xs">SYSTEM LOGS - LIVE</span>
                </div>
                <div className="flex gap-2">
                    <Search size={14} className="text-gray-500 cursor-pointer hover:text-white" />
                    <Filter size={14} className="text-gray-500 cursor-pointer hover:text-white" />
                </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-[300px] flex-1 scrollbar-hide">
                {loading && <div className="text-gray-500 text-xs animate-pulse">Connecting to log stream...</div>}

                {!loading && displayLogs.length === 0 && <div className="text-gray-500 text-xs">No logs available.</div>}

                {displayLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors">
                        <span className="text-gray-600 text-xs shrink-0 select-none w-16">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                        <span className={cn(
                            "text-xs font-bold w-12 shrink-0 select-none",
                            log.level === "INFO" && "text-blue-400",
                            log.level === "WARN" && "text-yellow-400",
                            log.level === "ERROR" && "text-red-500"
                        )}>{log.level}</span>
                        <span className="text-gray-300 truncate flex-1" title={log.message}>{log.message}</span>
                        <span className="text-gray-600 text-[10px] hidden md:block">{log.source}</span>
                    </div>
                ))}
                {!loading && <div className="animate-pulse text-blue-500/50 text-xs pt-2">_ Awaiting input stream...</div>}
            </div>
        </Card>
    )
}

// --- Diagnostics Panel ---
export function DiagnosticsPanel() {
    const [scanning, setScanning] = useState<string | null>(null)

    const runScan = (type: string) => {
        setScanning(type)
        setTimeout(() => setScanning(null), 3000)
    }

    return (
        <Card className="border-white/10 bg-gradient-to-br from-black/40 to-blue-900/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#0066FF]" /> One-Tap Diagnostics
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 hover:bg-[#0066FF]/10 text-gray-300 hover:text-white hover:border-[#0066FF]/50 transition-all"
                    onClick={() => runScan('health')}
                    disabled={!!scanning}
                >
                    <Activity className={cn("w-6 h-6", scanning === 'health' ? "animate-spin text-[#0066FF]" : "text-emerald-500")} />
                    <div className="text-center">
                        <div className="font-semibold">App Health Scan</div>
                        <div className="text-xs text-gray-500">{scanning === 'health' ? 'Scanning...' : 'Ready'}</div>
                    </div>
                    {scanning === 'health' && <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden"><div className="h-full bg-[#0066FF] animate-progress" style={{ width: '100%' }}></div></div>}
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 hover:bg-[#0066FF]/10 text-gray-300 hover:text-white hover:border-[#0066FF]/50 transition-all"
                    onClick={() => runScan('db')}
                    disabled={!!scanning}
                >
                    <Database className={cn("w-6 h-6", scanning === 'db' ? "animate-bounce text-[#0066FF]" : "text-blue-500")} />
                    <div className="text-center">
                        <div className="font-semibold">DB Integrity Check</div>
                        <div className="text-xs text-gray-500">{scanning === 'db' ? 'Checking...' : 'Ready'}</div>
                    </div>
                    {scanning === 'db' && <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden"><div className="h-full bg-[#0066FF] animate-progress" style={{ width: '100%' }}></div></div>}
                </Button>
            </CardContent>
        </Card>
    )
}

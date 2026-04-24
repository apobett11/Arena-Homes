import { fetchClient } from '../client';

export interface SystemLog {
    id: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    timestamp: string;
    source: string;
}

export interface SystemHealth {
    uptime: number; // seconds
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
}

export const SystemApi = {
    getHealth: async (): Promise<SystemHealth> => {
        return fetchClient<SystemHealth>('/system/health');
    },

    getLogs: async (): Promise<SystemLog[]> => {
        return fetchClient<SystemLog[]>('/system/logs');
    },
};

import { getSupabaseClient } from '@/lib/supabase/client';

type JsonRecord = Record<string, unknown>;

function toSnakeCaseKey(key: string): string {
    return key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

function normalizePayload(payload: unknown): unknown {
    if (Array.isArray(payload)) {
        return payload.map(normalizePayload);
    }
    if (payload && typeof payload === 'object') {
        const normalized: JsonRecord = {};
        for (const [key, value] of Object.entries(payload as JsonRecord)) {
            normalized[toSnakeCaseKey(key)] = normalizePayload(value);
        }
        return normalized;
    }
    return payload;
}

function parseJsonBody(options: RequestInit): JsonRecord {
    if (!options.body || typeof options.body !== 'string') {
        return {};
    }
    try {
        return JSON.parse(options.body) as JsonRecord;
    } catch {
        return {};
    }
}

function notSupported(endpoint: string): never {
    throw new Error(`Endpoint not implemented in Supabase client: ${endpoint}`);
}

export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const supabase: any = getSupabaseClient();
    const method = (options.method ?? 'GET').toUpperCase();
    const body = normalizePayload(parseJsonBody(options)) as JsonRecord;

    if (endpoint === '/properties' && method === 'GET') {
        const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/properties' && method === 'POST') {
        const { data, error } = await supabase.from('properties').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return data as T;
    }
    if (endpoint.startsWith('/properties/') && method === 'GET' && !endpoint.includes('/pin/')) {
        const id = endpoint.split('/')[2];
        const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as T;
    }
    if (endpoint.startsWith('/properties/') && method === 'PATCH') {
        const id = endpoint.split('/')[2];
        const { error } = await supabase.from('properties').update(body).eq('id', id);
        if (error) throw new Error(error.message);
        return undefined as T;
    }

    if (endpoint === '/units' && method === 'GET') {
        const { data, error } = await supabase.from('units').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint.startsWith('/units?propertyId=') && method === 'GET') {
        const propertyId = decodeURIComponent(endpoint.split('=')[1] ?? '');
        const { data, error } = await supabase.from('units').select('*').eq('property_id', propertyId);
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint.startsWith('/units/') && method === 'GET') {
        const id = endpoint.split('/')[2];
        const { data, error } = await supabase.from('units').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as T;
    }
    if (endpoint.startsWith('/units/') && endpoint.endsWith('/status') && method === 'PATCH') {
        const id = endpoint.split('/')[2];
        const { error } = await supabase.from('units').update({ status: body.status }).eq('id', id);
        if (error) throw new Error(error.message);
        return undefined as T;
    }

    if (endpoint === '/issues' && method === 'GET') {
        const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/issues' && method === 'POST') {
        const { data, error } = await supabase.from('issues').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return data as T;
    }
    if (endpoint.startsWith('/issues/') && endpoint.endsWith('/resolve') && method === 'PATCH') {
        const id = endpoint.split('/')[2];
        const { error } = await supabase.from('issues').update({ status: 'RESOLVED' }).eq('id', id);
        if (error) throw new Error(error.message);
        return undefined as T;
    }

    if (endpoint === '/maintenance' && method === 'GET') {
        const { data, error } = await supabase.from('maintenance_requests').select('*');
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/maintenance' && method === 'POST') {
        const { data, error } = await supabase.from('maintenance_requests').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return data as T;
    }

    if (endpoint === '/users' && method === 'GET') {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/users' && method === 'POST') {
        notSupported(endpoint);
    }

    if (endpoint === '/tenants' && method === 'GET') {
        const { data, error } = await supabase.from('tenants').select('*');
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint.startsWith('/tenants/') && method === 'GET') {
        const id = endpoint.split('/')[2];
        const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as T;
    }

    if (endpoint === '/leases' && method === 'GET') {
        const { data, error } = await supabase.from('leases').select('*');
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }

    if (endpoint === '/payments' && method === 'POST') {
        const { data, error } = await supabase.from('payments').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return data as T;
    }

    if (endpoint === '/ledger' && method === 'GET') {
        const { data, error } = await supabase.from('ledger_transactions').select('*').order('posted_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }

    if (endpoint === '/budgets' && method === 'GET') {
        const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/budgets' && method === 'POST') {
        const { data, error } = await supabase.from('budgets').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return data as T;
    }

    if (endpoint === '/reports/snapshots' && method === 'GET') {
        const { data, error } = await supabase.from('financial_snapshots').select('*').order('generated_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/reports/snapshot' && method === 'POST') {
        const { data, error } = await supabase.rpc('generate_financial_snapshot', {
            p_month: body.month,
            p_year: body.year,
            p_property_id: body.property_id ?? null,
        });
        if (error) throw new Error(error.message);
        return ({ id: data } as T);
    }

    if (endpoint === '/announcements' && method === 'GET') {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint === '/announcements' && method === 'POST') {
        const { data, error } = await supabase.from('announcements').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return data as T;
    }

    if (endpoint === '/applications' && method === 'POST') {
        const { data, error } = await supabase.from('tenant_applications').insert(body).select('id').single();
        if (error) throw new Error(error.message);
        return ({ message: 'Application submitted', applicationId: data.id } as T);
    }
    if (endpoint.startsWith('/applications/caretaker') && method === 'GET') {
        const { data, error } = await supabase.from('tenant_applications').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as T;
    }
    if (endpoint.startsWith('/applications/') && endpoint.endsWith('/respond') && method === 'POST') {
        const id = endpoint.split('/')[2];
        const { data, error } = await supabase
            .from('tenant_applications')
            .update({ status: body.status, caretaker_notes: body.notes })
            .eq('id', id)
            .select('*')
            .single();
        if (error) throw new Error(error.message);
        return data as T;
    }

    if (endpoint === '/auth/me' && method === 'GET') {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error(authError?.message ?? 'No authenticated user');
        const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', authData.user.id).maybeSingle();
        return ({
            id: authData.user.id,
            userId: authData.user.id,
            email: authData.user.email,
            user: {
                email: authData.user.email,
                profile: profileData ?? null,
            },
        } as T);
    }

    if (endpoint === '/system/health' && method === 'GET') {
        return ({
            uptime: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            activeConnections: 0,
            status: 'HEALTHY',
        } as T);
    }
    if (endpoint === '/system/logs' && method === 'GET') {
        return ([] as T);
    }

    if (endpoint.startsWith('/chats') || endpoint.startsWith('/groups')) {
        return ([] as T);
    }

    notSupported(endpoint);
}

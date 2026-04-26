'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LiveMap from '@/components/tenant/LiveMap';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function TenantMapPage() {
  const router = useRouter();
  const [mapLocation, setMapLocation] = useState<any>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase: any = getSupabaseClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace('/auth/login');
        return;
      }
      const { data: tenantRaw } = await supabase.from('tenants').select('id').eq('user_id', authData.user.id).maybeSingle();
      const tenant = tenantRaw as any;
      if (!tenant?.id) {
        setLoading(false);
        return;
      }
      const { data: leaseRowsRaw } = await supabase.from('leases').select('unit_id, status, created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
      const leaseRows = (leaseRowsRaw ?? []) as any[];
      const lease = leaseRows?.find((row) => row.status === 'ACTIVE') ?? leaseRows?.[0];
      if (!lease?.unit_id) {
        setLoading(false);
        return;
      }
      setUnitId(lease.unit_id);
      const { data: unitRaw } = await supabase.from('units').select('property_id').eq('id', lease.unit_id).maybeSingle();
      const unit = unitRaw as any;
      if (!unit?.property_id) {
        setLoading(false);
        return;
      }
      setPropertyId(unit.property_id);
      const { data: mapRaw } = await supabase.from('house_map_locations').select('gate_label, plot_label, gate_lat, gate_lng, house_lat, house_lng').eq('property_id', unit.property_id).maybeSingle();
      const map = mapRaw as any;
      setMapLocation(map);
      setLoading(false);
    }
    void load();
  }, [router]);

  const generateShareCode = async () => {
    if (!propertyId || !unitId) return;
    const supabase: any = getSupabaseClient();
    setSharing(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Session expired');
      
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { error } = await supabase.from('location_share_codes').insert({
        code,
        tenant_user_id: authData.user.id,
        property_id: propertyId,
        unit_id: unitId,
        expires_at: null,
      });
      if (error) throw error;
      setShareCode(code);
    } catch (err) {
      console.error('Failed to generate share code:', err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-300">Loading map...</div>;
  }

  return (
    <div className="min-h-screen bg-[#020617] p-3">
      <LiveMap
        gateLabel={mapLocation?.gate_label || 'School gate'}
        plotLabel={mapLocation?.plot_label || 'House'}
        gateLat={mapLocation?.gate_lat ?? null}
        gateLng={mapLocation?.gate_lng ?? null}
        houseLat={mapLocation?.house_lat ?? null}
        houseLng={mapLocation?.house_lng ?? null}
        onShareLocation={generateShareCode}
        sharing={sharing}
        shareCode={shareCode}
      />
    </div>
  );
}

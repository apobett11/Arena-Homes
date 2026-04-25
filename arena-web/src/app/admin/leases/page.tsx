"use client";

import { useEffect, useMemo, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { safeSelect } from "@/lib/supabase/safe";

export default function AdminLeasesPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      const [leaseRows, tenantRows, propertyRows, unitRows, documentRows] = await Promise.all([
        safeSelect<any>("leases", (q) => q.select("*").order("created_at", { ascending: false })),
        safeSelect<any>("tenants", (q) => q.select("*")),
        safeSelect<any>("properties", (q) => q.select("*")),
        safeSelect<any>("units", (q) => q.select("*")),
        safeSelect<any>("tenant_lease_documents", (q) => q.select("*")),
      ]);
      setLeases(leaseRows);
      setTenants(tenantRows);
      setProperties(propertyRows);
      setUnits(unitRows);
      setDocuments(documentRows);
    };
    void load();
  }, []);

  const tenantById = useMemo(() => new Map(tenants.map((t) => [t.id, t])), [tenants]);
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);
  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  const filtered = leases.filter((lease) => {
    const tenant = tenantById.get(lease.tenant_id);
    const unit = unitById.get(lease.unit_id);
    const property = propertyById.get(unit?.property_id);
    const tenantName = tenant?.full_name || tenant?.id || "";
    const matchesSearch = tenantName.toLowerCase().includes(search.toLowerCase());
    const matchesProperty = propertyFilter === "ALL" || property?.id === propertyFilter;
    const matchesStatus = statusFilter === "ALL" || lease.status === statusFilter;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <AdminTopBar />
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="mb-4 text-3xl font-bold text-white">Lease Storage</h1>
        <p className="text-slate-400">Manage all tenant leases and attached documents.</p>

        <div className="mt-6 grid gap-2 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by tenant name"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <select
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="ALL">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/50">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-slate-900/90 text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Tenant name</th>
                <th className="px-4 py-3 text-left">Property / unit</th>
                <th className="px-4 py-3 text-left">Lease start</th>
                <th className="px-4 py-3 text-left">Lease end</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Created date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-slate-400">
                    No leases found yet.
                  </td>
                </tr>
              ) : (
                filtered.map((lease) => {
                  const tenant = tenantById.get(lease.tenant_id);
                  const unit = unitById.get(lease.unit_id);
                  const property = propertyById.get(unit?.property_id);
                  const leaseDocs = documents.filter((doc) => doc.lease_id === lease.id);
                  return (
                    <tr key={lease.id} className="border-t border-slate-800">
                      <td className="px-4 py-3 text-white">{tenant?.full_name || tenant?.id || "Unknown tenant"}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {(property?.name || "Unknown property") + " / " + (unit?.type || "Unknown unit")}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{lease.start_date || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-300">{lease.end_date || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-300">{lease.status || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {leaseDocs[0]?.file_url ? (
                          <a href={leaseDocs[0].file_url} target="_blank" className="text-blue-300 underline" rel="noreferrer">
                            {leaseDocs[0].file_name || "View file"}
                          </a>
                        ) : (
                          "No document"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {lease.created_at ? new Date(lease.created_at).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

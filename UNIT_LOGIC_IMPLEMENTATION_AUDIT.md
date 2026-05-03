# UNIT LOGIC IMPLEMENTATION AUDIT

## PHASE 15 — AUDIT RESULTS

### 1. Units Table:
- **table**: `public.units`
- **primary key**: `id uuid`
- **property FK**: `property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE`
- **status column**: `status public.unit_status NOT NULL DEFAULT 'VACANT'`
- **availability column**: `availability_status public.unit_availability_status NOT NULL DEFAULT 'AVAILABLE'`
- **tenant-link column**: **MISSING** - No `tenant_id` or `current_tenant_id` column exists
- **enum values**:
  - `unit_status`: VACANT, TAKEN
  - `unit_availability_status`: AVAILABLE, RESERVED, OCCUPIED, UNDER_MAINTENANCE, UNAVAILABLE

### 2. Tenants Table:
- **table**: `public.tenants`
- **primary key**: `id uuid`
- **user FK**: `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`
- **property link**: `property_id uuid REFERENCES public.properties(id)`
- **unit link**: `unit_id uuid REFERENCES public.units(id)` - Tenant has unit_id pointing to units
- **status column**: `status text DEFAULT 'ACTIVE'` (also has tenant_status enum: PENDING, ACTIVE, INACTIVE, SUSPENDED, MOVED_OUT)
- **active status**: 'ACTIVE'

### 3. Applications Table:
- **table**: `public.tenant_applications`
- **application id**: `id uuid PRIMARY KEY`
- **property id**: `property_id uuid REFERENCES public.properties(id)`
- **unit id**: `unit_id uuid REFERENCES public.units(id)` (the unit they requested)
- **tenant id/user id**: `applicant_user_id uuid`, `converted_tenant_id uuid` (set when accepted)
- **status values**: `status application_status` - enum: WAITING, ACCEPTED, REJECTED
- **accepted status**: 'ACCEPTED'
- **unit link when accepted**: `assigned_unit_id uuid` (stores the unit assigned on acceptance)

### 4. Current Approve/Accept Flow:
- **files**:
  - `supabase/migrations/20260503044200_fix_email_trigger_and_unit_status.sql` - Contains `accept_application` function
  - `arena-web/src/components/caretaker/ApplicationsPanel.tsx` - Calls `accept_application` RPC correctly
  - `arena-web/app/caretaker/applications/page.tsx` - Uses `ApplicationApi.respond` (WRONG - doesn't call accept_application RPC)
- **current behavior**: 
  - `accept_application` RPC creates tenant, updates unit to OCCUPIED/TAKEN, updates application to ACCEPTED
  - Does NOT store tenant_id on the unit table
  - Unit occupancy is determined only by availability_status
- **problems**:
  - No tenant_id link on units table - cannot verify which tenant occupies which unit
  - Views count occupied by availability_status only, not by actual tenant assignment
  - Two sources of truth: unit availability_status vs tenants.unit_id
  - No database constraint preventing AVAILABLE status when tenant is assigned
  - applications/page.tsx uses wrong API endpoint that doesn't assign units

### 5. Current Unit List Code:
- **files**: 
  - `arena-web/src/lib/caretaker/dashboard.ts` - `getCaretakerUnits()`
  - `arena-web/app/caretaker/dashboard/page.tsx` - UnitsPanel
- **source of truth**: Direct query to units table, no tenant join
- **problems**: Occupancy determined by availability_status only, not by checking if tenant has this unit_id

### 6. Current Caretaker Dashboard Code/View:
- **files/views**: `public.caretaker_dashboard_view` (defined in `0011_universal_database_contract_enforcement.sql` lines 1660-1684)
- **source of counts**: 
  - total_rooms: COUNT(units)
  - occupied_rooms: COUNT where `status = 'TAKEN' OR availability_status = 'OCCUPIED'`
  - vacant_rooms: COUNT where `status = 'VACANT' OR availability_status = 'AVAILABLE'`
  - tenants_count: COUNT(tenants)
- **problems**: 
  - occupied_rooms does NOT verify tenants.unit_id matches
  - No join between units and tenants to confirm actual occupancy
  - occupied_rooms count may not equal active tenant count

### 7. Current Public Listing Vacancy Code/View:
- **files/views**: `public.public_properties_view` (defined in `0011_universal_database_contract_enforcement.sql` lines 1628-1657)
- **source of counts**: vacant_rooms checks `status = 'VACANT' OR availability_status = 'AVAILABLE'`
- **problems**: Doesn't verify tenant assignment - just relies on availability_status being correct

### 8. Database Constraints/Triggers Found:
- **constraints**: None linking unit availability to tenant presence
- **triggers**: `trg_call_email_webhook` on tenant_applications status change
- **functions/RPC**: 
  - `accept_application()` - Creates tenant, updates unit status to OCCUPIED/TAKEN
  - Does NOT store tenant_id on unit row
  - Does NOT prevent unit from being marked available while tenant assigned

---

## REQUIRED DB CHANGES

### Columns:
1. Add `current_tenant_id uuid REFERENCES public.tenants(id)` to `public.units` table
2. Add index on `units.current_tenant_id` for performance

### Constraints:
1. Add CHECK constraint: `NOT (availability_status = 'AVAILABLE' AND current_tenant_id IS NOT NULL)`
2. Add CHECK constraint: `NOT (availability_status = 'OCCUPIED' AND current_tenant_id IS NULL)`
3. Add UNIQUE constraint on `tenants.unit_id` WHERE status = 'ACTIVE' (one active tenant per unit)

### Triggers:
1. Create `trg_unit_tenant_consistency` to enforce status/tenant alignment on unit updates
2. Create `trg_tenant_unit_consistency` to update unit.current_tenant_id when tenant.unit_id changes

### Functions:
1. **Update** `accept_application()` RPC to:
   - Set `units.current_tenant_id = v_new_tenant_id`
   - Set `units.availability_status = 'OCCUPIED'`
   - Set `units.status = 'TAKEN'`
   - All in atomic transaction

2. **Create** `vacate_unit(p_unit_id, p_tenant_id)` RPC for move-out flow:
   - Clear unit.current_tenant_id
   - Set unit to AVAILABLE/VACANT
   - Set tenant status to MOVED_OUT

### Views Updated:
1. `public.caretaker_dashboard_view` - Count occupied_rooms by `current_tenant_id IS NOT NULL`
2. `public.admin_properties_view` - Count occupied_rooms by `current_tenant_id IS NOT NULL`
3. `public.public_properties_view` - Count vacant_rooms by `current_tenant_id IS NULL AND availability_status = 'AVAILABLE'`

---

## FRONTEND CHANGES REQUIRED

### Files:
1. **`arena-web/app/caretaker/applications/page.tsx`**:
   - **reason**: Currently uses `ApplicationApi.respond()` which just updates status
   - **fix**: Must call `accept_application` RPC with unit_id to properly assign

2. **`arena-web/src/lib/caretaker/dashboard.ts`**:
   - **`getCaretakerUnits()`**: Join with tenants to get `current_tenant_id`
   - **`updateUnitAvailability()`**: Add check to prevent marking available if `current_tenant_id` exists

3. **`arena-web/app/caretaker/dashboard/page.tsx`**:
   - **QuickStats**: Currently computes occupied locally - must use dashboard view counts only
   - **reason**: Lines 174-175 compute occupiedRooms from units array, not from view

4. **`arena-web/src/lib/api/client.ts`**:
   - **`/applications/caretaker` endpoint**: Must ensure it returns assigned_unit_id when ACCEPTED
   - **`/applications/{id}/respond` endpoint**: Must reject or redirect to proper RPC

---

## SUMMARY

The core issue is that the units table lacks a `current_tenant_id` column, making it impossible to definitively determine which tenant occupies a unit. All dashboard counts rely on `availability_status` which can become inconsistent with actual tenant assignments.

The fix requires:
1. Adding `current_tenant_id` to units table
2. Updating `accept_application` RPC to populate it atomically
3. Updating all views to use `current_tenant_id` as source of truth
4. Fixing frontend to use the RPC correctly
5. Adding database constraints to prevent inconsistencies

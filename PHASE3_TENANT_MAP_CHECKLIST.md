# Phase 3 - Tenant Map / Location Sharing Audit Checklist

## Current State
- Tenant map page at `/tenant/map`
- LiveMap component at `src/components/tenant/LiveMap.tsx`
- Uses `house_map_locations` table for coordinates

## Files Inspected
- `app/tenant/map/page.tsx` - Map page
- `src/components/tenant/LiveMap.tsx` - Map component
- `supabase/migrations/0004_frontend_supabase_completion.sql` - house_map_locations table

## Audit Results

### Database Structure (Already Exists)
- [x] `house_map_locations` table exists with:
  - property_id (uuid, unique, references properties)
  - gate_label, plot_label (text)
  - gate_lat, gate_lng (numeric)
  - house_lat, house_lng (numeric)
  - created_at, updated_at timestamps
- [x] RLS enabled with public read policy
- [x] Admin/caretaker can manage locations

### Location Sharing (Already Exists)
- [x] `location_share_codes` table exists (from migration 0006)
- [x] Code generation works in dashboard
- [x] `get_location_share_code` RPC function exists
- [x] Share location flow implemented in dashboard

### Map Page Functionality
- [x] Loads tenant's assigned property coordinates
- [x] Shows Google Maps iframe with house location
- [x] Displays gate label and plot label
- [x] Clean empty state when no coordinates
- [ ] Share button on map page is non-functional (empty callback)

## Issues Found
1. **Map page share button is non-functional** - has empty `onShareLocation={() => {}}`
   - This is a view-only map page
   - Should either remove button or connect to share functionality

## Phase 3 Checklist

### Required Fix
- [x] Fixed map page share button - now generates and displays share codes

### Already Working
- [x] house_map_locations table with coordinates
- [x] Google Maps integration
- [x] Property coordinates loading
- [x] Location sharing via dashboard
- [x] Clean UI without clutter
- [x] Empty state when no coordinates

## Acceptance Criteria
- [x] Map shows real coordinates from database
- [x] Map is not cluttered
- [x] Empty state shows when coordinates unavailable
- [x] Location sharing works via dashboard
- [x] Map page share button now generates and displays codes

## Files Changed
1. `app/tenant/map/page.tsx` - Connected share button to location_share_codes generation
2. `src/components/tenant/LiveMap.tsx` - Added shareCode display UI

## Status: VERIFIED - Phase 3 Complete

## Build Result: PASS

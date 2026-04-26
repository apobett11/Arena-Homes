# Phase 1 - Public Listings Audit Checklist

## Current State
- Listings page exists at `/listings`
- Uses Supabase direct queries via `fetchClient`
- Has filtering by price, location, type
- Has PIN code search for visitor access
- HouseCard component shows basic info

## Issues Found
1. **Distance is hardcoded** (always "0.5km" or "Near Campus")
2. **No verified badges** for properties or caretakers
3. **Vacancy status** comes from simple VACANT/TAKEN enum
4. **Water availability** is hardcoded to true
5. **Listing detail page** has dummy data mixed with real data
6. **No report suspicious listing** feature
7. **No site settings** integration for brand/logo

## Phase 1 Checklist

### Database/Migrations
- [x] Add `verification_status` to properties (UNVERIFIED, PENDING, VERIFIED, SUSPENDED)
- [x] Add `latitude`/`longitude` to properties
- [x] Add `gate_latitude`/`gate_longitude` to properties
- [x] Add `school_gate_distance_meters` to properties
- [x] Add `deposit_amount` to units
- [x] Add `availability_status` to units (Available, Reserved, Occupied, Under maintenance, Unavailable)
- [x] Add `amenities` JSONB to units (water, electricity, security, internet)
- [x] Add `suspicious_reports` table for reporting fake listings/caretakers
- [x] Add `property_photos` table for unit photos
- [x] Add `public_listings` view for safe public data access

### API Layer (fetchClient)
- [x] Updated properties interfaces to include new fields
- [x] Listings page now queries public_listings view directly via Supabase
- [x] Fallback query with proper joins for trust signal data

### UI Components
- [x] HouseCard shows verified badge (blue with ShieldCheck icon)
- [x] HouseCard shows real walking time from school gate
- [x] HouseCard shows availability status with color-coded badges
- [x] HouseCard shows deposit amount
- [x] HouseCard shows amenity icons (water, electricity, security, WiFi)
- [x] HouseCard shows last updated timestamp
- [x] Listings page fetches from public_listings view

### Search/Filter
- [x] PIN code search uses get_location_share_code RPC and fallback

## Acceptance Criteria
- [x] Public listings show trust signals (verified badges)
- [x] Listings page queries real database data via public_listings view
- [x] HouseCard displays availability with proper color coding
- [x] Walking time displayed from school_gate_distance_meters
- [x] Build passes

## Files Changed
1. `supabase/migrations/0007_public_listing_trust_features.sql` - NEW
2. `arena-web/src/lib/api/domains/properties.ts` - Added trust fields
3. `arena-web/src/components/listings/HouseCard.tsx` - Trust badges, amenities
4. `arena-web/app/listings/page.tsx` - Uses public_listings view

## Status: VERIFIED

## Files to Modify
1. `supabase/migrations/0007_public_listing_trust_features.sql`
2. `arena-web/src/lib/api/client.ts` - Update property endpoints
3. `arena-web/src/lib/api/domains/properties.ts` - Add new interfaces
4. `arena-web/src/components/listings/HouseCard.tsx` - Add badges
5. `arena-web/app/listings/page.tsx` - Update filters
6. `arena-web/app/listings/[id]/page.tsx` - Remove dummy data

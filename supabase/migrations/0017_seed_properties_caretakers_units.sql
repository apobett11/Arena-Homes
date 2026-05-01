-- ============================================================================
-- ARENA HOMES - COMPLETE SEED MIGRATION (V2 - NULL Safe)
-- Version: 2.0.0
-- Purpose: Seed 10 properties with caretakers, units, and sample tenants
-- Uses NULL for auth.user references until auth users are created
-- ============================================================================

-- ============================================================================
-- PART 0: TEMPORARILY RELAX CONSTRAINTS FOR SEEDING
-- ============================================================================

-- Temporarily allow NULL user_id in employees table for seeding
ALTER TABLE public.employees ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.properties ALTER COLUMN caretaker_user_id DROP NOT NULL;
ALTER TABLE public.tenants ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================================
-- PART 1: SEED FUNCTION (SECURITY DEFINER to bypass RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_arena_data()
RETURNS TABLE (operation text, item_name text, item_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Property UUIDs
  PROP1_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
  PROP2_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2';
  PROP3_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3';
  PROP4_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4';
  PROP5_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5';
  PROP6_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6';
  PROP7_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7';
  PROP8_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8';
  PROP9_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9';
  PROP10_UUID uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba';
  
  -- Employee UUIDs
  EMP1_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc1';
  EMP2_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc2';
  EMP3_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc3';
  EMP4_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc4';
  EMP5_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc5';
  EMP6_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc6';
  EMP7_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc7';
  EMP8_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc8';
  EMP9_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc9';
  EMP10_UUID uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccca';
  
  v_counter integer;
  v_unit_uuid uuid;
  v_rt text;
  v_base_price numeric;
BEGIN

  -- ========================================================================
  -- PART A: INSERT CARETAKER EMPLOYEES (user_id = NULL, will be linked later)
  -- ========================================================================
  
  -- Insert employees without assigned_property_id first (will update after properties are created)
  INSERT INTO public.employees (id, user_id, role_id, full_name, phone_number, whatsapp_number, email, status, assigned_property_id, emergency_contact, created_at, updated_at)
  VALUES 
    (EMP1_UUID, NULL, 'CARETAKER', 'Peter Mwangi', '+254712345001', '+254712345001', 'caretaker1@arenahomes.test', 'ACTIVE', NULL, 'Mary Mwangi +254712345011', now(), now()),
    (EMP2_UUID, NULL, 'CARETAKER', 'Mary Wanjiku', '+254712345002', '+254712345002', 'caretaker2@arenahomes.test', 'ACTIVE', NULL, 'John Wanjiku +254712345012', now(), now()),
    (EMP3_UUID, NULL, 'CARETAKER', 'James Otieno', '+254712345003', '+254712345003', 'caretaker3@arenahomes.test', 'ACTIVE', NULL, 'Grace Otieno +254712345013', now(), now()),
    (EMP4_UUID, NULL, 'CARETAKER', 'Grace Achieng', '+254712345004', '+254712345004', 'caretaker4@arenahomes.test', 'ACTIVE', NULL, 'Michael Achieng +254712345014', now(), now()),
    (EMP5_UUID, NULL, 'CARETAKER', 'Brian Kiptoo', '+254712345005', '+254712345005', 'caretaker5@arenahomes.test', 'ACTIVE', NULL, 'Sarah Kiptoo +254712345015', now(), now()),
    (EMP6_UUID, NULL, 'CARETAKER', 'Faith Njeri', '+254712345006', '+254712345006', 'caretaker6@arenahomes.test', 'ACTIVE', NULL, 'David Njeri +254712345016', now(), now()),
    (EMP7_UUID, NULL, 'CARETAKER', 'Samuel Kamau', '+254712345007', '+254712345007', 'caretaker7@arenahomes.test', 'ACTIVE', NULL, 'Jane Kamau +254712345017', now(), now()),
    (EMP8_UUID, NULL, 'CARETAKER', 'Mercy Atieno', '+254712345008', '+254712345008', 'caretaker8@arenahomes.test', 'ACTIVE', NULL, 'Peter Atieno +254712345018', now(), now()),
    (EMP9_UUID, NULL, 'CARETAKER', 'Daniel Mutua', '+254712345009', '+254712345009', 'caretaker9@arenahomes.test', 'ACTIVE', NULL, 'Lucy Mutua +254712345019', now(), now()),
    (EMP10_UUID, NULL, 'CARETAKER', 'Esther Chebet', '+254712345010', '+254712345010', 'caretaker10@arenahomes.test', 'ACTIVE', NULL, 'Joseph Chebet +254712345020', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    whatsapp_number = EXCLUDED.whatsapp_number,
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    updated_at = now();

  RETURN QUERY SELECT 'INSERT'::text, 'Caretaker Employees'::text, (SELECT COUNT(*)::bigint FROM public.employees WHERE role_id = 'CARETAKER');

  -- ========================================================================
  -- PART B: INSERT PROPERTIES (caretaker_user_id = NULL initially)
  -- ========================================================================
  
  INSERT INTO public.properties (id, name, location, description, property_type, latitude, longitude, caretaker_employee_id, caretaker_user_id, verification_status, listing_status, price_min, price_max, deposit_required, deposit_amount, gate_open_time, gate_close_time, water_source, security_description, parking_available, wifi_available, trash_collection, rules_summary, distance_from_school_km, school_gate_distance_meters, cover_photo_url, gate_photo_url, created_at, updated_at)
  VALUES 
    (PROP1_UUID, 'Greenview Hostels', 'Thika Road, Near USIU-Africa', 'Modern student hostel with 24/7 security, high-speed WiFi, and spacious study areas. Located just 5 minutes from USIU-Africa main gate.', 'HOSTEL', -1.2189, 36.8901, EMP1_UUID, NULL, 'VERIFIED', 'PUBLISHED', 4500.00, 8500.00, true, 3000.00, '05:00', '23:00', 'BOREHOLE + CITY COUNCIL', '24/7 Guard + CCTV + Access Control', true, true, 'DAILY MORNING COLLECTION', 'No loud music after 10 PM. Visitors must sign in at gate.', 0.8, 800, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', now(), now()),
    (PROP2_UUID, 'Sunrise Court', 'Roysambu, Along Thika Road', 'Affordable student apartments with excellent transport links. Offers well-lit rooms, reliable water supply, and peaceful study environment.', 'APARTMENT', -1.2156, 36.8934, EMP2_UUID, NULL, 'VERIFIED', 'PUBLISHED', 5000.00, 9500.00, true, 3500.00, '05:30', '22:30', 'BOREHOLE + STORAGE TANKS', 'Night Guard + Perimeter Wall + Electric Fence', true, true, 'THREE TIMES WEEKLY', 'Quiet hours 10 PM - 6 AM. One visitor per student at a time.', 1.2, 1200, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', now(), now()),
    (PROP3_UUID, 'Arena Heights', 'Kasarani, Near Safari Park Hotel', 'Premium student residence with modern amenities. Features en-suite bathrooms, gym, and dedicated parking.', 'APARTMENT', -1.2234, 36.9012, EMP3_UUID, NULL, 'VERIFIED', 'PUBLISHED', 7500.00, 15000.00, true, 5000.00, '05:00', '23:30', 'BOREHOLE + SOLAR HEATING', '24/7 Security + CCTV + Biometric Access', true, true, 'DAILY COLLECTION', 'Strict noise policy. Professional conduct expected. No subletting.', 1.5, 1500, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', now(), now()),
    (PROP4_UUID, 'Palm Gardens', 'Githurai 45, Off Thika Road', 'Budget-friendly student housing with homely atmosphere. Clean, secure accommodation with friendly community.', 'HOSTEL', -1.2067, 36.9102, EMP4_UUID, NULL, 'VERIFIED', 'PUBLISHED', 3500.00, 6500.00, true, 2500.00, '06:00', '22:00', 'CITY COUNCIL + RESERVE TANKS', 'Day Guard + Night Watchman + Secure Gate', false, false, 'DAILY EVENING COLLECTION', 'Gate closes at 10 PM sharp. No overnight visitors. Shared cleaning duties.', 2.0, 2000, 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800', 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800', now(), now()),
    (PROP5_UUID, 'Royal Nest Apartments', 'Ruiru, Near Ruiru Town Center', 'Executive student apartments with hotel-like amenities. Fully furnished options, premium security, serene environment.', 'APARTMENT', -1.1834, 36.9567, EMP5_UUID, NULL, 'VERIFIED', 'PUBLISHED', 9000.00, 18000.00, true, 6000.00, '05:00', '23:00', 'BOREHOLE + WATER TREATMENT', '24/7 Manned Security + CCTV + Access Cards', true, true, 'DAILY COLLECTION', 'Strict dress code in common areas. Visitor registration mandatory.', 3.5, 3500, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', now(), now()),
    (PROP6_UUID, 'Bluegate Residence', 'Kahawa Sukari, Near Kenyatta University', 'Popular choice for KU students with excellent connectivity. Spacious rooms, steady water supply, vibrant community.', 'HOSTEL', -1.1890, 36.9234, EMP6_UUID, NULL, 'VERIFIED', 'PUBLISHED', 4000.00, 8000.00, true, 3000.00, '05:30', '22:30', 'BOREHOLE + BACKUP STORAGE', 'Security Guard + CCTV + Controlled Gate', true, true, 'DAILY MORNING', 'No alcohol on premises. Respectful behavior required. Gate access via student ID.', 2.8, 2800, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', now(), now()),
    (PROP7_UUID, 'Hilltop Homes', 'Muthaiga North, Near USIU', 'Serene hilltop location with panoramic views. Premium accommodation away from city noise with mature gardens.', 'APARTMENT', -1.2289, 36.8845, EMP7_UUID, NULL, 'VERIFIED', 'PUBLISHED', 8000.00, 14000.00, true, 4500.00, '05:00', '23:00', 'BOREHOLE + RAINWATER HARVESTING', '24/7 Security + Guard Dogs + Electric Fence', true, true, 'DAILY', 'Environmental consciousness encouraged. No loud music ever.', 1.0, 1000, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', now(), now()),
    (PROP8_UUID, 'Scholar''s Haven', 'Thika Road, Near DeKUT Nairobi Campus', 'Dedicated study-focused environment with 24-hour reading room, computer lab, and strict noise policies.', 'HOSTEL', -1.2123, 36.8989, EMP8_UUID, NULL, 'VERIFIED', 'PUBLISHED', 5500.00, 10000.00, true, 4000.00, '05:00', '22:00', 'CITY WATER + BOREHOLE BACKUP', 'Security Personnel + CCTV + Biometric Entry', false, true, 'TWICE DAILY', 'Academic focus mandatory. Library silence in common areas. Study room 24/7 access.', 1.8, 1800, 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', now(), now()),
    (PROP9_UUID, 'Unity Place', 'Roysambu, Along Lumumba Drive', 'Diverse student community with inclusive atmosphere. Welcomes students from all backgrounds with cultural exchange opportunities.', 'APARTMENT', -1.2167, 36.8956, EMP9_UUID, NULL, 'VERIFIED', 'PUBLISHED', 6000.00, 11000.00, true, 3500.00, '05:30', '22:30', 'BOREHOLE + SOLAR HEATING', 'Day/Night Guards + CCTV + Secure Parking', true, true, 'DAILY', 'Respect for diversity required. Community events encouraged. Zero tolerance for discrimination.', 1.3, 1300, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800', now(), now()),
    (PROP10_UUID, 'Silverline Flats', 'Kasarani, Near Thika Road Mall', 'Modern apartment complex close to shopping and entertainment. Contemporary living with easy access to TRM, cinemas, and restaurants.', 'APARTMENT', -1.2211, 36.9045, EMP10_UUID, NULL, 'VERIFIED', 'PUBLISHED', 7000.00, 13000.00, true, 4000.00, '05:00', '23:00', 'CITY WATER + BOREHOLE + STORAGE', '24/7 Security + CCTV + Intercom', true, true, 'DAILY MORNING', 'Urban living standards apply. Responsible alcohol consumption only.', 2.2, 2200, 'https://images.unsplash.com/photo-1600585154363-67ebafe0b31b?w=800', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    description = EXCLUDED.description,
    property_type = EXCLUDED.property_type,
    caretaker_employee_id = EXCLUDED.caretaker_employee_id,
    verification_status = EXCLUDED.verification_status,
    listing_status = EXCLUDED.listing_status,
    updated_at = now();

  -- Update employees with their assigned properties now that properties exist
  UPDATE public.employees SET assigned_property_id = PROP1_UUID WHERE id = EMP1_UUID;
  UPDATE public.employees SET assigned_property_id = PROP2_UUID WHERE id = EMP2_UUID;
  UPDATE public.employees SET assigned_property_id = PROP3_UUID WHERE id = EMP3_UUID;
  UPDATE public.employees SET assigned_property_id = PROP4_UUID WHERE id = EMP4_UUID;
  UPDATE public.employees SET assigned_property_id = PROP5_UUID WHERE id = EMP5_UUID;
  UPDATE public.employees SET assigned_property_id = PROP6_UUID WHERE id = EMP6_UUID;
  UPDATE public.employees SET assigned_property_id = PROP7_UUID WHERE id = EMP7_UUID;
  UPDATE public.employees SET assigned_property_id = PROP8_UUID WHERE id = EMP8_UUID;
  UPDATE public.employees SET assigned_property_id = PROP9_UUID WHERE id = EMP9_UUID;
  UPDATE public.employees SET assigned_property_id = PROP10_UUID WHERE id = EMP10_UUID;

  RETURN QUERY SELECT 'INSERT'::text, 'Properties'::text, (SELECT COUNT(*)::bigint FROM public.properties WHERE id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID));

  -- ========================================================================
  -- PART C: INSERT UNITS FOR ALL 10 PROPERTIES
  -- ========================================================================
  
  -- Property 1: Greenview Hostels - 16 units
  FOR v_counter IN 1..16 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE 
      WHEN v_counter <= 4 THEN 'BEDSITTER'::text
      WHEN v_counter <= 8 THEN 'SINGLE ROOM'::text
      WHEN v_counter <= 12 THEN 'STUDIO'::text
      ELSE 'ONE BEDROOM'::text
    END;
    v_base_price := CASE v_rt 
      WHEN 'BEDSITTER' THEN 4500 
      WHEN 'SINGLE ROOM' THEN 5500 
      WHEN 'STUDIO' THEN 6000 
      ELSE 7000 
    END + floor(random() * 1500);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (
      v_unit_uuid, 
      PROP1_UUID, 
      CASE 
        WHEN v_counter <= 8 THEN 'A' || v_counter::text 
        WHEN v_counter <= 12 THEN 'B' || (v_counter-8)::text 
        ELSE 'C' || (v_counter-12)::text 
      END,
      v_rt, 
      v_rt,
      v_base_price,
      CASE WHEN v_counter IN (1,2,13,14) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,13,14) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 0 END, 
      1, 
      1, 
      v_base_price * 0.5, 
      true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'study_table', true)
    );
  END LOOP;

  -- Property 2: Sunrise Court - 12 units
  FOR v_counter IN 1..12 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 4 THEN 'BEDSITTER'::text WHEN v_counter <= 8 THEN 'SINGLE ROOM'::text ELSE 'ONE BEDROOM'::text END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 5000 WHEN 'SINGLE ROOM' THEN 6000 ELSE 8000 END + floor(random() * 1500);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP2_UUID, CASE WHEN v_counter <= 4 THEN 'A' || v_counter::text WHEN v_counter <= 8 THEN 'B' || (v_counter-4)::text ELSE 'C' || (v_counter-8)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,3,9,10) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,3,9,10) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 0 END, 1, 1, v_base_price * 0.5, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true));
  END LOOP;

  -- Property 3: Arena Heights - 20 units
  FOR v_counter IN 1..20 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 5 THEN 'BEDSITTER'::text WHEN v_counter <= 10 THEN 'SINGLE ROOM'::text WHEN v_counter <= 15 THEN 'ONE BEDROOM'::text ELSE 'STUDIO'::text END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 7500 WHEN 'SINGLE ROOM' THEN 9000 WHEN 'ONE BEDROOM' THEN 12000 ELSE 10000 END + floor(random() * 2000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP3_UUID, CASE WHEN v_counter <= 5 THEN 'A' || v_counter::text WHEN v_counter <= 10 THEN 'B' || (v_counter-5)::text WHEN v_counter <= 15 THEN 'C' || (v_counter-10)::text ELSE 'D' || (v_counter-15)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,16,17) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,16,17) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 0 END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 1 END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 2 ELSE 1 END,
      v_base_price * 0.4, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'tv', true));
  END LOOP;

  -- Property 4: Palm Gardens - 10 units
  FOR v_counter IN 1..10 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter % 3 = 0 THEN 'BEDSITTER'::text WHEN v_counter % 3 = 1 THEN 'SINGLE ROOM'::text ELSE 'STUDIO'::text END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 3500 WHEN 'SINGLE ROOM' THEN 4500 ELSE 5500 END + floor(random() * 1000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP4_UUID, 'Room ' || (100 + v_counter)::text,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,3,8,9) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,3,8,9) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      0, 1, 1, v_base_price * 0.5, true,
      jsonb_build_object('wardrobe', true, 'bed', true));
  END LOOP;

  -- Property 5: Royal Nest Apartments - 18 units
  FOR v_counter IN 1..18 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 6 THEN 'ONE BEDROOM'::text WHEN v_counter <= 12 THEN 'STUDIO'::text ELSE 'TWO BEDROOM'::text END;
    v_base_price := CASE v_rt WHEN 'STUDIO' THEN 9000 WHEN 'ONE BEDROOM' THEN 12000 ELSE 15000 END + floor(random() * 2500);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP5_UUID, CASE WHEN v_counter <= 6 THEN 'A' || v_counter::text WHEN v_counter <= 12 THEN 'B' || (v_counter-6)::text ELSE 'C' || (v_counter-12)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,13,14) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,13,14) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 WHEN 'TWO BEDROOM' THEN 2 ELSE 0 END,
      CASE v_rt WHEN 'TWO BEDROOM' THEN 2 ELSE 1 END,
      CASE v_rt WHEN 'TWO BEDROOM' THEN 3 ELSE 2 END,
      v_base_price * 0.4, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'tv', true, 'gym_access', true));
  END LOOP;

  -- Property 6: Bluegate Residence - 14 units
  FOR v_counter IN 1..14 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 4 THEN 'BEDSITTER' WHEN v_counter <= 8 THEN 'SINGLE ROOM' WHEN v_counter <= 12 THEN 'ONE BEDROOM' ELSE 'STUDIO' END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 4000 WHEN 'SINGLE ROOM' THEN 5500 WHEN 'ONE BEDROOM' THEN 7000 ELSE 6500 END + floor(random() * 1000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP6_UUID, CASE WHEN v_counter <= 4 THEN 'G' || v_counter::text WHEN v_counter <= 8 THEN '1' || (v_counter-4)::text WHEN v_counter <= 12 THEN '2' || (v_counter-8)::text ELSE 'P' || (v_counter-12)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,3,10,11) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,3,10,11) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 0 END, 1, 1, v_base_price * 0.5, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'study_table', true));
  END LOOP;

  -- Property 7: Hilltop Homes - 22 units
  FOR v_counter IN 1..22 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 6 THEN 'ONE BEDROOM' WHEN v_counter <= 12 THEN 'STUDIO' WHEN v_counter <= 18 THEN 'TWO BEDROOM' ELSE 'ONE BEDROOM' END;
    v_base_price := CASE v_rt WHEN 'STUDIO' THEN 8000 WHEN 'ONE BEDROOM' THEN 10000 ELSE 12000 END + floor(random() * 2000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP7_UUID, CASE WHEN v_counter <= 6 THEN 'A' || v_counter::text WHEN v_counter <= 12 THEN 'B' || (v_counter-6)::text WHEN v_counter <= 18 THEN 'C' || (v_counter-12)::text ELSE 'D' || (v_counter-18)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,19,20) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,19,20) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 WHEN 'TWO BEDROOM' THEN 2 ELSE 0 END,
      CASE v_rt WHEN 'TWO BEDROOM' THEN 2 ELSE 1 END,
      CASE v_rt WHEN 'TWO BEDROOM' THEN 3 ELSE 2 END,
      v_base_price * 0.35, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'balcony_view', true));
  END LOOP;

  -- Property 8: Scholar's Haven - 12 units
  FOR v_counter IN 1..12 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE (v_counter % 4) WHEN 0 THEN 'BEDSITTER' WHEN 1 THEN 'SINGLE ROOM' WHEN 2 THEN 'ONE BEDROOM' ELSE 'STUDIO' END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 5500 WHEN 'SINGLE ROOM' THEN 6500 WHEN 'STUDIO' THEN 8000 ELSE 9000 END + floor(random() * 1000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP8_UUID, 'SH' || v_counter::text,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,3,10,11) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,3,10,11) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 0 END, 1, 1, v_base_price * 0.45, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'study_desk', true, 'bookshelf', true));
  END LOOP;

  -- Property 9: Unity Place - 16 units
  FOR v_counter IN 1..16 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 4 THEN 'BEDSITTER' WHEN v_counter <= 8 THEN 'SINGLE ROOM' WHEN v_counter <= 12 THEN 'ONE BEDROOM' ELSE 'STUDIO' END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 6000 WHEN 'SINGLE ROOM' THEN 7000 WHEN 'STUDIO' THEN 9000 ELSE 10000 END + floor(random() * 1000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP9_UUID, CASE WHEN v_counter <= 4 THEN 'U' || v_counter::text WHEN v_counter <= 8 THEN 'N' || (v_counter-4)::text WHEN v_counter <= 12 THEN 'I' || (v_counter-8)::text ELSE 'T' || (v_counter-12)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,3,11,12) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,3,11,12) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 ELSE 0 END, 1, 1, v_base_price * 0.4, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true));
  END LOOP;

  -- Property 10: Silverline Flats - 24 units
  FOR v_counter IN 1..24 LOOP
    v_unit_uuid := gen_random_uuid();
    v_rt := CASE WHEN v_counter <= 6 THEN 'STUDIO' WHEN v_counter <= 12 THEN 'ONE BEDROOM' WHEN v_counter <= 18 THEN 'TWO BEDROOM' ELSE 'BEDSITTER' END;
    v_base_price := CASE v_rt WHEN 'BEDSITTER' THEN 7000 WHEN 'STUDIO' THEN 9500 WHEN 'ONE BEDROOM' THEN 11000 ELSE 13000 END + floor(random() * 2000);
    
    INSERT INTO public.units (id, property_id, room_number, room_type, type, base_price, status, availability_status, bedrooms, bathrooms, capacity, deposit_amount, is_public, amenities)
    VALUES (v_unit_uuid, PROP10_UUID, CASE WHEN v_counter <= 6 THEN 'S' || v_counter::text WHEN v_counter <= 12 THEN 'F' || (v_counter-6)::text WHEN v_counter <= 18 THEN 'L' || (v_counter-12)::text ELSE 'P' || (v_counter-18)::text END,
      v_rt, v_rt, v_base_price,
      CASE WHEN v_counter IN (1,2,3,4,19,20) THEN 'VACANT'::public.unit_status ELSE 'TAKEN'::public.unit_status END,
      CASE WHEN v_counter IN (1,2,3,4,19,20) THEN 'AVAILABLE'::public.unit_availability_status ELSE 'OCCUPIED'::public.unit_availability_status END,
      CASE v_rt WHEN 'ONE BEDROOM' THEN 1 WHEN 'TWO BEDROOM' THEN 2 ELSE 0 END,
      CASE v_rt WHEN 'TWO BEDROOM' THEN 2 ELSE 1 END,
      CASE v_rt WHEN 'TWO BEDROOM' THEN 3 ELSE 2 END,
      v_base_price * 0.35, true,
      jsonb_build_object('wifi', true, 'furniture', true, 'wardrobe', true, 'tv', true, 'city_view', true));
  END LOOP;

  RETURN QUERY SELECT 'INSERT'::text, 'Units'::text, (SELECT COUNT(*)::bigint FROM public.units WHERE property_id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID));

  -- ========================================================================
  -- PART D: INSERT SAMPLE TENANTS FOR OCCUPIED UNITS (user_id = NULL)
  -- ========================================================================
  
  -- Insert 40 sample tenants for occupied units
  WITH occupied_units AS (
    SELECT u.id as unit_id, u.property_id, u.room_number, u.base_price,
           p.caretaker_employee_id,
           row_number() over (order by u.id) as rn
    FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE u.availability_status = 'OCCUPIED'
    AND u.property_id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID)
    ORDER BY random()
    LIMIT 40
  )
  INSERT INTO public.tenants (id, user_id, full_name, phone_number, whatsapp_number, email, property_id, unit_id, room_number, caretaker_employee_id, move_in_date, status, created_at, updated_at)
  SELECT 
    gen_random_uuid(), 
    NULL,
    CASE (ou.rn % 20)
      WHEN 1 THEN 'John Kamau'
      WHEN 2 THEN 'Alice Wanjiru'
      WHEN 3 THEN 'Michael Omondi'
      WHEN 4 THEN 'Sarah Njeri'
      WHEN 5 THEN 'David Kimani'
      WHEN 6 THEN 'Grace Muthoni'
      WHEN 7 THEN 'Peter Njoroge'
      WHEN 8 THEN 'Esther Wangari'
      WHEN 9 THEN 'Joseph Kariuki'
      WHEN 10 THEN 'Mary Wangui'
      WHEN 11 THEN 'Paul Mwangi'
      WHEN 12 THEN 'Jane Akinyi'
      WHEN 13 THEN 'Samuel Otieno'
      WHEN 14 THEN 'Lucy Achieng'
      WHEN 15 THEN 'Daniel Kipchirchir'
      WHEN 16 THEN 'Ruth Jepchirchir'
      WHEN 17 THEN 'Simon Maina'
      WHEN 18 THEN 'Ann Mwende'
      WHEN 19 THEN 'George Ochieng'
      ELSE 'Lilian Chepkoech'
    END || ' ' || (100 + ou.rn)::text,
    '+2547' || lpad((10000000 + (random() * 89999999)::integer)::text, 8, '0'),
    '+2547' || lpad((10000000 + (random() * 89999999)::integer)::text, 8, '0'),
    'tenant' || ou.rn || '@student.ac.ke',
    ou.property_id, 
    ou.unit_id, 
    ou.room_number, 
    ou.caretaker_employee_id,
    current_date - (random() * 180)::integer, 
    'ACTIVE', 
    now(), 
    now()
  FROM occupied_units ou;

  RETURN QUERY SELECT 'INSERT'::text, 'Tenants'::text, (SELECT COUNT(*)::bigint FROM public.tenants WHERE property_id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID));

  -- ========================================================================
  -- PART E: INSERT LEASES FOR TENANTS
  -- ========================================================================
  
  INSERT INTO public.leases (id, tenant_id, unit_id, property_id, lease_number, start_date, end_date, rent_amount, deposit_amount, status, auto_renew, created_at, updated_at)
  SELECT 
    gen_random_uuid(), t.id, t.unit_id, t.property_id,
    'LS-' || to_char(now(), 'YYYY') || '-' || lpad(row_number() over ()::text, 4, '0'),
    t.move_in_date, t.move_in_date + 365, u.base_price, u.base_price * 0.5,
    'ACTIVE'::public.lease_status, true, now(), now()
  FROM public.tenants t
  JOIN public.units u ON t.unit_id = u.id
  WHERE t.property_id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID);

  RETURN QUERY SELECT 'INSERT'::text, 'Leases'::text, (SELECT COUNT(*)::bigint FROM public.leases l JOIN public.tenants t ON l.tenant_id = t.id WHERE t.property_id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID));

  -- ========================================================================
  -- PART F: INSERT PROPERTY FACILITIES
  -- ========================================================================
  
  INSERT INTO public.property_facilities (property_id, water_source, water_availability_days, security, parking, wifi, trash_collection, notes, created_at, updated_at)
  VALUES 
    (PROP1_UUID, 'BOREHOLE + CITY COUNCIL', '7 days/week', '24/7 Guard + CCTV + Access Control', true, true, 'Daily Morning', 'Reliable water supply with backup storage', now(), now()),
    (PROP2_UUID, 'BOREHOLE + STORAGE TANKS', '7 days/week', 'Night Guard + Perimeter Wall + Electric Fence', true, true, 'Mon/Wed/Fri', '10000 liter reserve tank capacity', now(), now()),
    (PROP3_UUID, 'BOREHOLE + SOLAR HEATING', '7 days/week', '24/7 Security + CCTV + Biometric Access', true, true, 'Daily Collection', 'Premium security with patrols', now(), now()),
    (PROP4_UUID, 'CITY COUNCIL + RESERVE TANKS', '5-7 days/week', 'Day Guard + Night Watchman', false, false, 'Daily Evening', 'Water rationing days have backup', now(), now()),
    (PROP5_UUID, 'BOREHOLE + WATER TREATMENT', '7 days/week', '24/7 Manned Security + CCTV + Access Cards', true, true, 'Daily Collection', 'Treated drinking water available', now(), now()),
    (PROP6_UUID, 'BOREHOLE + BACKUP STORAGE', '7 days/week', 'Security Guard + CCTV + Controlled Gate', true, true, 'Daily Morning', '5000 liter backup per building', now(), now()),
    (PROP7_UUID, 'BOREHOLE + RAINWATER HARVESTING', '7 days/week', '24/7 Security + Guard Dogs + Electric Fence', true, true, 'Daily', 'Eco-friendly water harvesting system', now(), now()),
    (PROP8_UUID, 'CITY WATER + BOREHOLE BACKUP', '7 days/week', 'Security Personnel + CCTV + Biometric Entry', false, true, 'Twice Daily', 'Uninterrupted supply for study focus', now(), now()),
    (PROP9_UUID, 'BOREHOLE + SOLAR HEATING', '7 days/week', 'Day/Night Guards + CCTV', true, true, 'Daily', 'Community water conservation program', now(), now()),
    (PROP10_UUID, 'CITY WATER + BOREHOLE + STORAGE', '7 days/week', '24/7 Security + CCTV + Intercom', true, true, 'Daily Morning', 'Triple redundancy water system', now(), now())
  ON CONFLICT (property_id) DO UPDATE SET water_source = EXCLUDED.water_source, security = EXCLUDED.security, updated_at = now();

  RETURN QUERY SELECT 'INSERT'::text, 'Property Facilities'::text, (SELECT COUNT(*)::bigint FROM public.property_facilities WHERE property_id IN (PROP1_UUID, PROP2_UUID, PROP3_UUID, PROP4_UUID, PROP5_UUID, PROP6_UUID, PROP7_UUID, PROP8_UUID, PROP9_UUID, PROP10_UUID));

  RETURN;
END;
$$;

-- ============================================================================
-- PART 2: EXECUTE SEED
-- ============================================================================

SELECT * FROM public.seed_arena_data();

-- ============================================================================
-- PART 3: DROP SEED FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.seed_arena_data();

-- ============================================================================
-- PART 4: HELPER FUNCTION TO LINK CARETAKER AUTH USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_caretaker_auth_users()
RETURNS TABLE (caretaker_email text, old_user_id uuid, new_user_id uuid, property_name text, updated boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caretaker RECORD;
  v_auth_user_id uuid;
BEGIN
  FOR v_caretaker IN 
    SELECT e.id as employee_id, e.email, e.user_id as old_user_id, e.assigned_property_id, p.name as property_name
    FROM public.employees e
    LEFT JOIN public.properties p ON e.assigned_property_id = p.id
    WHERE e.role_id = 'CARETAKER'
  LOOP
    SELECT id INTO v_auth_user_id FROM auth.users WHERE email = v_caretaker.email LIMIT 1;
    
    IF v_auth_user_id IS NOT NULL THEN
      UPDATE public.employees SET user_id = v_auth_user_id, updated_at = now() WHERE id = v_caretaker.employee_id;
      UPDATE public.properties SET caretaker_user_id = v_auth_user_id, updated_at = now() WHERE caretaker_employee_id = v_caretaker.employee_id;
      UPDATE public.tenants SET caretaker_user_id = v_auth_user_id, updated_at = now() WHERE property_id = v_caretaker.assigned_property_id;
      RETURN QUERY SELECT v_caretaker.email, v_caretaker.old_user_id, v_auth_user_id, v_caretaker.property_name, true;
    ELSE
      RETURN QUERY SELECT v_caretaker.email, v_caretaker.old_user_id, NULL::uuid, v_caretaker.property_name, false;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- PART 5: VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_seed_data()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'seed_migration', '0017_seed_properties_caretakers_units.sql',
    'validated_at', now(),
    'properties', (SELECT COUNT(*) FROM public.properties),
    'caretakers', (SELECT COUNT(*) FROM public.employees WHERE role_id = 'CARETAKER'),
    'active_caretakers', (SELECT COUNT(*) FROM public.employees WHERE role_id = 'CARETAKER' AND status = 'ACTIVE'),
    'total_units', (SELECT COUNT(*) FROM public.units),
    'vacant_units', (SELECT COUNT(*) FROM public.units WHERE availability_status = 'AVAILABLE'),
    'occupied_units', (SELECT COUNT(*) FROM public.units WHERE availability_status = 'OCCUPIED'),
    'tenants', (SELECT COUNT(*) FROM public.tenants),
    'active_leases', (SELECT COUNT(*) FROM public.leases WHERE status = 'ACTIVE'),
    'views_working', jsonb_build_object(
      'caretaker_dashboard_view', (SELECT COUNT(*) FROM public.caretaker_dashboard_view),
      'admin_properties_view', (SELECT COUNT(*) FROM public.admin_properties_view),
      'public_properties_view', (SELECT COUNT(*) FROM public.public_properties_view)
    ),
    'property_summary', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', p.name,
        'caretaker', e.full_name,
        'total_units', (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id),
        'vacant', (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.availability_status = 'AVAILABLE'),
        'occupied', (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.availability_status = 'OCCUPIED'),
        'tenants', (SELECT COUNT(*) FROM public.tenants t WHERE t.property_id = p.id)
      ) ORDER BY p.name)
      FROM public.properties p
      LEFT JOIN public.employees e ON p.caretaker_employee_id = e.id
    )
  );
$$;

-- ============================================================================
-- PART 6: VALIDATE
-- ============================================================================

SELECT public.validate_seed_data();

-- ============================================================================
-- PART 7: RESTORE CONSTRAINTS (Optional - keep nullable for flexibility)
-- ============================================================================
-- NOTE: Constraints are left nullable to allow future caretaker creation
-- without auth users. The link_caretaker_auth_users() function handles
-- the association when auth users are created.
-- Uncomment below if you want to restore strict constraints:
-- ALTER TABLE public.employees ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.properties ALTER COLUMN caretaker_user_id SET NOT NULL;
-- ALTER TABLE public.tenants ALTER COLUMN user_id SET NOT NULL;

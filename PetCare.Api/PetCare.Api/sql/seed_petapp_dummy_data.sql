\set ON_ERROR_STOP on
\set app_user_password_hash 'PBKDF2$100000$ueA8vWpzGnrUAtZ3bmHLjw==$9pshqD8/3IaFowq7ClD9R592ooSBuwD5Nbx3CnSrnoE='
\set admin_user_password_hash 'PBKDF2$100000$XxDpTQPmf35HDIarb3iDcA==$jQf6Evg1okAR4ljQ2UKSppej0c43A/2+vyGHGSg9WDE='

-- Loads a full local/demo dataset into a PetCare database whose schema has
-- already been created by EF Core migrations.
--
-- This script is intentionally destructive for local development:
--   - it truncates the current PetCare app tables
--   - it inserts a fresh, deterministic sample dataset
--   - it replaces demo placeholder URLs with live internet image URLs
--
-- Image sources used in the seeded data:
--   - Random User Generator portraits: https://randomuser.me/
--   - Lorem Picsum seeded photos: https://picsum.photos/
--
-- Seeded login passwords remain:
--   - app users:   PetCareUser!2026
--   - admin users: PetCareAdmin!2026
--
-- Example:
--   psql -h 127.0.0.1 -U petapp -d petapp -f sql/seed_petapp_dummy_data.sql

\connect petapp

BEGIN;

TRUNCATE TABLE
    public.admin_action_logs,
    public.reports,
    public.place_owner_applications,
    public.pet_place_reviews,
    public.medication_records,
    public.illness_records,
    public.vaccine_records,
    public.consultations,
    public.forum_post_attachments,
    public.forum_post_bookmarks,
    public.forum_post_likes,
    public.forum_posts,
    public.pet_place_schedules,
    public.pets,
    public.pet_places,
    public.breeds,
    public.species,
    public.admin_users,
    public.users
RESTART IDENTITY CASCADE;

INSERT INTO public.species (id, code, name)
VALUES
    (1, 'cat', 'Cat'),
    (2, 'dog', 'Dog'),
    (3, 'bird', 'Bird'),
    (4, 'rabbit', 'Rabbit'),
    (5, 'hamster', 'Hamster'),
    (6, 'fish', 'Fish'),
    (7, 'turtle', 'Turtle'),
    (8, 'horse', 'Horse'),
    (9, 'ferret', 'Ferret'),
    (10, 'parrot', 'Parrot');

INSERT INTO public.breeds (id, species_id, name)
VALUES
    (1, 1, 'Persian'),
    (2, 1, 'Siamese'),
    (3, 2, 'Labrador Retriever'),
    (4, 2, 'German Shepherd'),
    (5, 3, 'Budgerigar'),
    (6, 3, 'Cockatiel'),
    (7, 4, 'Holland Lop'),
    (8, 4, 'Mini Rex'),
    (9, 5, 'Syrian Hamster'),
    (10, 5, 'Dwarf Hamster'),
    (11, 6, 'Betta'),
    (12, 6, 'Goldfish'),
    (13, 7, 'Red-Eared Slider'),
    (14, 7, 'Russian Tortoise'),
    (15, 8, 'Arabian'),
    (16, 8, 'Quarter Horse'),
    (17, 9, 'Standard Ferret'),
    (18, 9, 'Angora Ferret'),
    (19, 10, 'African Grey'),
    (20, 10, 'Sun Conure');

INSERT INTO public.users (
    id,
    username,
    first_name,
    last_name,
    email,
    password_hash,
    email_verified,
    email_verification_token_hash,
    email_verification_token_expires_at,
    avatar_url,
    description,
    is_banned,
    is_approved_place_owner,
    banned_at,
    ban_reason,
    created_at,
    last_login
)
VALUES
    (
        1,
        'sara.haddad',
        'Sara',
        'Haddad',
        'sara.haddad@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/12.jpg',
        'Cat parent who keeps careful health notes and plans every vaccination reminder ahead of time.',
        false,
        false,
        NULL,
        NULL,
        '2025-11-03T09:10:00Z',
        '2026-04-20T18:40:00Z'
    ),
    (
        2,
        'maya.khoury',
        'Maya',
        'Khoury',
        'maya.khoury@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/24.jpg',
        'Rescue volunteer who shares adoption tips and keeps excellent follow-up notes after consultations.',
        false,
        true,
        NULL,
        NULL,
        '2025-11-11T13:20:00Z',
        '2026-04-19T20:15:00Z'
    ),
    (
        3,
        'layla.issa',
        'Layla',
        'Issa',
        'layla.issa@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/36.jpg',
        'Rabbit owner focused on enrichment routines, feeding logs, and quiet recovery spaces.',
        false,
        false,
        NULL,
        NULL,
        '2025-12-02T08:45:00Z',
        '2026-04-18T16:55:00Z'
    ),
    (
        4,
        'nour.daher',
        'Nour',
        'Daher',
        'nour.daher@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/44.jpg',
        'Tracks bird sleep and feeding windows carefully and posts practical care checklists in the forum.',
        false,
        false,
        NULL,
        NULL,
        '2025-12-14T19:05:00Z',
        '2026-04-18T11:20:00Z'
    ),
    (
        5,
        'yara.rahal',
        'Yara',
        'Rahal',
        'yara.rahal@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/58.jpg',
        'Keeps detailed tank logs and loves comparing product setups for small pets and aquariums.',
        false,
        true,
        NULL,
        NULL,
        '2025-12-28T10:30:00Z',
        '2026-04-17T21:45:00Z'
    ),
    (
        6,
        'omar.nasser',
        'Omar',
        'Nasser',
        'omar.nasser@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/11.jpg',
        'Weekend hiker with a shepherd mix and a habit of turning vet advice into step-by-step routines.',
        false,
        true,
        NULL,
        NULL,
        '2026-01-06T11:40:00Z',
        '2026-04-20T17:05:00Z'
    ),
    (
        7,
        'karim.farah',
        'Karim',
        'Farah',
        'karim.farah@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/21.jpg',
        'Ferret owner and apartment-proofing nerd who saves every checklist before trying something new.',
        false,
        false,
        NULL,
        NULL,
        '2026-01-15T15:00:00Z',
        '2026-04-19T14:22:00Z'
    ),
    (
        8,
        'elias.saad',
        'Elias',
        'Saad',
        'elias.saad@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/32.jpg',
        'Equine rider who uses the app to plan emergency vet contacts, medication schedules, and trail prep.',
        false,
        false,
        NULL,
        NULL,
        '2026-01-21T07:55:00Z',
        '2026-04-16T09:10:00Z'
    ),
    (
        9,
        'ziad.shahin',
        'Ziad',
        'Shahin',
        'ziad.shahin@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/41.jpg',
        'Exotic pet enthusiast focused on turtles, parrots, and keeping long-term care notes consistent.',
        false,
        false,
        NULL,
        NULL,
        '2026-01-27T18:10:00Z',
        '2026-04-18T22:35:00Z'
    ),
    (
        10,
        'rami.shaheen',
        'Rami',
        'Shaheen',
        'rami.shaheen@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/52.jpg',
        'Occasional forum poster whose account is left in the dataset as a moderation example.',
        true,
        false,
        '2026-04-10T08:30:00Z',
        'Repeated promotional spam in the forum.',
        '2026-02-04T12:15:00Z',
        '2026-04-09T19:30:00Z'
    );

INSERT INTO public.admin_users (
    id,
    username,
    first_name,
    last_name,
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at,
    last_login
)
VALUES
    (1, 'dana.farah', 'Dana', 'Farah', 'dana.farah@petcare.local', :'admin_user_password_hash', 'Admin', true, '2025-11-01T08:00:00Z', '2026-04-20T09:00:00Z', '2026-04-20T09:00:00Z'),
    (2, 'rami.saab', 'Rami', 'Saab', 'rami.saab@petcare.local', :'admin_user_password_hash', 'Manager', true, '2025-11-03T08:15:00Z', '2026-04-20T09:10:00Z', '2026-04-20T09:10:00Z'),
    (3, 'leila.ayoub', 'Leila', 'Ayoub', 'leila.ayoub@petcare.local', :'admin_user_password_hash', 'Manager', true, '2025-11-06T08:30:00Z', '2026-04-19T10:20:00Z', '2026-04-19T10:20:00Z'),
    (4, 'joseph.khoury', 'Joseph', 'Khoury', 'joseph.khoury@petcare.local', :'admin_user_password_hash', 'Admin', true, '2025-11-09T08:45:00Z', '2026-04-18T12:05:00Z', '2026-04-18T12:05:00Z'),
    (5, 'tina.hage', 'Tina', 'Hage', 'tina.hage@petcare.local', :'admin_user_password_hash', 'Manager', true, '2025-11-14T09:00:00Z', '2026-04-18T08:50:00Z', '2026-04-18T08:50:00Z'),
    (6, 'nadim.bitar', 'Nadim', 'Bitar', 'nadim.bitar@petcare.local', :'admin_user_password_hash', 'Admin', true, '2025-11-18T09:15:00Z', '2026-04-17T11:30:00Z', '2026-04-17T11:30:00Z'),
    (7, 'rana.mattar', 'Rana', 'Mattar', 'rana.mattar@petcare.local', :'admin_user_password_hash', 'Manager', true, '2025-11-23T09:30:00Z', '2026-04-16T14:40:00Z', '2026-04-16T14:40:00Z'),
    (8, 'fadi.saliba', 'Fadi', 'Saliba', 'fadi.saliba@petcare.local', :'admin_user_password_hash', 'Admin', true, '2025-11-27T09:45:00Z', '2026-04-16T16:10:00Z', '2026-04-16T16:10:00Z'),
    (9, 'lynn.assaad', 'Lynn', 'Assaad', 'lynn.assaad@petcare.local', :'admin_user_password_hash', 'Manager', true, '2025-12-01T10:00:00Z', '2026-04-15T09:25:00Z', '2026-04-15T09:25:00Z'),
    (10, 'mark.hanna', 'Mark', 'Hanna', 'mark.hanna@petcare.local', :'admin_user_password_hash', 'Admin', false, '2025-12-05T10:15:00Z', '2026-04-14T08:00:00Z', NULL);

INSERT INTO public.pet_places (
    id,
    owner_user_id,
    name,
    phone,
    email,
    photo,
    description,
    address_line1,
    address_line2,
    city,
    country,
    status,
    type,
    lat,
    lon,
    created_at
)
VALUES
    ('10000000-0000-4000-8000-000000000001', NULL, 'Happy Paws Veterinary Center', '+1-206-555-0101', 'hello@happypawsvet.test', 'https://picsum.photos/seed/petcare-place-01/1200/800.jpg', 'Full-service clinic for wellness visits, diagnostics, and regular vaccination appointments.', '1200 Pine Street', 'Suite 220', 'Seattle', 'United States', 'Active', 'Vet', 47.610126, -122.334842, '2025-11-05T08:00:00Z'),
    ('10000000-0000-4000-8000-000000000002', NULL, 'Tail Market Pet Shop', '+1-206-555-0102', 'team@tailmarket.test', 'https://picsum.photos/seed/petcare-place-02/1200/800.jpg', 'Neighborhood shop for food, enrichment toys, carriers, and travel essentials.', '480 Union Street', NULL, 'Seattle', 'United States', 'Active', 'PetShop', 47.609650, -122.337132, '2025-11-07T10:00:00Z'),
    ('10000000-0000-4000-8000-000000000003', 2, 'Safe Haven Rescue Hub', '+1-425-555-0103', 'contact@safehavenrescue.test', 'https://picsum.photos/seed/petcare-place-03/1200/800.jpg', 'Adoption events, foster coordination, and intake support for local rescues.', '92 Lakeview Avenue', NULL, 'Bellevue', 'United States', 'Active', 'Other', 47.614512, -122.192739, '2025-11-09T09:30:00Z'),
    ('10000000-0000-4000-8000-000000000004', NULL, 'Riverbend Animal Hospital', '+1-503-555-0104', 'appointments@riverbendvet.test', 'https://picsum.photos/seed/petcare-place-04/1200/800.jpg', 'General practice hospital with diagnostics, lab work, and day procedures.', '550 Hawthorne Blvd', NULL, 'Portland', 'United States', 'Active', 'Vet', 45.512348, -122.658394, '2025-11-12T08:45:00Z'),
    ('10000000-0000-4000-8000-000000000005', 5, 'Cedar Grove Pet Supply', '+1-503-555-0105', 'hello@cedargrovepets.test', 'https://picsum.photos/seed/petcare-place-05/1200/800.jpg', 'Pet supply store with grooming basics, tank accessories, and nutrition brands.', '740 Division Street', NULL, 'Portland', 'United States', 'Active', 'PetShop', 45.504852, -122.651013, '2025-11-15T11:15:00Z'),
    ('10000000-0000-4000-8000-000000000006', NULL, 'Harbor Adoption Center', '+1-253-555-0106', 'team@harboradoption.test', 'https://picsum.photos/seed/petcare-place-06/1200/800.jpg', 'Adoption, foster intake, and volunteer orientation center with weekend events.', '18 Dockside Lane', NULL, 'Tacoma', 'United States', 'Inactive', 'Other', 47.252877, -122.444291, '2025-11-19T13:00:00Z'),
    ('10000000-0000-4000-8000-000000000007', NULL, 'Lakeview Exotic Vet', '+1-509-555-0107', 'care@lakeviewexotic.test', 'https://picsum.photos/seed/petcare-place-07/1200/800.jpg', 'Exotics-focused clinic for birds, reptiles, rabbits, and small mammals.', '211 Summit Road', 'Floor 2', 'Spokane', 'United States', 'Active', 'Vet', 47.658780, -117.426048, '2025-11-24T09:20:00Z'),
    ('10000000-0000-4000-8000-000000000008', NULL, 'Midtown Groom & Play', '+1-208-555-0108', 'service@midtowngroom.test', 'https://picsum.photos/seed/petcare-place-08/1200/800.jpg', 'Daycare and grooming business kept in the seed data as a closed-location example.', '66 Main Street', NULL, 'Boise', 'United States', 'Closed', 'Other', 43.615018, -116.202313, '2025-11-28T10:05:00Z'),
    ('10000000-0000-4000-8000-000000000009', 6, 'Green Trail Pet Outfitters', '+1-303-555-0109', 'sales@greentrailpets.test', 'https://picsum.photos/seed/petcare-place-09/1200/800.jpg', 'Outdoor pet gear, training tools, and long-hike supplies for active owners.', '1012 Pearl Street', NULL, 'Denver', 'United States', 'Active', 'PetShop', 39.750740, -104.999180, '2025-12-01T14:40:00Z'),
    ('10000000-0000-4000-8000-000000000010', NULL, 'Sunset Emergency Animal Hospital', '+1-303-555-0110', 'triage@sunsetemergency.test', 'https://picsum.photos/seed/petcare-place-10/1200/800.jpg', 'Emergency clinic listed in the app as a 24/7 option for urgent visits.', '880 Colfax Avenue', NULL, 'Denver', 'United States', 'Active', 'Vet', 39.740230, -104.982460, '2025-12-04T18:15:00Z');

WITH place_templates AS (
    VALUES
        ('10000000-0000-4000-8000-000000000001'::uuid, 'vet'),
        ('10000000-0000-4000-8000-000000000002'::uuid, 'shop'),
        ('10000000-0000-4000-8000-000000000003'::uuid, 'rescue'),
        ('10000000-0000-4000-8000-000000000004'::uuid, 'vet'),
        ('10000000-0000-4000-8000-000000000005'::uuid, 'shop'),
        ('10000000-0000-4000-8000-000000000006'::uuid, 'rescue'),
        ('10000000-0000-4000-8000-000000000007'::uuid, 'vet'),
        ('10000000-0000-4000-8000-000000000008'::uuid, 'closed'),
        ('10000000-0000-4000-8000-000000000009'::uuid, 'shop'),
        ('10000000-0000-4000-8000-000000000010'::uuid, 'emergency')
), schedule_templates AS (
    VALUES
        ('vet', 1, 'Monday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
        ('vet', 2, 'Tuesday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
        ('vet', 3, 'Wednesday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
        ('vet', 4, 'Thursday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
        ('vet', 5, 'Friday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
        ('vet', 6, 'Saturday', false, TIME '09:00', TIME '13:00', NULL, NULL),
        ('vet', 7, 'Sunday', true, NULL, NULL, NULL, NULL),
        ('shop', 1, 'Monday', false, TIME '10:00', TIME '20:00', NULL, NULL),
        ('shop', 2, 'Tuesday', false, TIME '10:00', TIME '20:00', NULL, NULL),
        ('shop', 3, 'Wednesday', false, TIME '10:00', TIME '20:00', NULL, NULL),
        ('shop', 4, 'Thursday', false, TIME '10:00', TIME '20:00', NULL, NULL),
        ('shop', 5, 'Friday', false, TIME '10:00', TIME '20:00', NULL, NULL),
        ('shop', 6, 'Saturday', false, TIME '10:00', TIME '20:00', NULL, NULL),
        ('shop', 7, 'Sunday', false, TIME '11:00', TIME '18:00', NULL, NULL),
        ('rescue', 1, 'Monday', false, TIME '09:00', TIME '18:00', TIME '13:00', TIME '13:30'),
        ('rescue', 2, 'Tuesday', false, TIME '09:00', TIME '18:00', TIME '13:00', TIME '13:30'),
        ('rescue', 3, 'Wednesday', false, TIME '09:00', TIME '18:00', TIME '13:00', TIME '13:30'),
        ('rescue', 4, 'Thursday', false, TIME '09:00', TIME '18:00', TIME '13:00', TIME '13:30'),
        ('rescue', 5, 'Friday', false, TIME '09:00', TIME '18:00', TIME '13:00', TIME '13:30'),
        ('rescue', 6, 'Saturday', false, TIME '10:00', TIME '14:00', NULL, NULL),
        ('rescue', 7, 'Sunday', true, NULL, NULL, NULL, NULL),
        ('closed', 1, 'Monday', true, NULL, NULL, NULL, NULL),
        ('closed', 2, 'Tuesday', true, NULL, NULL, NULL, NULL),
        ('closed', 3, 'Wednesday', true, NULL, NULL, NULL, NULL),
        ('closed', 4, 'Thursday', true, NULL, NULL, NULL, NULL),
        ('closed', 5, 'Friday', true, NULL, NULL, NULL, NULL),
        ('closed', 6, 'Saturday', true, NULL, NULL, NULL, NULL),
        ('closed', 7, 'Sunday', true, NULL, NULL, NULL, NULL),
        ('emergency', 1, 'Monday', false, TIME '00:00', TIME '23:59', NULL, NULL),
        ('emergency', 2, 'Tuesday', false, TIME '00:00', TIME '23:59', NULL, NULL),
        ('emergency', 3, 'Wednesday', false, TIME '00:00', TIME '23:59', NULL, NULL),
        ('emergency', 4, 'Thursday', false, TIME '00:00', TIME '23:59', NULL, NULL),
        ('emergency', 5, 'Friday', false, TIME '00:00', TIME '23:59', NULL, NULL),
        ('emergency', 6, 'Saturday', false, TIME '00:00', TIME '23:59', NULL, NULL),
        ('emergency', 7, 'Sunday', false, TIME '00:00', TIME '23:59', NULL, NULL)
)
INSERT INTO public.pet_place_schedules (
    id,
    pet_place_id,
    day_of_week,
    is_closed,
    open_time,
    close_time,
    break_start_time,
    break_end_time
)
SELECT
    ROW_NUMBER() OVER (ORDER BY p.column1, s.column2),
    p.column1,
    s.column3,
    s.column4,
    s.column5,
    s.column6,
    s.column7,
    s.column8
FROM place_templates p
JOIN schedule_templates s
    ON s.column1 = p.column2;

INSERT INTO public.place_owner_applications (
    id,
    user_id,
    business_name,
    phone,
    email,
    description,
    address_line1,
    address_line2,
    city,
    country,
    requested_place_type,
    status,
    rejection_reason,
    admin_notes,
    reviewed_by_admin_id,
    reviewed_at,
    created_at,
    updated_at
)
VALUES
    (1, 2, 'Safe Haven Rescue Hub', '+1-425-555-0103', 'contact@safehavenrescue.test', 'Submitted after Maya expanded her rescue coordination work and wanted to manage the listing directly.', '92 Lakeview Avenue', NULL, 'Bellevue', 'United States', 'Other', 'Approved', NULL, 'Approved after verifying rescue registration and contact details.', 2, '2026-02-18T10:15:00Z', '2026-02-14T09:00:00Z', '2026-02-18T10:15:00Z'),
    (2, 5, 'Cedar Grove Pet Supply', '+1-503-555-0105', 'hello@cedargrovepets.test', 'Application for Yara''s retail listing with updated nutrition and aquarium inventory details.', '740 Division Street', NULL, 'Portland', 'United States', 'PetShop', 'Approved', NULL, 'Approved with a request to keep seasonal inventory info current.', 3, '2026-03-07T12:30:00Z', '2026-03-03T11:10:00Z', '2026-03-07T12:30:00Z'),
    (3, 6, 'Green Trail Pet Outfitters', '+1-303-555-0109', 'sales@greentrailpets.test', 'Outdoor-focused pet supply shop application tied to Omar''s hiking and training recommendations.', '1012 Pearl Street', NULL, 'Denver', 'United States', 'PetShop', 'Approved', NULL, 'Approved after matching ownership documents to the public listing.', 5, '2026-03-24T15:20:00Z', '2026-03-20T14:05:00Z', '2026-03-24T15:20:00Z'),
    (4, 7, 'Bandit Safe Playroom', '+1-425-555-0127', 'hello@banditsafeplayroom.test', 'Indoor ferret play space proposal with supervised booking slots and enrichment equipment.', '44 Maple Court', 'Unit B', 'Seattle', 'United States', 'Other', 'Rejected', 'Business documentation was incomplete and the location permit was missing.', 'Asked the applicant to reapply with finalized permits and insurance.', 1, '2026-04-02T10:00:00Z', '2026-03-30T09:30:00Z', '2026-04-02T10:00:00Z'),
    (5, 8, 'Silver Creek Equine Support', '+1-303-555-0138', 'info@silvercreekequine.test', 'Pending application for a small equine support and transport service near Denver.', '220 Stable Road', NULL, 'Denver', 'United States', 'Other', 'Pending', NULL, NULL, NULL, NULL, '2026-04-19T08:45:00Z', '2026-04-19T08:45:00Z');

INSERT INTO public.pet_place_reviews (
    id,
    place_id,
    user_id,
    rating,
    comment,
    created_at,
    updated_at
)
VALUES
    ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1, 5, 'Staff explained travel-stress options clearly and Luna recovered quickly after the visit.', '2026-02-12T17:10:00Z', NULL),
    ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 2, 4, 'Good follow-up visit for Milo. I would have loved a slightly longer recovery-plan printout.', '2026-03-03T14:10:00Z', '2026-03-03T18:00:00Z'),
    ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000007', 3, 5, 'Very patient with Kiwi and great about explaining lighting changes for birds.', '2026-03-18T12:00:00Z', NULL),
    ('50000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005', 4, 4, 'Clean shop with reliable small-pet supplies and helpful feeding suggestions.', '2026-04-06T13:30:00Z', NULL),
    ('50000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000009', 7, 5, 'Found durable trail gear there and the staff actually knew what worked for active dogs.', '2026-04-11T18:20:00Z', NULL),
    ('50000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000010', 8, 5, 'Clear emergency intake process and fast communication during a late-night horse call.', '2026-04-12T23:10:00Z', NULL),
    ('50000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', 9, 4, 'The rescue team was organized and transparent about foster needs.', '2026-04-14T10:05:00Z', NULL),
    ('50000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 6, 5, 'Pepper''s booster visit was smooth and the team gave practical aftercare notes.', '2026-04-15T14:30:00Z', NULL),
    ('50000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 3, 4, 'Good selection of carriers and toys, though weekends get busy.', '2026-04-10T12:20:00Z', NULL),
    ('50000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000007', 5, 5, 'Great exotics guidance for Nugget and very calm handling during exams.', '2026-04-20T11:00:00Z', NULL);

INSERT INTO public.pets (
    id,
    user_id,
    name,
    species_id,
    breed_id,
    sex,
    birth_date,
    weight_kg,
    color,
    neutered,
    avatar_url,
    notes,
    created_at,
    updated_at
)
VALUES
    ('20000000-0000-4000-8000-000000000001', 1, 'Luna', 1, 1, 'female', '2022-05-14T00:00:00Z', 4.20, 'Calico', true, 'https://picsum.photos/seed/petcare-pet-luna/800/800.jpg', 'Indoor cat with mild travel anxiety during longer rides.', '2026-01-12T09:45:00Z', '2026-04-18T09:45:00Z'),
    ('20000000-0000-4000-8000-000000000002', 2, 'Milo', 2, 4, 'male', '2020-09-03T00:00:00Z', 30.50, 'Black', true, 'https://picsum.photos/seed/petcare-pet-milo/800/800.jpg', 'High-energy shepherd mix who needs steady exercise and cooldown routines.', '2026-01-22T15:40:00Z', '2026-04-19T15:40:00Z'),
    ('20000000-0000-4000-8000-000000000003', 3, 'Kiwi', 3, 5, 'unknown', '2024-02-11T00:00:00Z', 0.04, 'White', false, 'https://picsum.photos/seed/petcare-pet-kiwi/800/800.jpg', 'Budgie with a predictable feeding schedule and a lot of curiosity.', '2026-02-05T08:10:00Z', '2026-04-10T08:10:00Z'),
    ('20000000-0000-4000-8000-000000000004', 4, 'Mochi', 4, 7, 'female', '2023-08-19T00:00:00Z', 2.10, 'White', true, 'https://picsum.photos/seed/petcare-pet-mochi/800/800.jpg', 'Very food motivated rabbit who settles well after evening playtime.', '2026-02-09T10:30:00Z', '2026-04-11T10:30:00Z'),
    ('20000000-0000-4000-8000-000000000005', 5, 'Nugget', 5, 10, 'male', '2024-06-01T00:00:00Z', 0.12, 'Orange', false, 'https://picsum.photos/seed/petcare-pet-nugget/800/800.jpg', 'Small hamster with a rotating enrichment setup and strict feeding portions.', '2026-02-13T07:15:00Z', '2026-04-14T07:15:00Z'),
    ('20000000-0000-4000-8000-000000000006', 6, 'Bubbles', 6, 11, 'unknown', '2025-01-12T00:00:00Z', NULL, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-bubbles/800/800.jpg', 'Betta fish in a planted tank with extra monitoring after recent fin irritation.', '2026-02-18T18:25:00Z', '2026-04-06T18:25:00Z'),
    ('20000000-0000-4000-8000-000000000007', 7, 'Shelly', 7, 13, 'female', '2019-04-02T00:00:00Z', 1.80, 'Black', false, 'https://picsum.photos/seed/petcare-pet-shelly/800/800.jpg', 'Enjoys basking on schedule; calcium intake and UVB exposure are tracked weekly.', '2026-02-21T12:50:00Z', '2026-04-08T12:50:00Z'),
    ('20000000-0000-4000-8000-000000000008', 8, 'Comet', 8, 15, 'male', '2016-03-20T00:00:00Z', 410.00, 'White', false, 'https://picsum.photos/seed/petcare-pet-comet/800/800.jpg', 'Trail horse with seasonal workload changes and joint-health monitoring.', '2026-02-24T06:40:00Z', '2026-04-12T06:40:00Z'),
    ('20000000-0000-4000-8000-000000000009', 9, 'Bandit', 9, 17, 'male', '2021-11-10T00:00:00Z', 1.30, 'Black', true, 'https://picsum.photos/seed/petcare-pet-bandit/800/800.jpg', 'Ferret with a strong routine and a habit of testing every gap in the apartment.', '2026-03-01T16:20:00Z', '2026-04-17T16:20:00Z'),
    ('20000000-0000-4000-8000-000000000010', 10, 'Rio', 10, 19, 'male', '2022-09-09T00:00:00Z', 0.95, 'Orange', false, 'https://picsum.photos/seed/petcare-pet-rio/800/800.jpg', 'Talkative parrot with a daily socialization routine and rotating foraging toys.', '2026-03-05T09:05:00Z', '2026-04-09T09:05:00Z'),
    ('20000000-0000-4000-8000-000000000011', 1, 'Pepper', 2, 3, 'female', '2021-07-21T00:00:00Z', 24.30, 'Black', true, 'https://picsum.photos/seed/petcare-pet-pepper/800/800.jpg', 'Friendly dog who handles clinic visits well and loves short training sessions.', '2026-03-09T14:20:00Z', '2026-04-15T14:20:00Z'),
    ('20000000-0000-4000-8000-000000000012', 2, 'Daisy', 1, NULL, 'female', '2020-02-18T00:00:00Z', 3.80, 'White', true, 'https://picsum.photos/seed/petcare-pet-daisy/800/800.jpg', 'Older cat with a calm routine and detailed wellness notes after each check-up.', '2026-03-14T11:00:00Z', '2026-04-13T11:00:00Z');

INSERT INTO public.consultations (
    id,
    user_id,
    pet_id,
    vet_place_id,
    date,
    details,
    created_at,
    updated_at
)
VALUES
    (1, 1, '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-02-12T15:30:00Z', 'Annual wellness visit for Luna with weight review and travel-anxiety discussion.', '2026-02-05T10:00:00Z', '2026-02-12T16:00:00Z'),
    (2, 2, '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', '2026-03-03T13:00:00Z', 'Checked Milo after stiffness and limping following longer hikes.', '2026-02-24T09:15:00Z', '2026-03-03T13:40:00Z'),
    (3, 3, '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000007', '2026-03-18T11:00:00Z', 'Behavior and feather condition review for Kiwi after seasonal changes.', '2026-03-10T08:25:00Z', '2026-03-18T11:25:00Z'),
    (4, 4, '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '2026-04-05T14:20:00Z', 'Follow-up on Mochi after appetite drop and GI upset earlier in the season.', '2026-03-29T12:40:00Z', '2026-04-05T14:55:00Z'),
    (5, 5, '20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000007', '2026-05-09T10:45:00Z', 'Upcoming dental review and weight check for Nugget.', '2026-04-20T09:00:00Z', NULL),
    (6, 6, '20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000004', '2026-01-20T16:10:00Z', 'Assessed Bubbles for mild fin irritation and reviewed water-change schedule.', '2026-01-18T18:40:00Z', '2026-01-20T16:40:00Z'),
    (7, 7, '20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', '2026-05-28T09:15:00Z', 'Upcoming shell-health visit to evaluate calcium intake and UVB exposure.', '2026-04-18T14:00:00Z', NULL),
    (8, 8, '20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000010', '2026-06-15T08:00:00Z', 'Planned lameness and conditioning review before summer trail season.', '2026-04-16T07:30:00Z', NULL),
    (9, 9, '20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', '2026-02-27T12:00:00Z', 'Adrenal monitoring follow-up and general wellness review for Bandit.', '2026-02-22T11:00:00Z', '2026-02-27T12:30:00Z'),
    (10, 10, '20000000-0000-4000-8000-000000000010', NULL, '2026-07-01T17:00:00Z', 'Remote consult requested for Rio; user has not selected a clinic yet.', '2026-04-14T15:45:00Z', NULL),
    (11, 1, '20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000010', '2026-05-02T11:15:00Z', 'Rabies booster visit and nutrition check-in for Pepper.', '2026-04-15T13:20:00Z', NULL),
    (12, 2, '20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', '2026-01-09T10:00:00Z', 'Yearly cat wellness visit for Daisy with dental and weight review.', '2026-01-03T09:10:00Z', '2026-01-09T10:35:00Z');

INSERT INTO public.forum_posts (
    id,
    user_id,
    content,
    is_a_reply,
    replying_to_post,
    created_at,
    updated_at
)
VALUES
    ('40000000-0000-4000-8000-000000000001', 1, 'What is the best routine for keeping a cat calm during a two-hour car ride? Luna gets restless after the first half hour.', false, NULL, '2026-04-08T14:30:00Z', NULL),
    ('40000000-0000-4000-8000-000000000002', 2, 'Looking for dog-friendly parks with enough shade for a long afternoon walk and a good cooldown area afterwards.', false, NULL, '2026-04-09T10:15:00Z', '2026-04-09T10:42:00Z'),
    ('40000000-0000-4000-8000-000000000003', 3, 'Rabbit owners: do you rotate dig boxes every week, or only when your rabbit stops interacting with them?', false, NULL, '2026-04-09T18:05:00Z', NULL),
    ('40000000-0000-4000-8000-000000000004', 4, 'Kiwi has been very vocal right before lights out lately. Any bird owners have a good evening wind-down routine?', false, NULL, '2026-04-10T07:50:00Z', NULL),
    ('40000000-0000-4000-8000-000000000005', 5, 'Tank owners: how often do you rewrite your maintenance checklist after introducing new plants or decorations?', false, NULL, '2026-04-10T16:20:00Z', NULL),
    ('40000000-0000-4000-8000-000000000006', 6, 'Has anyone adjusted a turtle basking setup after a shell-softness warning from the vet? Curious what made the biggest difference.', false, NULL, '2026-04-11T09:40:00Z', NULL),
    ('40000000-0000-4000-8000-000000000007', 7, 'What is the one apartment-proofing change that made ferret ownership easier for you?', false, NULL, '2026-04-11T20:10:00Z', NULL),
    ('40000000-0000-4000-8000-000000000008', 8, 'I finally built a proper emergency-contact card for trail days with Comet. Happy to share the checklist if anyone wants it.', false, NULL, '2026-04-12T12:00:00Z', '2026-04-12T12:30:00Z'),
    ('40000000-0000-4000-8000-000000000009', 9, 'For older dogs with stiffness, do you plan recovery days after a long walk or just shorten the walk itself?', false, NULL, '2026-04-13T08:25:00Z', NULL),
    ('40000000-0000-4000-8000-000000000010', 10, 'Anyone have a reliable summer fly-control routine for a horse that is sensitive to stronger sprays?', false, NULL, '2026-04-13T17:10:00Z', NULL),
    ('40000000-0000-4000-8000-000000000011', 3, 'A carrier cover and one short practice drive the day before made a huge difference for my rabbit transport days.', true, '40000000-0000-4000-8000-000000000001', '2026-04-08T16:00:00Z', NULL),
    ('40000000-0000-4000-8000-000000000012', 6, 'We started doing ten-minute cooldown walks and it helped Milo settle faster after intense exercise.', true, '40000000-0000-4000-8000-000000000002', '2026-04-09T11:30:00Z', NULL),
    ('40000000-0000-4000-8000-000000000013', 8, 'For noisy evenings, lowering room activity thirty minutes before lights-out helped my bird a lot.', true, '40000000-0000-4000-8000-000000000004', '2026-04-10T08:40:00Z', NULL),
    ('40000000-0000-4000-8000-000000000014', 2, 'I update my maintenance checklist every time I change one piece of equipment so I do not forget the new order.', true, '40000000-0000-4000-8000-000000000005', '2026-04-10T18:00:00Z', NULL),
    ('40000000-0000-4000-8000-000000000015', 4, 'Securing under-sofa access was the biggest quality-of-life change for us. After that, everything else got easier.', true, '40000000-0000-4000-8000-000000000007', '2026-04-11T21:05:00Z', NULL),
    ('40000000-0000-4000-8000-000000000016', 1, 'Would love that checklist. I keep one in the trailer now, but not one in the tack bag yet.', true, '40000000-0000-4000-8000-000000000008', '2026-04-12T13:15:00Z', NULL);

INSERT INTO public.forum_post_attachments (
    id,
    forum_post_id,
    url,
    created_at
)
VALUES
    (1, '40000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/petcare-forum-01/1200/900.jpg', '2026-04-08T14:32:00Z'),
    (2, '40000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/petcare-forum-02/1200/900.jpg', '2026-04-09T10:18:00Z'),
    (3, '40000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/petcare-forum-03/1200/900.jpg', '2026-04-09T18:07:00Z'),
    (4, '40000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/petcare-forum-04/1200/900.jpg', '2026-04-10T07:53:00Z'),
    (5, '40000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/petcare-forum-05/1200/900.jpg', '2026-04-10T16:24:00Z'),
    (6, '40000000-0000-4000-8000-000000000006', 'https://picsum.photos/seed/petcare-forum-06/1200/900.jpg', '2026-04-11T09:42:00Z'),
    (7, '40000000-0000-4000-8000-000000000007', 'https://picsum.photos/seed/petcare-forum-07/1200/900.jpg', '2026-04-11T20:12:00Z'),
    (8, '40000000-0000-4000-8000-000000000008', 'https://picsum.photos/seed/petcare-forum-08/1200/900.jpg', '2026-04-12T12:03:00Z'),
    (9, '40000000-0000-4000-8000-000000000009', 'https://picsum.photos/seed/petcare-forum-09/1200/900.jpg', '2026-04-13T08:27:00Z'),
    (10, '40000000-0000-4000-8000-000000000010', 'https://picsum.photos/seed/petcare-forum-10/1200/900.jpg', '2026-04-13T17:14:00Z');

INSERT INTO public.forum_post_bookmarks (
    user_id,
    forum_post_id,
    created_at
)
VALUES
    (1, '40000000-0000-4000-8000-000000000002', '2026-04-09T10:30:00Z'),
    (1, '40000000-0000-4000-8000-000000000008', '2026-04-12T12:10:00Z'),
    (2, '40000000-0000-4000-8000-000000000001', '2026-04-08T15:00:00Z'),
    (2, '40000000-0000-4000-8000-000000000007', '2026-04-11T20:30:00Z'),
    (3, '40000000-0000-4000-8000-000000000004', '2026-04-10T08:00:00Z'),
    (4, '40000000-0000-4000-8000-000000000001', '2026-04-08T16:05:00Z'),
    (5, '40000000-0000-4000-8000-000000000006', '2026-04-11T10:00:00Z'),
    (5, '40000000-0000-4000-8000-000000000010', '2026-04-13T17:20:00Z'),
    (6, '40000000-0000-4000-8000-000000000003', '2026-04-09T19:00:00Z'),
    (7, '40000000-0000-4000-8000-000000000008', '2026-04-12T12:35:00Z'),
    (8, '40000000-0000-4000-8000-000000000005', '2026-04-10T17:10:00Z'),
    (9, '40000000-0000-4000-8000-000000000002', '2026-04-09T10:50:00Z');

INSERT INTO public.forum_post_likes (
    user_id,
    forum_post_id,
    created_at
)
VALUES
    (1, '40000000-0000-4000-8000-000000000002', '2026-04-09T10:25:00Z'),
    (1, '40000000-0000-4000-8000-000000000008', '2026-04-12T12:12:00Z'),
    (2, '40000000-0000-4000-8000-000000000001', '2026-04-08T14:45:00Z'),
    (3, '40000000-0000-4000-8000-000000000001', '2026-04-08T16:02:00Z'),
    (4, '40000000-0000-4000-8000-000000000001', '2026-04-08T17:20:00Z'),
    (5, '40000000-0000-4000-8000-000000000002', '2026-04-09T10:40:00Z'),
    (6, '40000000-0000-4000-8000-000000000003', '2026-04-09T18:45:00Z'),
    (7, '40000000-0000-4000-8000-000000000004', '2026-04-10T08:10:00Z'),
    (8, '40000000-0000-4000-8000-000000000005', '2026-04-10T16:40:00Z'),
    (9, '40000000-0000-4000-8000-000000000006', '2026-04-11T09:55:00Z'),
    (10, '40000000-0000-4000-8000-000000000007', '2026-04-11T20:45:00Z'),
    (2, '40000000-0000-4000-8000-000000000009', '2026-04-13T08:40:00Z'),
    (3, '40000000-0000-4000-8000-000000000010', '2026-04-13T17:25:00Z'),
    (4, '40000000-0000-4000-8000-000000000011', '2026-04-08T16:05:00Z'),
    (5, '40000000-0000-4000-8000-000000000012', '2026-04-09T11:45:00Z'),
    (6, '40000000-0000-4000-8000-000000000013', '2026-04-10T09:00:00Z'),
    (7, '40000000-0000-4000-8000-000000000014', '2026-04-10T18:20:00Z'),
    (8, '40000000-0000-4000-8000-000000000015', '2026-04-11T21:25:00Z');

INSERT INTO public.reports (
    id,
    reporter_user_id,
    target_type,
    target_id,
    reason_type,
    description,
    status,
    reviewed_by_admin_id,
    reviewed_at,
    created_at
)
VALUES
    (1, 1, 'ForumPost', '40000000-0000-4000-8000-000000000010', 'Spam', 'Looked promotional rather than a genuine care question.', 'Pending', NULL, NULL, '2026-04-13T17:30:00Z'),
    (2, 2, 'ForumPost', '40000000-0000-4000-8000-000000000010', 'InappropriateContent', 'The discussion around this thread started to feel off-topic and promotional.', 'Pending', NULL, NULL, '2026-04-13T18:05:00Z'),
    (3, 4, 'User', '10', 'Spam', 'This user kept posting store-like promotions without context.', 'ActionTaken', 1, '2026-04-20T09:28:00Z', '2026-04-13T19:00:00Z'),
    (4, 5, 'ForumPost', '40000000-0000-4000-8000-000000000007', 'Harassment', 'I checked back later and it looked more heated than helpful.', 'Reviewed', 5, '2026-04-20T09:34:00Z', '2026-04-12T08:20:00Z'),
    (5, 6, 'User', '10', 'Scam', 'The profile kept redirecting people to outside offers.', 'Pending', NULL, NULL, '2026-04-14T07:40:00Z'),
    (6, 7, 'ForumPost', '40000000-0000-4000-8000-000000000006', 'Other', 'Turns out the discussion stayed useful after the follow-up, so this remains as a dismissed example.', 'Dismissed', 3, '2026-04-20T09:52:00Z', '2026-04-11T10:30:00Z');

INSERT INTO public.vaccine_records (
    id,
    pet_id,
    vaccine_name,
    status,
    date_administered,
    next_due_date,
    notes,
    veterinarian,
    created_at,
    updated_at
)
VALUES
    (1, '20000000-0000-4000-8000-000000000001', 'Rabies', 'Done', '2025-06-15T09:00:00Z', '2026-06-15T09:00:00Z', 'No side effects reported after the appointment.', 'Dr. Elaine Brooks', '2025-06-15T09:30:00Z', '2025-06-15T09:30:00Z'),
    (2, '20000000-0000-4000-8000-000000000001', 'FVRCP', 'Due', '2025-04-30T10:00:00Z', '2026-04-30T10:00:00Z', 'Reminder left to book before the end of the month.', 'Dr. Elaine Brooks', '2025-04-30T10:15:00Z', '2026-04-15T10:15:00Z'),
    (3, '20000000-0000-4000-8000-000000000002', 'DHPP', 'Done', '2025-11-02T11:10:00Z', '2026-11-02T11:10:00Z', 'Routine annual booster completed during a wellness visit.', 'Dr. Marcus Lee', '2025-11-02T11:40:00Z', '2025-11-02T11:40:00Z'),
    (4, '20000000-0000-4000-8000-000000000002', 'Bordetella', 'Due', '2025-05-02T13:00:00Z', '2026-05-02T13:00:00Z', 'Scheduled to discuss at the next follow-up.', 'Dr. Marcus Lee', '2025-05-02T13:15:00Z', '2026-04-18T09:10:00Z'),
    (5, '20000000-0000-4000-8000-000000000003', 'Polyomavirus', 'NotDone', NULL, '2026-06-10T09:00:00Z', 'Adoption paperwork does not show a completed vaccine series.', NULL, '2026-03-18T11:30:00Z', '2026-03-18T11:30:00Z'),
    (6, '20000000-0000-4000-8000-000000000004', 'RHDV2', 'Done', '2025-12-08T10:00:00Z', '2026-12-08T10:00:00Z', 'Handled well after a rabbit-only clinic visit.', 'Dr. Sonia Hart', '2025-12-08T10:20:00Z', '2025-12-08T10:20:00Z'),
    (7, '20000000-0000-4000-8000-000000000004', 'Myxomatosis', 'Due', '2025-05-18T10:15:00Z', '2026-05-18T10:15:00Z', 'Next dose should be booked with the same exotics clinic.', 'Dr. Sonia Hart', '2025-05-18T10:30:00Z', '2026-04-05T15:00:00Z'),
    (8, '20000000-0000-4000-8000-000000000008', 'Tetanus', 'Done', '2025-08-21T08:30:00Z', '2026-08-21T08:30:00Z', 'Administered before fall competition season.', 'Dr. Megan Sloan', '2025-08-21T09:00:00Z', '2025-08-21T09:00:00Z'),
    (9, '20000000-0000-4000-8000-000000000008', 'Influenza', 'Due', '2025-06-15T08:00:00Z', '2026-06-15T08:00:00Z', 'Planned during the next conditioning review.', 'Dr. Megan Sloan', '2025-06-15T08:20:00Z', '2026-04-16T07:40:00Z'),
    (10, '20000000-0000-4000-8000-000000000009', 'Rabies', 'NotDone', NULL, NULL, 'Rescue records were incomplete, so the vaccine history is being rebuilt.', NULL, '2026-02-27T12:40:00Z', '2026-02-27T12:40:00Z'),
    (11, '20000000-0000-4000-8000-000000000010', 'Psittacosis', 'Due', '2025-09-09T09:20:00Z', '2026-09-09T09:20:00Z', 'Due later this year; owner wants an earlier reminder.', 'Dr. Aaron Price', '2025-09-09T09:40:00Z', '2026-04-09T09:20:00Z'),
    (12, '20000000-0000-4000-8000-000000000011', 'Leptospirosis', 'Done', '2026-01-10T10:45:00Z', '2027-01-10T10:45:00Z', 'Completed during Pepper''s routine wellness visit.', 'Dr. Nina Patel', '2026-01-10T11:00:00Z', '2026-01-10T11:00:00Z'),
    (13, '20000000-0000-4000-8000-000000000011', 'Rabies', 'Due', '2025-05-02T11:15:00Z', '2026-05-02T11:15:00Z', 'Appointment already reserved with the emergency hospital team.', 'Dr. Nina Patel', '2025-05-02T11:45:00Z', '2026-04-15T13:30:00Z'),
    (14, '20000000-0000-4000-8000-000000000012', 'FVRCP', 'Done', '2025-10-12T10:00:00Z', '2026-10-12T10:00:00Z', 'Daisy tolerated the visit very calmly.', 'Dr. Marcus Lee', '2025-10-12T10:20:00Z', '2025-10-12T10:20:00Z'),
    (15, '20000000-0000-4000-8000-000000000012', 'Rabies', 'Due', '2025-06-01T10:00:00Z', '2026-06-01T10:00:00Z', 'Reminder added to book before summer travel.', 'Dr. Marcus Lee', '2025-06-01T10:20:00Z', '2026-04-13T11:10:00Z');

INSERT INTO public.illness_records (
    id,
    pet_id,
    illness_name,
    diagnosis_date,
    status,
    description,
    notes,
    cured_date,
    created_at,
    updated_at
)
VALUES
    (1, '20000000-0000-4000-8000-000000000001', 'Gingivitis', '2026-01-21T10:30:00Z', 'Resolved', 'Mild gum inflammation noticed during a routine oral exam.', 'Improved after a short cleaning and home-care routine.', '2026-02-05T10:00:00Z', '2026-01-21T10:45:00Z', '2026-02-05T10:00:00Z'),
    (2, '20000000-0000-4000-8000-000000000002', 'Seasonal allergies', '2026-03-30T16:30:00Z', 'Ongoing', 'Paw licking and mild irritation after higher-pollen park visits.', 'Monitor pollen peaks and reduce activity on windy afternoons.', NULL, '2026-03-30T16:45:00Z', '2026-04-19T18:00:00Z'),
    (3, '20000000-0000-4000-8000-000000000003', 'Feather molt stress', '2026-02-14T09:15:00Z', 'Resolved', 'Over-preening increased during seasonal changes and room activity spikes.', 'Settled after lighting and routine adjustments.', '2026-03-05T09:00:00Z', '2026-02-14T09:30:00Z', '2026-03-05T09:00:00Z'),
    (4, '20000000-0000-4000-8000-000000000004', 'GI upset', '2026-01-16T13:00:00Z', 'Resolved', 'Short-term appetite drop with reduced interest in hay.', 'Resolved after bland food support and monitoring.', '2026-01-22T13:00:00Z', '2026-01-16T13:10:00Z', '2026-01-22T13:00:00Z'),
    (5, '20000000-0000-4000-8000-000000000005', 'Dental overgrowth', '2026-04-02T10:15:00Z', 'Ongoing', 'Front teeth need closer monitoring and regular dietary support.', 'Follow-up is scheduled with the exotics clinic.', NULL, '2026-04-02T10:30:00Z', '2026-04-20T09:15:00Z'),
    (6, '20000000-0000-4000-8000-000000000006', 'Fin irritation', '2026-01-18T19:00:00Z', 'Ongoing', 'Mild fin fraying noticed after a recent tank change.', 'Water-change frequency increased while the tank stabilizes.', NULL, '2026-01-18T19:10:00Z', '2026-04-06T18:40:00Z'),
    (7, '20000000-0000-4000-8000-000000000007', 'Shell softness', '2026-03-08T14:20:00Z', 'Ongoing', 'Calcium intake and basking exposure need closer review.', 'UVB lighting was adjusted and feeding notes were expanded.', NULL, '2026-03-08T14:30:00Z', '2026-04-08T13:05:00Z'),
    (8, '20000000-0000-4000-8000-000000000008', 'Joint stiffness', '2026-04-15T16:30:00Z', 'Ongoing', 'Stiffness appears after longer trail sessions and higher workloads.', 'Trail intensity is being reduced while treatment continues.', NULL, '2026-04-15T16:45:00Z', '2026-04-19T18:15:00Z'),
    (9, '20000000-0000-4000-8000-000000000009', 'Adrenal monitoring', '2026-03-12T11:00:00Z', 'Ongoing', 'Hair thinning and energy changes require ongoing monitoring.', 'Owner is tracking weight and behavior while awaiting imaging.', NULL, '2026-03-12T11:20:00Z', '2026-04-17T16:30:00Z'),
    (10, '20000000-0000-4000-8000-000000000010', 'Beak overgrowth', '2026-02-03T08:30:00Z', 'Resolved', 'Beak trimming was required after uneven wear on the perch setup.', 'Added a maintenance reminder after the trim.', '2026-02-20T08:30:00Z', '2026-02-03T08:45:00Z', '2026-02-20T08:30:00Z');

INSERT INTO public.medication_records (
    id,
    illness_id,
    medication_name,
    dosage,
    instructions,
    start_date,
    end_date,
    frequency_in_days,
    times,
    reminder_enabled,
    is_active,
    created_at,
    updated_at
)
VALUES
    (1, 1, 'Chlorhexidine rinse', '5 mL', 'Apply gently along the gum line after the evening meal.', '2026-01-21T20:00:00Z', '2026-02-05T20:00:00Z', 1, ARRAY['20:00']::text[], false, false, '2026-01-21T20:00:00Z', '2026-02-05T20:00:00Z'),
    (2, 2, 'Cetirizine', '10 mg', 'Give once daily during high-pollen weeks.', '2026-03-30T08:00:00Z', NULL, 1, ARRAY['08:00']::text[], true, true, '2026-03-30T08:00:00Z', '2026-04-19T18:00:00Z'),
    (3, 2, 'Omega-3 supplement', '1 capsule', 'Give with the evening meal.', '2026-04-01T19:00:00Z', NULL, 1, ARRAY['19:00']::text[], false, true, '2026-04-01T19:00:00Z', '2026-04-19T18:05:00Z'),
    (4, 3, 'Vitamin support', '0.5 mL', 'Add to fresh water once daily during recovery.', '2026-02-14T09:00:00Z', '2026-03-05T09:00:00Z', 1, ARRAY['09:00']::text[], false, false, '2026-02-14T09:00:00Z', '2026-03-05T09:00:00Z'),
    (5, 4, 'Probiotic paste', '2 mL', 'Offer morning and evening with bland food.', '2026-01-16T07:30:00Z', '2026-01-22T19:30:00Z', 1, ARRAY['07:30', '19:30']::text[], false, false, '2026-01-16T07:30:00Z', '2026-01-22T19:30:00Z'),
    (6, 5, 'Critical care feed', '10 mL', 'Split into three assisted feedings across the day.', '2026-04-02T07:00:00Z', NULL, 1, ARRAY['07:00', '13:00', '19:00']::text[], true, true, '2026-04-02T07:00:00Z', '2026-04-20T09:20:00Z'),
    (7, 6, 'Aquarium salt treatment', '1 tsp / 5 gal', 'Use alongside partial water changes while fins recover.', '2026-01-18T18:00:00Z', NULL, 2, ARRAY['18:00']::text[], true, true, '2026-01-18T18:00:00Z', '2026-04-06T18:45:00Z'),
    (8, 7, 'Calcium supplement', '0.3 g', 'Dust food three times a week and keep UVB timing consistent.', '2026-03-08T09:00:00Z', NULL, 2, ARRAY['09:00']::text[], true, true, '2026-03-08T09:00:00Z', '2026-04-08T13:10:00Z'),
    (9, 8, 'Carprofen', '75 mg', 'Give with food and avoid strenuous work on treatment days.', '2026-04-15T08:00:00Z', NULL, 1, ARRAY['08:00', '20:00']::text[], true, true, '2026-04-15T08:00:00Z', '2026-04-19T18:10:00Z'),
    (10, 8, 'Glucosamine supplement', '1 scoop', 'Add to the morning feed for ongoing joint support.', '2026-04-16T07:00:00Z', NULL, 1, ARRAY['07:00']::text[], false, true, '2026-04-16T07:00:00Z', '2026-04-19T18:12:00Z'),
    (11, 9, 'Prednisolone', '0.5 mL', 'Short course while imaging and long-term planning are arranged.', '2026-03-12T09:00:00Z', '2026-03-26T09:00:00Z', 1, ARRAY['09:00']::text[], true, false, '2026-03-12T09:00:00Z', '2026-03-26T09:00:00Z'),
    (12, 10, 'Beak conditioning gel', 'pea-sized amount', 'Apply after trimming sessions until the area settles.', '2026-02-03T08:00:00Z', '2026-02-20T08:00:00Z', 2, ARRAY['08:00']::text[], false, false, '2026-02-03T08:00:00Z', '2026-02-20T08:00:00Z');

INSERT INTO public.admin_action_logs (
    id,
    admin_user_id,
    action_type,
    target_type,
    target_id,
    description,
    reason,
    created_at
)
VALUES
    (1, 1, 'AdminLogin', 'AdminUser', '1', 'Admin ''dana.farah'' logged in.', NULL, '2026-04-20T09:00:00Z'),
    (2, 2, 'AdminLogin', 'AdminUser', '2', 'Admin ''rami.saab'' logged in.', NULL, '2026-04-20T09:10:00Z'),
    (3, 1, 'ReviewUserProfile', 'User', '2', 'Reviewed Maya Khoury''s profile after a community report and left the account active.', 'Demo moderation review.', '2026-04-20T09:15:00Z'),
    (4, 4, 'UpdatePetPlace', 'PetPlace', '10000000-0000-4000-8000-000000000001', 'Updated listing details for Happy Paws Veterinary Center.', 'Expanded clinic description and contact notes.', '2026-04-20T09:20:00Z'),
    (5, 3, 'CreateSpecies', 'Species', '10', 'Created species ''Parrot'' with code ''parrot''.', 'Seed dataset coverage for exotics.', '2026-04-20T09:25:00Z'),
    (6, 3, 'CreateBreed', 'Breed', '19', 'Created breed ''African Grey'' for the parrot species.', 'Seed dataset coverage for exotics.', '2026-04-20T09:26:00Z'),
    (7, 1, 'BanUser', 'User', '10', 'Banned user ''rami.shaheen'' after repeated promotional spam in the forum.', 'Repeated promotional spam in the forum.', '2026-04-20T09:30:00Z'),
    (8, 5, 'ReviewForumPost', 'ForumPost', '40000000-0000-4000-8000-000000000007', 'Reviewed the ferret apartment-safety thread and left it visible.', 'Demo forum moderation example.', '2026-04-20T09:35:00Z'),
    (9, 6, 'UpdatePetPlace', 'PetPlace', '10000000-0000-4000-8000-000000000008', 'Updated Midtown Groom & Play to a closed status.', 'Licensing pause example for seed data.', '2026-04-20T09:40:00Z'),
    (10, 7, 'DeactivateAdminUser', 'AdminUser', '10', 'Marked admin ''mark.hanna'' as inactive.', 'Dormant demo account.', '2026-04-20T09:45:00Z'),
    (11, 8, 'ReviewUserProfile', 'User', '5', 'Reviewed Yara Rahal''s aquarium-advice profile and left it unchanged.', 'Routine moderation spot-check.', '2026-04-20T09:50:00Z'),
    (12, 2, 'UpdatePetPlace', 'PetPlace', '10000000-0000-4000-8000-000000000010', 'Updated emergency listing details for Sunset Emergency Animal Hospital.', 'Expanded emergency-hours copy.', '2026-04-20T09:55:00Z'),
    (13, 2, 'ApprovePlaceOwnerApplication', 'PlaceOwnerApplication', '1', 'Approved Maya Khoury''s place-owner application for Safe Haven Rescue Hub.', 'Verified rescue information and ownership paperwork.', '2026-04-20T10:00:00Z'),
    (14, 3, 'ApprovePlaceOwnerApplication', 'PlaceOwnerApplication', '2', 'Approved Yara Rahal''s place-owner application for Cedar Grove Pet Supply.', 'Verified shop ownership and contact information.', '2026-04-20T10:05:00Z'),
    (15, 1, 'ResolveReport', 'Report', '3', 'Resolved report #3 against user ''rami.shaheen'' with ActionTaken status.', 'Matched repeated spam complaints to the banned account.', '2026-04-20T10:10:00Z'),
    (16, 5, 'RejectPlaceOwnerApplication', 'PlaceOwnerApplication', '4', 'Rejected Karim Farah''s place-owner application due to missing permit documents.', 'Application was incomplete and could not be approved.', '2026-04-20T10:15:00Z');

SELECT setval(pg_get_serial_sequence('public.users', 'id'), (SELECT MAX(id) FROM public.users), true);
SELECT setval(pg_get_serial_sequence('public.admin_users', 'id'), (SELECT MAX(id) FROM public.admin_users), true);
SELECT setval(pg_get_serial_sequence('public.admin_action_logs', 'id'), (SELECT MAX(id) FROM public.admin_action_logs), true);
SELECT setval(pg_get_serial_sequence('public.species', 'id'), (SELECT MAX(id) FROM public.species), true);
SELECT setval(pg_get_serial_sequence('public.breeds', 'id'), (SELECT MAX(id) FROM public.breeds), true);
SELECT setval(pg_get_serial_sequence('public.pet_place_schedules', 'id'), (SELECT MAX(id) FROM public.pet_place_schedules), true);
SELECT setval(pg_get_serial_sequence('public.place_owner_applications', 'id'), (SELECT MAX(id) FROM public.place_owner_applications), true);
SELECT setval(pg_get_serial_sequence('public.consultations', 'id'), (SELECT MAX(id) FROM public.consultations), true);
SELECT setval(pg_get_serial_sequence('public.forum_post_attachments', 'id'), (SELECT MAX(id) FROM public.forum_post_attachments), true);
SELECT setval(pg_get_serial_sequence('public.reports', 'id'), (SELECT MAX(id) FROM public.reports), true);
SELECT setval(pg_get_serial_sequence('public.vaccine_records', 'id'), (SELECT MAX(id) FROM public.vaccine_records), true);
SELECT setval(pg_get_serial_sequence('public.illness_records', 'id'), (SELECT MAX(id) FROM public.illness_records), true);
SELECT setval(pg_get_serial_sequence('public.medication_records', 'id'), (SELECT MAX(id) FROM public.medication_records), true);

COMMIT;

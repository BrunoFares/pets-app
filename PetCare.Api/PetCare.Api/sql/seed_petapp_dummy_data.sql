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
    public.direct_messages,
    public.conversation_participants,
    public.conversations,
    public.user_blocks,
    public.place_owner_application_images,
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
    public.pet_place_images,
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
    chat_code,
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
        'SARA2CAT',
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
        'MAYA3PET',
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
        'LAYA4BUN',
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
        'NURA5BRD',
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
        'YARA6FSH',
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
        'AMAR7DGS',
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
        'KARM8FER',
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
        'ELAS2HRS',
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
        'ZYAD3XTC',
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
        'RAMY4SPM',
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

INSERT INTO public.pet_place_images (
    id,
    pet_place_id,
    url,
    created_at
)
VALUES
    (1, '10000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/petcare-place-gallery-01/1600/1200.jpg', '2025-11-05T08:05:00Z'),
    (2, '10000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/petcare-place-gallery-02/1600/1200.jpg', '2025-11-07T10:05:00Z'),
    (3, '10000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/petcare-place-gallery-03/1600/1200.jpg', '2025-11-09T09:35:00Z'),
    (4, '10000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/petcare-place-gallery-04/1600/1200.jpg', '2025-11-12T08:50:00Z'),
    (5, '10000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/petcare-place-gallery-05/1600/1200.jpg', '2025-11-15T11:20:00Z'),
    (6, '10000000-0000-4000-8000-000000000006', 'https://picsum.photos/seed/petcare-place-gallery-06/1600/1200.jpg', '2025-11-19T13:05:00Z'),
    (7, '10000000-0000-4000-8000-000000000007', 'https://picsum.photos/seed/petcare-place-gallery-07/1600/1200.jpg', '2025-11-24T09:25:00Z'),
    (8, '10000000-0000-4000-8000-000000000008', 'https://picsum.photos/seed/petcare-place-gallery-08/1600/1200.jpg', '2025-11-28T10:10:00Z'),
    (9, '10000000-0000-4000-8000-000000000009', 'https://picsum.photos/seed/petcare-place-gallery-09/1600/1200.jpg', '2025-12-01T14:45:00Z'),
    (10, '10000000-0000-4000-8000-000000000010', 'https://picsum.photos/seed/petcare-place-gallery-10/1600/1200.jpg', '2025-12-04T18:20:00Z');

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

INSERT INTO public.place_owner_application_images (
    id,
    place_owner_application_id,
    url,
    created_at
)
VALUES
    (1, 1, 'https://picsum.photos/seed/petcare-place-application-01/1600/1200.jpg', '2026-02-14T09:05:00Z'),
    (2, 2, 'https://picsum.photos/seed/petcare-place-application-02/1600/1200.jpg', '2026-03-03T11:15:00Z'),
    (3, 3, 'https://picsum.photos/seed/petcare-place-application-03/1600/1200.jpg', '2026-03-20T14:10:00Z'),
    (4, 4, 'https://picsum.photos/seed/petcare-place-application-04/1600/1200.jpg', '2026-03-30T09:35:00Z'),
    (5, 5, 'https://picsum.photos/seed/petcare-place-application-05/1600/1200.jpg', '2026-04-19T08:50:00Z');

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
    updated_at,
    moderation_status,
    ai_moderation_label,
    ai_moderation_confidence,
    ai_moderation_reason,
    moderated_at,
    final_moderation_label,
    reviewed_by_admin_id,
    reviewed_at,
    admin_moderation_notes
)
VALUES
    ('40000000-0000-4000-8000-000000000001', 1, 'What is the best routine for keeping a cat calm during a two-hour car ride? Luna gets restless after the first half hour.', false, NULL, '2026-04-08T14:30:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000002', 2, 'Looking for dog-friendly parks with enough shade for a long afternoon walk and a good cooldown area afterwards.', false, NULL, '2026-04-09T10:15:00Z', '2026-04-09T10:42:00Z', 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000003', 3, 'Rabbit owners: do you rotate dig boxes every week, or only when your rabbit stops interacting with them?', false, NULL, '2026-04-09T18:05:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000004', 4, 'Kiwi has been very vocal right before lights out lately. Any bird owners have a good evening wind-down routine?', false, NULL, '2026-04-10T07:50:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000005', 5, 'Tank owners: how often do you rewrite your maintenance checklist after introducing new plants or decorations?', false, NULL, '2026-04-10T16:20:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000006', 6, 'Has anyone adjusted a turtle basking setup after a shell-softness warning from the vet? Curious what made the biggest difference.', false, NULL, '2026-04-11T09:40:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000007', 7, 'What is the one apartment-proofing change that made ferret ownership easier for you?', false, NULL, '2026-04-11T20:10:00Z', NULL, 'Reviewed', 'Suspicious', 0.5800, 'Question pattern flagged as borderline; requires human review.', '2026-04-12T00:30:00Z', 'Safe', 5, '2026-04-20T09:35:00Z', 'Reviewed and confirmed as a valid care question. No action taken.'),
    ('40000000-0000-4000-8000-000000000008', 8, 'I finally built a proper emergency-contact card for trail days with Comet. Happy to share the checklist if anyone wants it.', false, NULL, '2026-04-12T12:00:00Z', '2026-04-12T12:30:00Z', 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000009', 9, 'For older dogs with stiffness, do you plan recovery days after a long walk or just shorten the walk itself?', false, NULL, '2026-04-13T08:25:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000010', 10, 'Anyone have a reliable summer fly-control routine for a horse that is sensitive to stronger sprays?', false, NULL, '2026-04-13T17:10:00Z', NULL, 'AutoHidden', 'Spam', 0.8800, 'Post closely matches promotional spam patterns.', '2026-04-13T17:15:00Z', NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000011', 3, 'A carrier cover and one short practice drive the day before made a huge difference for my rabbit transport days.', true, '40000000-0000-4000-8000-000000000001', '2026-04-08T16:00:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000012', 6, 'We started doing ten-minute cooldown walks and it helped Milo settle faster after intense exercise.', true, '40000000-0000-4000-8000-000000000002', '2026-04-09T11:30:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000013', 8, 'For noisy evenings, lowering room activity thirty minutes before lights-out helped my bird a lot.', true, '40000000-0000-4000-8000-000000000004', '2026-04-10T08:40:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000014', 2, 'I update my maintenance checklist every time I change one piece of equipment so I do not forget the new order.', true, '40000000-0000-4000-8000-000000000005', '2026-04-10T18:00:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000015', 4, 'Securing under-sofa access was the biggest quality-of-life change for us. After that, everything else got easier.', true, '40000000-0000-4000-8000-000000000007', '2026-04-11T21:05:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000016', 1, 'Would love that checklist. I keep one in the trailer now, but not one in the tack bag yet.', true, '40000000-0000-4000-8000-000000000008', '2026-04-12T13:15:00Z', NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO public.forum_post_attachments (
    id,
    forum_post_id,
    url,
    media_type,
    file_size_bytes,
    created_at
)
VALUES
    (1, '40000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/petcare-forum-01/1200/900.jpg', 'Image', 412384, '2026-04-08T14:32:00Z'),
    (2, '40000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/petcare-forum-02/1200/900.jpg', 'Image', 538219, '2026-04-09T10:18:00Z'),
    (3, '40000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/petcare-forum-03/1200/900.jpg', 'Image', 467502, '2026-04-09T18:07:00Z'),
    (4, '40000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/petcare-forum-04/1200/900.jpg', 'Image', 389144, '2026-04-10T07:53:00Z'),
    (5, '40000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/petcare-forum-05/1200/900.jpg', 'Image', 624771, '2026-04-10T16:24:00Z'),
    (6, '40000000-0000-4000-8000-000000000006', 'https://picsum.photos/seed/petcare-forum-06/1200/900.jpg', 'Image', 458630, '2026-04-11T09:42:00Z'),
    (7, '40000000-0000-4000-8000-000000000007', 'https://picsum.photos/seed/petcare-forum-07/1200/900.jpg', 'Image', 515904, '2026-04-11T20:12:00Z'),
    (8, '40000000-0000-4000-8000-000000000008', 'https://picsum.photos/seed/petcare-forum-08/1200/900.jpg', 'Image', 603287, '2026-04-12T12:03:00Z'),
    (9, '40000000-0000-4000-8000-000000000009', 'https://picsum.photos/seed/petcare-forum-09/1200/900.jpg', 'Image', 431255, '2026-04-13T08:27:00Z'),
    (10, '40000000-0000-4000-8000-000000000010', 'https://picsum.photos/seed/petcare-forum-10/1200/900.jpg', 'Image', 549883, '2026-04-13T17:14:00Z');

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

-- ============================================================
-- EXPANDED SEED DATA  (doubles all existing record counts)
-- ============================================================

-- Additional species (11–20)
INSERT INTO public.species (id, code, name)
VALUES
    (11, 'guinea_pig',     'Guinea Pig'),
    (12, 'snake',          'Snake'),
    (13, 'lizard',         'Lizard'),
    (14, 'hedgehog',       'Hedgehog'),
    (15, 'chinchilla',     'Chinchilla'),
    (16, 'gerbil',         'Gerbil'),
    (17, 'axolotl',        'Axolotl'),
    (18, 'bearded_dragon', 'Bearded Dragon'),
    (19, 'chameleon',      'Chameleon'),
    (20, 'cockatoo',       'Cockatoo');

-- Additional breeds (21–50)
INSERT INTO public.breeds (id, species_id, name)
VALUES
    (21, 1,  'Maine Coon'),
    (22, 1,  'Bengal'),
    (23, 2,  'Golden Retriever'),
    (24, 2,  'Beagle'),
    (25, 3,  'Lovebird'),
    (26, 3,  'Macaw'),
    (27, 4,  'Lionhead'),
    (28, 4,  'Dutch'),
    (29, 6,  'Guppy'),
    (30, 6,  'Koi'),
    (31, 7,  'Box Turtle'),
    (32, 8,  'Thoroughbred'),
    (33, 9,  'Albino Ferret'),
    (34, 10, 'Blue-fronted Amazon'),
    (35, 11, 'American Guinea Pig'),
    (36, 11, 'Abyssinian Guinea Pig'),
    (37, 12, 'Ball Python'),
    (38, 12, 'Corn Snake'),
    (39, 13, 'Green Iguana'),
    (40, 13, 'Leopard Gecko'),
    (41, 14, 'African Pygmy Hedgehog'),
    (42, 15, 'Standard Chinchilla'),
    (43, 15, 'Mutation Chinchilla'),
    (44, 16, 'Mongolian Gerbil'),
    (45, 17, 'Wild-type Axolotl'),
    (46, 18, 'Inland Bearded Dragon'),
    (47, 18, 'German Giant Bearded Dragon'),
    (48, 19, 'Veiled Chameleon'),
    (49, 19, 'Panther Chameleon'),
    (50, 20, 'Sulphur-crested Cockatoo');

-- Additional users (11–20)
INSERT INTO public.users (
    id,
    username,
    chat_code,
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
        11,
        'nadia.khalil',
        'NADA5GPG',
        'Nadia',
        'Khalil',
        'nadia.khalil@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/67.jpg',
        'Guinea pig owner who posts weekly weight updates and enrichment ideas.',
        false,
        true,
        NULL,
        NULL,
        '2026-01-10T14:30:00Z',
        '2026-04-21T10:15:00Z'
    ),
    (
        12,
        'firas.nassar',
        'FRAS6REP',
        'Firas',
        'Nassar',
        'firas.nassar@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/63.jpg',
        'Reptile keeper with two snakes and a detailed feeding log spreadsheet.',
        false,
        true,
        NULL,
        NULL,
        '2026-01-18T09:45:00Z',
        '2026-04-22T08:30:00Z'
    ),
    (
        13,
        'hana.tabbara',
        'HANA7CHN',
        'Hana',
        'Tabbara',
        'hana.tabbara@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/75.jpg',
        'Chinchilla enthusiast with a custom three-tier cage who tracks dust bath frequency.',
        false,
        true,
        NULL,
        NULL,
        '2026-01-25T11:20:00Z',
        '2026-04-21T16:00:00Z'
    ),
    (
        14,
        'samer.barakat',
        'SAMR8BDG',
        'Samer',
        'Barakat',
        'samer.barakat@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/74.jpg',
        'Bearded dragon owner who coordinates care schedules with the whole family.',
        false,
        true,
        NULL,
        NULL,
        '2026-02-01T08:10:00Z',
        '2026-04-20T19:45:00Z'
    ),
    (
        15,
        'lara.younes',
        'LARA2HGH',
        'Lara',
        'Younes',
        'lara.younes@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/82.jpg',
        'Long-term rescue volunteer and hedgehog foster with a strict nighttime feeding routine.',
        false,
        true,
        NULL,
        NULL,
        '2026-02-08T15:55:00Z',
        '2026-04-23T09:20:00Z'
    ),
    (
        16,
        'tarek.mansour',
        'TARK3PRT',
        'Tarek',
        'Mansour',
        'tarek.mansour@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/85.jpg',
        'Cockatoo owner studying parrot cognition and recording daily interaction notes.',
        false,
        false,
        NULL,
        NULL,
        '2026-02-14T07:30:00Z',
        '2026-04-22T11:30:00Z'
    ),
    (
        17,
        'dina.karam',
        'DYNA4CAT',
        'Dina',
        'Karam',
        'dina.karam@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/88.jpg',
        'Cat shelter volunteer using the app to log medication and weight notes for fosters.',
        false,
        false,
        NULL,
        NULL,
        '2026-02-20T10:05:00Z',
        '2026-04-21T14:40:00Z'
    ),
    (
        18,
        'joseph.azar',
        'JSPH5AQA',
        'Joseph',
        'Azar',
        'joseph.azar@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/90.jpg',
        'Aquarist with a planted community tank who carefully tracks water parameters.',
        false,
        false,
        NULL,
        NULL,
        '2026-02-27T12:50:00Z',
        '2026-04-20T21:00:00Z'
    ),
    (
        19,
        'rania.wehbe',
        'RANA6GRB',
        'Rania',
        'Wehbe',
        'rania.wehbe@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/women/93.jpg',
        'Gerbil keeper with a sandbox enclosure who tracks social bonding behaviours.',
        false,
        false,
        NULL,
        NULL,
        '2026-03-04T09:30:00Z',
        '2026-04-22T17:15:00Z'
    ),
    (
        20,
        'hassan.ibrahim',
        'HASN7AXL',
        'Hassan',
        'Ibrahim',
        'hassan.ibrahim@example.com',
        :'app_user_password_hash',
        true,
        NULL,
        NULL,
        'https://randomuser.me/api/portraits/men/95.jpg',
        'Axolotl owner monitoring water temperature and regeneration progress with daily photos.',
        false,
        false,
        NULL,
        NULL,
        '2026-03-10T16:00:00Z',
        '2026-04-21T12:00:00Z'
    );

-- Direct message sample data
INSERT INTO public.conversations (
    id,
    participant_one_user_id,
    participant_two_user_id,
    created_at,
    last_message_at
)
VALUES
    (1, 1, 2, '2026-04-20T07:55:00Z', '2026-04-20T08:12:00Z'),
    (2, 2, 6, '2026-04-21T18:30:00Z', '2026-04-21T18:46:00Z'),
    (3, 15, 17, '2026-04-22T09:10:00Z', '2026-04-22T09:24:00Z'),
    (4, 16, 18, '2026-04-22T10:45:00Z', '2026-04-22T11:05:00Z');

INSERT INTO public.conversation_participants (
    conversation_id,
    user_id,
    last_read_at
)
VALUES
    (1, 1, '2026-04-20T08:12:00Z'),
    (1, 2, '2026-04-20T08:03:00Z'),
    (2, 2, '2026-04-21T18:45:00Z'),
    (2, 6, '2026-04-21T18:46:00Z'),
    (3, 15, '2026-04-22T09:24:00Z'),
    (3, 17, '2026-04-22T09:24:00Z'),
    (4, 16, '2026-04-22T11:30:00Z'),
    (4, 18, '2026-04-22T11:05:00Z');

INSERT INTO public.direct_messages (
    id,
    conversation_id,
    sender_user_id,
    content,
    media_url,
    media_type,
    media_size_bytes,
    created_at
)
VALUES
    (1, 1, 1,  'Hi Maya, did Luna finish her antibiotics?', NULL, NULL, NULL, '2026-04-20T08:00:00Z'),
    (2, 1, 2,  'Yes, she finished yesterday and finally started eating normally again.', NULL, NULL, NULL, '2026-04-20T08:03:00Z'),
    (3, 1, 1,  'That is such a relief. I can share the reminder checklist I used for Mimi if you want.', NULL, NULL, NULL, '2026-04-20T08:12:00Z'),
    (4, 2, 6,  'Do you know a good vet in Bellevue for dental cleaning?', NULL, NULL, NULL, '2026-04-21T18:33:00Z'),
    (5, 2, 2,  'Northside Veterinary Clinic was great with follow-up notes and gentle handling.', NULL, NULL, NULL, '2026-04-21T18:41:00Z'),
    (6, 2, 6,  'Perfect, I will book with them this week.', NULL, NULL, NULL, '2026-04-21T18:46:00Z'),
    (7, 3, 15, 'Can you send the foster medication chart you mentioned in the forum?', NULL, NULL, NULL, '2026-04-22T09:18:00Z'),
    (8, 3, 17, 'Absolutely. I split it by morning, evening, and refill dates so it is easier to follow.', NULL, NULL, NULL, '2026-04-22T09:24:00Z'),
    (9, 4, 16, 'Here is Zeus after the new perch setup.', 'https://picsum.photos/seed/petcare-dm-zeus/1200/900.jpg', 'Image', 245812, '2026-04-22T11:02:00Z'),
    (10, 4, 18, 'Looks much calmer already.', NULL, NULL, NULL, '2026-04-22T11:05:00Z');

-- Additional admin users (11–20)
INSERT INTO public.admin_users (id, username, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at, last_login)
VALUES
    (11, 'carlos.khoury',  'Carlos',  'Khoury',  'carlos.khoury@petcare.local',  :'admin_user_password_hash', 'Manager', true,  '2025-12-10T10:30:00Z', '2026-04-22T09:00:00Z', '2026-04-22T09:00:00Z'),
    (12, 'sara.nassar',    'Sara',    'Nassar',   'sara.nassar@petcare.local',    :'admin_user_password_hash', 'Admin',   true,  '2025-12-15T10:45:00Z', '2026-04-22T09:10:00Z', '2026-04-22T09:10:00Z'),
    (13, 'mia.rahhal',     'Mia',     'Rahhal',   'mia.rahhal@petcare.local',     :'admin_user_password_hash', 'Manager', true,  '2025-12-20T11:00:00Z', '2026-04-21T10:30:00Z', '2026-04-21T10:30:00Z'),
    (14, 'george.frem',    'George',  'Frem',     'george.frem@petcare.local',    :'admin_user_password_hash', 'Admin',   true,  '2025-12-26T11:15:00Z', '2026-04-21T11:00:00Z', '2026-04-21T11:00:00Z'),
    (15, 'nour.helou',     'Nour',    'Helou',    'nour.helou@petcare.local',     :'admin_user_password_hash', 'Manager', true,  '2026-01-02T09:30:00Z', '2026-04-21T11:30:00Z', '2026-04-21T11:30:00Z'),
    (16, 'jessica.ghanem', 'Jessica', 'Ghanem',   'jessica.ghanem@petcare.local', :'admin_user_password_hash', 'Admin',   true,  '2026-01-07T09:45:00Z', '2026-04-20T12:00:00Z', '2026-04-20T12:00:00Z'),
    (17, 'pierre.saleh',   'Pierre',  'Saleh',    'pierre.saleh@petcare.local',   :'admin_user_password_hash', 'Manager', true,  '2026-01-13T10:00:00Z', '2026-04-20T12:30:00Z', '2026-04-20T12:30:00Z'),
    (18, 'zeina.mroue',    'Zeina',   'Mroue',    'zeina.mroue@petcare.local',    :'admin_user_password_hash', 'Admin',   true,  '2026-01-19T10:15:00Z', '2026-04-19T14:00:00Z', '2026-04-19T14:00:00Z'),
    (19, 'chadi.nasr',     'Chadi',   'Nasr',     'chadi.nasr@petcare.local',     :'admin_user_password_hash', 'Manager', true,  '2026-01-25T10:30:00Z', '2026-04-19T14:30:00Z', '2026-04-19T14:30:00Z'),
    (20, 'maya.atallah',   'Maya',    'Atallah',  'maya.atallah@petcare.local',   :'admin_user_password_hash', 'Admin',   false, '2026-02-01T10:45:00Z', '2026-04-18T09:00:00Z', NULL);

-- Additional pet places (11–20): includes 4 Charity places (11–14)
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
    ('10000000-0000-4000-8000-000000000011', 11,   'Paws for Hope Animal Charity',  '+1-206-555-0111', 'info@pawsforhope.test',        'https://picsum.photos/seed/petcare-place-11/1200/800.jpg', 'Community charity providing low-cost veterinary support, food drives, and adoption events for families in need.',       '340 Olive Way',       NULL,       'Seattle', 'United States', 'Active',   'Charity', 47.612500, -122.339000, '2025-12-10T09:00:00Z'),
    ('10000000-0000-4000-8000-000000000012', 15,   'Furry Friends Foundation',       '+1-425-555-0112', 'hello@furryfriends.test',      'https://picsum.photos/seed/petcare-place-12/1200/800.jpg', 'Non-profit dedicated to rescue, rehabilitation, and re-homing of surrendered and stray animals.',                      '77 Bellevue Way NE',  'Suite 105','Bellevue','United States', 'Active',   'Charity', 47.610800, -122.200500, '2025-12-18T10:30:00Z'),
    ('10000000-0000-4000-8000-000000000013', NULL, 'Second Chance Animal Fund',      '+1-503-555-0113', 'contact@secondchancefund.test', 'https://picsum.photos/seed/petcare-place-13/1200/800.jpg', 'Charity fund covering emergency medical bills for pet owners who cannot afford sudden vet costs.',                    '125 SE Morrison St',  NULL,       'Portland','United States', 'Active',   'Charity', 45.521000, -122.659000, '2026-01-05T08:45:00Z'),
    ('10000000-0000-4000-8000-000000000014', 14,   'Hearts & Paws Charity',          '+1-303-555-0114', 'reach@heartsandpaws.test',     'https://picsum.photos/seed/petcare-place-14/1200/800.jpg', 'Animal welfare charity running weekend outreach clinics, spay and neuter drives, and pet food banks.',                '600 17th Street',     'Floor 3',  'Denver',  'United States', 'Active',   'Charity', 39.745000, -104.988000, '2026-01-14T11:00:00Z'),
    ('10000000-0000-4000-8000-000000000015', NULL, 'Northside Veterinary Clinic',    '+1-503-555-0115', 'clinic@northsidevetpdx.test',  'https://picsum.photos/seed/petcare-place-15/1200/800.jpg', 'Friendly neighborhood clinic specializing in cats and dogs with wellness, dental, and senior-care programs.',         '88 N Williams Ave',   NULL,       'Portland','United States', 'Active',   'Vet',     45.538500, -122.671000, '2026-01-20T09:15:00Z'),
    ('10000000-0000-4000-8000-000000000016', NULL, 'Valley Animal Hospital',         '+1-206-555-0116', 'appointments@valleyah.test',   'https://picsum.photos/seed/petcare-place-16/1200/800.jpg', 'Full-service hospital providing diagnostics, surgery, and rehabilitation for companion animals.',                     '2200 Rainier Ave S',  NULL,       'Seattle', 'United States', 'Active',   'Vet',     47.582000, -122.296000, '2026-01-28T08:00:00Z'),
    ('10000000-0000-4000-8000-000000000017', 13,   'Urban Pets Boutique',            '+1-425-555-0117', 'shop@urbanpetsboutique.test',  'https://picsum.photos/seed/petcare-place-17/1200/800.jpg', 'Curated pet boutique with organic treats, stylish accessories, and personalized nutrition consultations.',            '410 Bellevue Square', NULL,       'Bellevue','United States', 'Active',   'PetShop', 47.617000, -122.201000, '2026-02-04T13:00:00Z'),
    ('10000000-0000-4000-8000-000000000018', NULL, 'The Happy Hamster Shop',         '+1-303-555-0118', 'info@happyhamster.test',       'https://picsum.photos/seed/petcare-place-18/1200/800.jpg', 'Small-pet specialty shop with a wide range of enclosures, substrate types, and exotic-pet food brands.',             '900 Lincoln Street',  NULL,       'Denver',  'United States', 'Active',   'PetShop', 39.731000, -104.984000, '2026-02-12T10:45:00Z'),
    ('10000000-0000-4000-8000-000000000019', NULL, 'Doggy Daycare Express',          '+1-509-555-0119', 'play@doggydaycareexp.test',    'https://picsum.photos/seed/petcare-place-19/1200/800.jpg', 'Supervised daycare facility with indoor and outdoor play areas, grooming stations, and behaviour monitoring.',        '350 W Riverside Ave', NULL,       'Spokane', 'United States', 'Active',   'Other',   47.654000, -117.430000, '2026-02-19T12:30:00Z'),
    ('10000000-0000-4000-8000-000000000020', NULL, 'The Cat Lounge',                 '+1-208-555-0120', 'hello@thecatlounge.test',      'https://picsum.photos/seed/petcare-place-20/1200/800.jpg', 'Cat café and socialisation venue pairing adoptable cats with visitors in a calm, enriched environment.',              '200 S 8th Street',    NULL,       'Boise',   'United States', 'Inactive', 'Other',   43.617000, -116.201000, '2026-03-01T09:00:00Z');

-- Additional place images (11–20)
INSERT INTO public.pet_place_images (id, pet_place_id, url, created_at)
VALUES
    (11, '10000000-0000-4000-8000-000000000011', 'https://picsum.photos/seed/petcare-place-gallery-11/1600/1200.jpg', '2025-12-10T09:05:00Z'),
    (12, '10000000-0000-4000-8000-000000000012', 'https://picsum.photos/seed/petcare-place-gallery-12/1600/1200.jpg', '2025-12-18T10:35:00Z'),
    (13, '10000000-0000-4000-8000-000000000013', 'https://picsum.photos/seed/petcare-place-gallery-13/1600/1200.jpg', '2026-01-05T08:50:00Z'),
    (14, '10000000-0000-4000-8000-000000000014', 'https://picsum.photos/seed/petcare-place-gallery-14/1600/1200.jpg', '2026-01-14T11:05:00Z'),
    (15, '10000000-0000-4000-8000-000000000015', 'https://picsum.photos/seed/petcare-place-gallery-15/1600/1200.jpg', '2026-01-20T09:20:00Z'),
    (16, '10000000-0000-4000-8000-000000000016', 'https://picsum.photos/seed/petcare-place-gallery-16/1600/1200.jpg', '2026-01-28T08:05:00Z'),
    (17, '10000000-0000-4000-8000-000000000017', 'https://picsum.photos/seed/petcare-place-gallery-17/1600/1200.jpg', '2026-02-04T13:05:00Z'),
    (18, '10000000-0000-4000-8000-000000000018', 'https://picsum.photos/seed/petcare-place-gallery-18/1600/1200.jpg', '2026-02-12T10:50:00Z'),
    (19, '10000000-0000-4000-8000-000000000019', 'https://picsum.photos/seed/petcare-place-gallery-19/1600/1200.jpg', '2026-02-19T12:35:00Z'),
    (20, '10000000-0000-4000-8000-000000000020', 'https://picsum.photos/seed/petcare-place-gallery-20/1600/1200.jpg', '2026-03-01T09:05:00Z');

-- Additional place schedules (ids 71–140) for the 10 new places.
-- Charity: Mon–Fri 09:00–17:00 with lunch break, Sat 10:00–14:00, Sun closed.
-- Vet / PetShop / Other use the same patterns as the existing CTE-derived rows.
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
VALUES
    -- Place 11 (Charity – Paws for Hope)
    (71,  '10000000-0000-4000-8000-000000000011', 'Monday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (72,  '10000000-0000-4000-8000-000000000011', 'Tuesday',   false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (73,  '10000000-0000-4000-8000-000000000011', 'Wednesday', false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (74,  '10000000-0000-4000-8000-000000000011', 'Thursday',  false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (75,  '10000000-0000-4000-8000-000000000011', 'Friday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (76,  '10000000-0000-4000-8000-000000000011', 'Saturday',  false, TIME '10:00', TIME '14:00', NULL,         NULL        ),
    (77,  '10000000-0000-4000-8000-000000000011', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 12 (Charity – Furry Friends Foundation)
    (78,  '10000000-0000-4000-8000-000000000012', 'Monday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (79,  '10000000-0000-4000-8000-000000000012', 'Tuesday',   false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (80,  '10000000-0000-4000-8000-000000000012', 'Wednesday', false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (81,  '10000000-0000-4000-8000-000000000012', 'Thursday',  false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (82,  '10000000-0000-4000-8000-000000000012', 'Friday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (83,  '10000000-0000-4000-8000-000000000012', 'Saturday',  false, TIME '10:00', TIME '14:00', NULL,         NULL        ),
    (84,  '10000000-0000-4000-8000-000000000012', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 13 (Charity – Second Chance Animal Fund)
    (85,  '10000000-0000-4000-8000-000000000013', 'Monday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (86,  '10000000-0000-4000-8000-000000000013', 'Tuesday',   false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (87,  '10000000-0000-4000-8000-000000000013', 'Wednesday', false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (88,  '10000000-0000-4000-8000-000000000013', 'Thursday',  false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (89,  '10000000-0000-4000-8000-000000000013', 'Friday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (90,  '10000000-0000-4000-8000-000000000013', 'Saturday',  false, TIME '10:00', TIME '14:00', NULL,         NULL        ),
    (91,  '10000000-0000-4000-8000-000000000013', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 14 (Charity – Hearts & Paws Charity)
    (92,  '10000000-0000-4000-8000-000000000014', 'Monday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (93,  '10000000-0000-4000-8000-000000000014', 'Tuesday',   false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (94,  '10000000-0000-4000-8000-000000000014', 'Wednesday', false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (95,  '10000000-0000-4000-8000-000000000014', 'Thursday',  false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (96,  '10000000-0000-4000-8000-000000000014', 'Friday',    false, TIME '09:00', TIME '17:00', TIME '13:00', TIME '13:30'),
    (97,  '10000000-0000-4000-8000-000000000014', 'Saturday',  false, TIME '10:00', TIME '14:00', NULL,         NULL        ),
    (98,  '10000000-0000-4000-8000-000000000014', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 15 (Vet – Northside Veterinary Clinic)
    (99,  '10000000-0000-4000-8000-000000000015', 'Monday',    false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (100, '10000000-0000-4000-8000-000000000015', 'Tuesday',   false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (101, '10000000-0000-4000-8000-000000000015', 'Wednesday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (102, '10000000-0000-4000-8000-000000000015', 'Thursday',  false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (103, '10000000-0000-4000-8000-000000000015', 'Friday',    false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (104, '10000000-0000-4000-8000-000000000015', 'Saturday',  false, TIME '09:00', TIME '13:00', NULL,         NULL        ),
    (105, '10000000-0000-4000-8000-000000000015', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 16 (Vet – Valley Animal Hospital)
    (106, '10000000-0000-4000-8000-000000000016', 'Monday',    false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (107, '10000000-0000-4000-8000-000000000016', 'Tuesday',   false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (108, '10000000-0000-4000-8000-000000000016', 'Wednesday', false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (109, '10000000-0000-4000-8000-000000000016', 'Thursday',  false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (110, '10000000-0000-4000-8000-000000000016', 'Friday',    false, TIME '08:30', TIME '17:30', TIME '12:30', TIME '13:30'),
    (111, '10000000-0000-4000-8000-000000000016', 'Saturday',  false, TIME '09:00', TIME '13:00', NULL,         NULL        ),
    (112, '10000000-0000-4000-8000-000000000016', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 17 (PetShop – Urban Pets Boutique)
    (113, '10000000-0000-4000-8000-000000000017', 'Monday',    false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (114, '10000000-0000-4000-8000-000000000017', 'Tuesday',   false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (115, '10000000-0000-4000-8000-000000000017', 'Wednesday', false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (116, '10000000-0000-4000-8000-000000000017', 'Thursday',  false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (117, '10000000-0000-4000-8000-000000000017', 'Friday',    false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (118, '10000000-0000-4000-8000-000000000017', 'Saturday',  false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (119, '10000000-0000-4000-8000-000000000017', 'Sunday',    false, TIME '11:00', TIME '18:00', NULL,         NULL        ),
    -- Place 18 (PetShop – The Happy Hamster Shop)
    (120, '10000000-0000-4000-8000-000000000018', 'Monday',    false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (121, '10000000-0000-4000-8000-000000000018', 'Tuesday',   false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (122, '10000000-0000-4000-8000-000000000018', 'Wednesday', false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (123, '10000000-0000-4000-8000-000000000018', 'Thursday',  false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (124, '10000000-0000-4000-8000-000000000018', 'Friday',    false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (125, '10000000-0000-4000-8000-000000000018', 'Saturday',  false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (126, '10000000-0000-4000-8000-000000000018', 'Sunday',    false, TIME '11:00', TIME '18:00', NULL,         NULL        ),
    -- Place 19 (Other – Doggy Daycare Express)
    (127, '10000000-0000-4000-8000-000000000019', 'Monday',    false, TIME '07:00', TIME '18:00', NULL,         NULL        ),
    (128, '10000000-0000-4000-8000-000000000019', 'Tuesday',   false, TIME '07:00', TIME '18:00', NULL,         NULL        ),
    (129, '10000000-0000-4000-8000-000000000019', 'Wednesday', false, TIME '07:00', TIME '18:00', NULL,         NULL        ),
    (130, '10000000-0000-4000-8000-000000000019', 'Thursday',  false, TIME '07:00', TIME '18:00', NULL,         NULL        ),
    (131, '10000000-0000-4000-8000-000000000019', 'Friday',    false, TIME '07:00', TIME '18:00', NULL,         NULL        ),
    (132, '10000000-0000-4000-8000-000000000019', 'Saturday',  false, TIME '08:00', TIME '16:00', NULL,         NULL        ),
    (133, '10000000-0000-4000-8000-000000000019', 'Sunday',    true,  NULL,         NULL,         NULL,         NULL        ),
    -- Place 20 (Other – The Cat Lounge, inactive but schedule preserved)
    (134, '10000000-0000-4000-8000-000000000020', 'Monday',    false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (135, '10000000-0000-4000-8000-000000000020', 'Tuesday',   false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (136, '10000000-0000-4000-8000-000000000020', 'Wednesday', false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (137, '10000000-0000-4000-8000-000000000020', 'Thursday',  false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (138, '10000000-0000-4000-8000-000000000020', 'Friday',    false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (139, '10000000-0000-4000-8000-000000000020', 'Saturday',  false, TIME '10:00', TIME '20:00', NULL,         NULL        ),
    (140, '10000000-0000-4000-8000-000000000020', 'Sunday',    false, TIME '11:00', TIME '18:00', NULL,         NULL        );

-- Additional place owner applications (6–10)
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
    (6,  11, 'Paws for Hope Animal Charity', '+1-206-555-0111', 'info@pawsforhope.test',        'Charity application for Nadia''s low-cost vet support and food drive coordination program.',             '340 Olive Way',       NULL,       'Seattle', 'United States', 'Charity', 'Approved', NULL, 'Approved after reviewing charity registration documents and partner vet agreements.',           12, '2026-03-15T10:00:00Z', '2026-03-10T09:00:00Z', '2026-03-15T10:00:00Z'),
    (7,  15, 'Furry Friends Foundation',      '+1-425-555-0112', 'hello@furryfriends.test',      'Application for Lara''s rescue charity focused on rehabilitation and re-homing of surrendered animals.', '77 Bellevue Way NE',  'Suite 105','Bellevue','United States', 'Charity', 'Approved', NULL, 'Verified non-profit registration and approved with a note to upload quarterly reports.',        11, '2026-03-28T14:30:00Z', '2026-03-22T11:00:00Z', '2026-03-28T14:30:00Z'),
    (8,  13, 'Urban Pets Boutique',           '+1-425-555-0117', 'shop@urbanpetsboutique.test',  'Boutique application for Hana''s curated pet shop with organic treats and personalised consultations.',  '410 Bellevue Square', NULL,       'Bellevue','United States', 'PetShop', 'Approved', NULL, 'Approved after verifying business registration and product safety certifications.',             14, '2026-04-05T09:30:00Z', '2026-04-01T10:15:00Z', '2026-04-05T09:30:00Z'),
    (9,  14, 'Hearts & Paws Charity',         '+1-303-555-0114', 'reach@heartsandpaws.test',     'Charity application for Samer''s weekend outreach clinic and spay drive coordination.',                  '600 17th Street',     'Floor 3',  'Denver',  'United States', 'Charity', 'Approved', NULL, 'Charity confirmed with state registration. Approved with request for annual impact report.',    15, '2026-04-12T11:30:00Z', '2026-04-07T08:45:00Z', '2026-04-12T11:30:00Z'),
    (10, 16, 'Tarek''s Parrot Rescue Perch',  '+1-206-555-0131', 'birds@parrotrescueperch.test', 'Pending application for a small parrot rescue and behaviour-recovery program based in Seattle.',          '88 Westlake Ave N',   NULL,       'Seattle', 'United States', 'Charity', 'Pending',  NULL, NULL,                                                                                             NULL, NULL,                  '2026-04-25T09:00:00Z', '2026-04-25T09:00:00Z');

-- Additional place owner application images (6–10)
INSERT INTO public.place_owner_application_images (id, place_owner_application_id, url, created_at)
VALUES
    (6,  6,  'https://picsum.photos/seed/petcare-place-application-06/1600/1200.jpg', '2026-03-10T09:05:00Z'),
    (7,  7,  'https://picsum.photos/seed/petcare-place-application-07/1600/1200.jpg', '2026-03-22T11:05:00Z'),
    (8,  8,  'https://picsum.photos/seed/petcare-place-application-08/1600/1200.jpg', '2026-04-01T10:20:00Z'),
    (9,  9,  'https://picsum.photos/seed/petcare-place-application-09/1600/1200.jpg', '2026-04-07T08:50:00Z'),
    (10, 10, 'https://picsum.photos/seed/petcare-place-application-10/1600/1200.jpg', '2026-04-25T09:05:00Z');

-- Additional pet place reviews (11–20)
INSERT INTO public.pet_place_reviews (id, place_id, user_id, rating, comment, created_at, updated_at)
VALUES
    ('50000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', 11, 5, 'Paws for Hope covered Coco''s emergency vet bill when I had no savings left. Incredible service.',              '2026-04-05T10:30:00Z', NULL),
    ('50000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', 15, 5, 'Found the most caring foster family for a surrendered hedgehog through Furry Friends. Highly recommended.',     '2026-04-06T09:15:00Z', NULL),
    ('50000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', 12, 4, 'Second Chance covered most of Noodle''s emergency surgery. The application process was straightforward.',       '2026-04-07T14:00:00Z', NULL),
    ('50000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000014', 14, 5, 'Hearts & Paws ran a free spay event in our neighborhood. Amazing coordination and professional vets.',          '2026-04-08T11:45:00Z', NULL),
    ('50000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000015', 17, 4, 'Northside handled our foster cat''s dental with great care. The team gave clear aftercare instructions.',       '2026-04-09T16:20:00Z', NULL),
    ('50000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000016', 18, 5, 'Valley Animal Hospital ran excellent water-parameter diagnostics for my aquarium fish. Very thorough.',         '2026-04-10T10:05:00Z', NULL),
    ('50000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000017', 13, 5, 'Urban Pets Boutique has the best organic treats and the staff really understand chinchilla nutrition.',         '2026-04-11T13:50:00Z', NULL),
    ('50000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000018', 19, 4, 'Good selection of gerbil substrate and enrichment toys. Staff knew exactly what I was looking for.',           '2026-04-12T09:30:00Z', NULL),
    ('50000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000019', 20, 5, 'The steady temperature monitoring advice they recommended during daycare setup was invaluable for my axolotl.',  '2026-04-13T15:10:00Z', NULL),
    ('50000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000011', 16, 5, 'Paws for Hope ran a weekend adoption event where I met responsible new owners. Outstanding charity work.',      '2026-04-14T12:00:00Z', NULL);

-- Additional pets (13–24)
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
    ('20000000-0000-4000-8000-000000000013', 11, 'Coco',    11, 35, 'female',  '2024-03-10T00:00:00Z', 0.95, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-coco/800/800.jpg',    'Very curious guinea pig with a love for bell peppers and extended floor time.',             '2026-03-15T10:00:00Z', '2026-04-20T10:00:00Z'),
    ('20000000-0000-4000-8000-000000000014', 12, 'Noodle',  12, 37, 'male',    '2021-07-04T00:00:00Z', 1.40, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-noodle/800/800.jpg',  'Ball python on a strict bi-weekly feeding schedule with careful humidity logs.',            '2026-03-20T09:30:00Z', '2026-04-19T09:30:00Z'),
    ('20000000-0000-4000-8000-000000000015', 13, 'Dusty',   15, 42, 'female',  '2022-11-19T00:00:00Z', 0.55, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-dusty/800/800.jpg',   'Standard chinchilla with a daily dust bath routine and a rotating toy selection.',          '2026-03-25T14:00:00Z', '2026-04-18T14:00:00Z'),
    ('20000000-0000-4000-8000-000000000016', 14, 'Blaze',   18, 46, 'male',    '2022-06-12T00:00:00Z', 0.50, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-blaze/800/800.jpg',   'Inland bearded dragon with a structured basking and feeding schedule.',                    '2026-03-28T08:45:00Z', '2026-04-17T08:45:00Z'),
    ('20000000-0000-4000-8000-000000000017', 15, 'Spike',   14, 41, 'male',    '2023-04-20T00:00:00Z', 0.06, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-spike/800/800.jpg',   'African pygmy hedgehog with a precise nighttime feeding window and exercise wheel.',        '2026-03-30T11:20:00Z', '2026-04-16T11:20:00Z'),
    ('20000000-0000-4000-8000-000000000018', 16, 'Zeus',    20, 50, 'male',    '2019-08-15T00:00:00Z', 0.85, 'White',   false, 'https://picsum.photos/seed/petcare-pet-zeus/800/800.jpg',    'Sulphur-crested cockatoo requiring extensive daily socialisation and enrichment.',          '2026-04-01T09:00:00Z', '2026-04-21T09:00:00Z'),
    ('20000000-0000-4000-8000-000000000019', 17, 'Mittens', 1,  21, 'female',  '2020-10-05T00:00:00Z', 5.20, 'Unknown', true,  'https://picsum.photos/seed/petcare-pet-mittens/800/800.jpg', 'Maine Coon foster with a calm temperament and a careful medication schedule.',             '2026-04-03T10:30:00Z', '2026-04-20T10:30:00Z'),
    ('20000000-0000-4000-8000-000000000020', 18, 'Finn',    6,  29, 'male',    '2025-02-14T00:00:00Z', NULL, 'Orange',  false, 'https://picsum.photos/seed/petcare-pet-finn/800/800.jpg',    'Guppy in a planted community tank with weekly water-parameter tracking.',                  '2026-04-05T17:00:00Z', '2026-04-19T17:00:00Z'),
    ('20000000-0000-4000-8000-000000000021', 19, 'Maple',   16, 44, 'female',  '2023-12-01T00:00:00Z', 0.09, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-maple/800/800.jpg',   'Mongolian gerbil sharing a large sandbox enclosure with her bonded pair partner.',         '2026-04-07T09:15:00Z', '2026-04-18T09:15:00Z'),
    ('20000000-0000-4000-8000-000000000022', 20, 'Axel',    17, 45, 'unknown', '2023-05-30T00:00:00Z', 0.24, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-axel/800/800.jpg',    'Wild-type axolotl with daily temperature checks and a high-protein diet rotation.',        '2026-04-09T14:45:00Z', '2026-04-21T14:45:00Z'),
    ('20000000-0000-4000-8000-000000000023', 11, 'Biscuit', 11, 36, 'male',    '2024-05-22T00:00:00Z', 0.88, 'Unknown', false, 'https://picsum.photos/seed/petcare-pet-biscuit/800/800.jpg', 'Abyssinian guinea pig with a rosette coat and very vocal feeding cues.',                   '2026-04-11T10:00:00Z', '2026-04-22T10:00:00Z'),
    ('20000000-0000-4000-8000-000000000024', 12, 'Ember',   12, 38, 'female',  '2022-03-17T00:00:00Z', 0.38, 'Orange',  false, 'https://picsum.photos/seed/petcare-pet-ember/800/800.jpg',   'Corn snake on a monthly shedding cycle with careful post-shed health checks.',             '2026-04-13T08:30:00Z', '2026-04-23T08:30:00Z');

-- Additional consultations (13–24)
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
    (13, 11, '20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000015', '2026-03-18T11:00:00Z', 'Wellness check for Coco after weight drop and slight change in activity level.',              '2026-03-12T09:00:00Z', '2026-03-18T11:40:00Z'),
    (14, 12, '20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000007', '2026-03-25T10:00:00Z', 'Routine health check for Noodle covering humidity levels, skin condition, and weight.',      '2026-03-18T08:30:00Z', '2026-03-25T10:30:00Z'),
    (15, 13, '20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000007', '2026-04-02T14:00:00Z', 'Dental check for Dusty after owner noticed slower eating and selective veggie preference.', '2026-03-26T10:00:00Z', '2026-04-02T14:35:00Z'),
    (16, 14, '20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000015', '2026-04-08T09:30:00Z', 'Annual wellness visit for Blaze with full body inspection and UVB schedule review.',         '2026-04-01T08:15:00Z', '2026-04-08T10:05:00Z'),
    (17, 15, '20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000015', '2026-04-14T10:15:00Z', 'Wellness check for Spike after increased anointing behaviour and slightly reduced appetite.','2026-04-09T11:00:00Z', '2026-04-14T10:50:00Z'),
    (18, 16, '20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000007', '2026-05-06T09:00:00Z', 'Upcoming feather and beak check for Zeus; owner reports increased screaming episodes.',     '2026-04-21T08:30:00Z', NULL),
    (19, 17, '20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000016', '2026-04-20T13:30:00Z', 'Dental and senior health review for Mittens, the Maine Coon foster in Dina''s care.',       '2026-04-15T12:00:00Z', '2026-04-20T14:00:00Z'),
    (20, 18, '20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000015', '2026-06-10T15:00:00Z', 'Scheduled fish health consultation for Finn to review tank chemistry and fin condition.',    '2026-04-22T09:00:00Z', NULL),
    (21, 19, '20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000016', '2026-05-20T11:00:00Z', 'Upcoming wellness and weight check for Maple after a period of reduced social play.',         '2026-04-20T10:30:00Z', NULL),
    (22, 20, '20000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000007', '2026-04-24T10:30:00Z', 'Axolotl health review for Axel covering limb regeneration progress and water temperature.',  '2026-04-18T14:30:00Z', NULL),
    (23, 11, '20000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000015', '2026-05-15T09:45:00Z', 'First wellness visit for Biscuit after owner noticed occasional head tilt and wheezing.',    '2026-04-23T11:00:00Z', NULL),
    (24, 12, '20000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000007', '2026-04-30T11:00:00Z', 'Post-shed health check for Ember to inspect scales, eye caps, and shedding quality.',       '2026-04-25T08:00:00Z', NULL);

-- Additional forum posts (17–32)
INSERT INTO public.forum_posts (
    id,
    user_id,
    content,
    is_a_reply,
    replying_to_post,
    created_at,
    updated_at,
    moderation_status,
    ai_moderation_label,
    ai_moderation_confidence,
    ai_moderation_reason,
    moderated_at,
    final_moderation_label,
    reviewed_by_admin_id,
    reviewed_at,
    admin_moderation_notes
)
VALUES
    ('40000000-0000-4000-8000-000000000017', 11, 'How often should you weigh a guinea pig to catch weight-loss trends before they become serious?',                                          false, NULL,                                        '2026-04-14T09:00:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000018', 12, 'Any tips for keeping humidity stable in a ball python enclosure during dry winter months?',                                               false, NULL,                                        '2026-04-14T12:30:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000019', 13, 'Chinchilla owners: do you rotate dust bath houses daily or every few days?',                                                              false, NULL,                                        '2026-04-15T07:45:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000020', 14, 'Looking for advice on setting up a proper UVB and basking gradient for a new bearded dragon enclosure.',                                  false, NULL,                                        '2026-04-15T14:00:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000021', 15, 'My hedgehog started hibernation attempts last night. Any advice on heating setup to prevent it safely?',                                  false, NULL,                                        '2026-04-16T08:20:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000022', 16, 'Cockatoo owners: what is your routine to reduce screaming before and after meals?',                                                       false, NULL,                                        '2026-04-16T17:10:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000023', 17, 'Foster cat tips: how do you manage medication schedules for multiple cats with different doses?',                                         false, NULL,                                        '2026-04-17T09:40:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000024', 18, 'Planted tank owners: how do you balance CO2, lighting, and fertilisers without disrupting fish health?',                                  false, NULL,                                        '2026-04-17T16:00:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000025', 19, 'Anyone used a large sand cage for a bonded gerbil pair? Curious about digging depth recommendations.',                                    false, NULL,                                        '2026-04-18T08:10:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000026', 20, 'Axolotl keeps trying to eat gravel. Has anyone successfully transitioned to a bare-bottom tank setup?',                                   false, NULL,                                        '2026-04-18T15:30:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000027', 13, 'Weekly weighing in the same conditions worked well for Dusty. Consistent timing matters more than frequency.',                            true,  '40000000-0000-4000-8000-000000000017', '2026-04-14T11:00:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000028', 15, 'A humid hide on the cool side solved our winter humidity problem without much effort at all.',                                             true,  '40000000-0000-4000-8000-000000000018', '2026-04-14T13:30:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000029', 11, 'A ceramic heat emitter on a thermostat is the most reliable fix for hedgehog hibernation attempts.',                                      true,  '40000000-0000-4000-8000-000000000021', '2026-04-16T09:30:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000030', 14, 'I keep labelled pill organisers above each foster crate. Colour-coded per cat so no one gets the wrong dose.',                            true,  '40000000-0000-4000-8000-000000000023', '2026-04-17T11:00:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000031', 20, 'Bare-bottom worked for us after a week-long transition from fine sand. Very few incidents with Axel since.',                              true,  '40000000-0000-4000-8000-000000000026', '2026-04-18T17:00:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('40000000-0000-4000-8000-000000000032', 16, 'Early foraging sessions in the morning reduced Zeus''s pre-meal screaming by about half.',                                                true,  '40000000-0000-4000-8000-000000000022', '2026-04-16T18:30:00Z', NULL,                  'None',     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Additional forum post attachments (11–20)
INSERT INTO public.forum_post_attachments (id, forum_post_id, url, media_type, file_size_bytes, created_at)
VALUES
    (11, '40000000-0000-4000-8000-000000000017', 'https://picsum.photos/seed/petcare-forum-11/1200/900.jpg', 'Image', 472310, '2026-04-14T09:02:00Z'),
    (12, '40000000-0000-4000-8000-000000000018', 'https://picsum.photos/seed/petcare-forum-12/1200/900.jpg', 'Image', 518740, '2026-04-14T12:32:00Z'),
    (13, '40000000-0000-4000-8000-000000000019', 'https://picsum.photos/seed/petcare-forum-13/1200/900.jpg', 'Image', 392500, '2026-04-15T07:47:00Z'),
    (14, '40000000-0000-4000-8000-000000000020', 'https://picsum.photos/seed/petcare-forum-14/1200/900.jpg', 'Image', 610200, '2026-04-15T14:02:00Z'),
    (15, '40000000-0000-4000-8000-000000000021', 'https://picsum.photos/seed/petcare-forum-15/1200/900.jpg', 'Image', 441080, '2026-04-16T08:22:00Z'),
    (16, '40000000-0000-4000-8000-000000000022', 'https://picsum.photos/seed/petcare-forum-16/1200/900.jpg', 'Image', 529600, '2026-04-16T17:12:00Z'),
    (17, '40000000-0000-4000-8000-000000000023', 'https://picsum.photos/seed/petcare-forum-17/1200/900.jpg', 'Image', 483900, '2026-04-17T09:42:00Z'),
    (18, '40000000-0000-4000-8000-000000000024', 'https://picsum.photos/seed/petcare-forum-18/1200/900.jpg', 'Image', 557430, '2026-04-17T16:02:00Z'),
    (19, '40000000-0000-4000-8000-000000000025', 'https://picsum.photos/seed/petcare-forum-19/1200/900.jpg', 'Image', 415700, '2026-04-18T08:12:00Z'),
    (20, '40000000-0000-4000-8000-000000000026', 'https://picsum.photos/seed/petcare-forum-20/1200/900.jpg', 'Image', 601800, '2026-04-18T15:32:00Z');

-- Additional forum post bookmarks
INSERT INTO public.forum_post_bookmarks (user_id, forum_post_id, created_at)
VALUES
    (11, '40000000-0000-4000-8000-000000000018', '2026-04-14T13:00:00Z'),
    (11, '40000000-0000-4000-8000-000000000021', '2026-04-16T09:00:00Z'),
    (12, '40000000-0000-4000-8000-000000000017', '2026-04-14T10:00:00Z'),
    (13, '40000000-0000-4000-8000-000000000020', '2026-04-15T15:00:00Z'),
    (14, '40000000-0000-4000-8000-000000000023', '2026-04-17T10:30:00Z'),
    (15, '40000000-0000-4000-8000-000000000019', '2026-04-15T08:30:00Z'),
    (16, '40000000-0000-4000-8000-000000000024', '2026-04-17T17:00:00Z'),
    (17, '40000000-0000-4000-8000-000000000017', '2026-04-14T10:15:00Z'),
    (18, '40000000-0000-4000-8000-000000000026', '2026-04-18T16:00:00Z'),
    (19, '40000000-0000-4000-8000-000000000025', '2026-04-18T09:00:00Z'),
    (20, '40000000-0000-4000-8000-000000000022', '2026-04-16T18:00:00Z'),
    (12, '40000000-0000-4000-8000-000000000026', '2026-04-18T16:30:00Z');

-- Additional forum post likes
INSERT INTO public.forum_post_likes (user_id, forum_post_id, created_at)
VALUES
    (11, '40000000-0000-4000-8000-000000000018', '2026-04-14T12:45:00Z'),
    (12, '40000000-0000-4000-8000-000000000017', '2026-04-14T09:30:00Z'),
    (13, '40000000-0000-4000-8000-000000000019', '2026-04-15T08:00:00Z'),
    (14, '40000000-0000-4000-8000-000000000020', '2026-04-15T14:30:00Z'),
    (15, '40000000-0000-4000-8000-000000000021', '2026-04-16T08:45:00Z'),
    (16, '40000000-0000-4000-8000-000000000022', '2026-04-16T17:30:00Z'),
    (17, '40000000-0000-4000-8000-000000000023', '2026-04-17T10:00:00Z'),
    (18, '40000000-0000-4000-8000-000000000024', '2026-04-17T16:30:00Z'),
    (19, '40000000-0000-4000-8000-000000000025', '2026-04-18T08:30:00Z'),
    (20, '40000000-0000-4000-8000-000000000026', '2026-04-18T15:45:00Z'),
    (11, '40000000-0000-4000-8000-000000000027', '2026-04-14T11:30:00Z'),
    (13, '40000000-0000-4000-8000-000000000028', '2026-04-14T14:00:00Z'),
    (15, '40000000-0000-4000-8000-000000000029', '2026-04-16T09:45:00Z'),
    (17, '40000000-0000-4000-8000-000000000030', '2026-04-17T11:30:00Z'),
    (12, '40000000-0000-4000-8000-000000000031', '2026-04-18T17:30:00Z'),
    (14, '40000000-0000-4000-8000-000000000032', '2026-04-16T19:00:00Z'),
    (20, '40000000-0000-4000-8000-000000000017', '2026-04-14T10:00:00Z'),
    (16, '40000000-0000-4000-8000-000000000021', '2026-04-16T10:00:00Z');

-- Additional reports (7–12)
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
    (7,  12, 'ForumPost', '40000000-0000-4000-8000-000000000010', 'Spam',               'Post seemed to promote a product rather than share a genuine care tip.',                    'Pending',     NULL, NULL,                  '2026-04-15T08:00:00Z'),
    (8,  13, 'User',      '10',                                   'InappropriateContent','This user sent unsolicited sales messages through the forum thread.',                      'Reviewed',    11,   '2026-04-22T10:00:00Z', '2026-04-15T14:30:00Z'),
    (9,  14, 'ForumPost', '40000000-0000-4000-8000-000000000022', 'Harassment',          'Received a comment on my cockatoo post that felt dismissive and unkind.',                  'Dismissed',   12,   '2026-04-23T09:00:00Z', '2026-04-16T18:00:00Z'),
    (10, 11, 'User',      '20',                                   'Scam',                'Someone posing as a breeder offering paid placements contacted me through this profile.',  'Pending',     NULL, NULL,                  '2026-04-18T10:00:00Z'),
    (11, 19, 'ForumPost', '40000000-0000-4000-8000-000000000014', 'Other',               'Post contained outdated care advice that could mislead new owners.',                       'Reviewed',    13,   '2026-04-24T11:00:00Z', '2026-04-20T09:30:00Z'),
    (12, 20, 'ForumPost', '40000000-0000-4000-8000-000000000023', 'InappropriateContent','The reply in this thread was condescending toward new pet owners asking basic questions.',  'ActionTaken', 11,   '2026-04-24T14:00:00Z', '2026-04-21T07:45:00Z');

-- Additional vaccine records (16–30)
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
    (16, '20000000-0000-4000-8000-000000000013', 'Bordetella',                           'Done',    '2026-01-15T10:00:00Z', '2027-01-15T10:00:00Z', 'Routine preventive for Coco administered after adoption placement.',                          'Dr. Sonia Hart',    '2026-01-15T10:20:00Z', '2026-01-15T10:20:00Z'),
    (17, '20000000-0000-4000-8000-000000000013', 'Lymphocytic Choriomeningitis',          'Due',     '2025-07-10T09:00:00Z', '2026-07-10T09:00:00Z', 'Annual booster reminder added to the care calendar.',                                        'Dr. Sonia Hart',    '2025-07-10T09:15:00Z', '2026-03-15T10:00:00Z'),
    (18, '20000000-0000-4000-8000-000000000014', 'IBD screening',                         'NotDone', NULL,                   NULL,                   'Inclusion Body Disease screening recommended but not yet completed; sourcing specialist.',    NULL,                '2026-03-20T09:40:00Z', '2026-03-20T09:40:00Z'),
    (19, '20000000-0000-4000-8000-000000000015', 'Rabies (chinchilla protocol)',           'NotDone', NULL,                   '2026-08-01T09:00:00Z', 'Vet confirmed the protocol differs by region; appointment pending.',                         NULL,                '2026-03-25T14:10:00Z', '2026-03-25T14:10:00Z'),
    (20, '20000000-0000-4000-8000-000000000016', 'Salmonella screening',                  'Done',    '2026-01-20T09:30:00Z', '2027-01-20T09:30:00Z', 'Routine screen for reptiles; results clear.',                                                'Dr. Aaron Price',   '2026-01-20T09:50:00Z', '2026-01-20T09:50:00Z'),
    (21, '20000000-0000-4000-8000-000000000016', 'Parasite prevention',                   'Due',     '2025-09-15T10:00:00Z', '2026-09-15T10:00:00Z', 'Annual anti-parasite round for Blaze.',                                                      'Dr. Aaron Price',   '2025-09-15T10:20:00Z', '2026-04-08T09:35:00Z'),
    (22, '20000000-0000-4000-8000-000000000017', 'Distemper (hedgehog protocol)',          'Done',    '2025-10-01T09:00:00Z', '2026-10-01T09:00:00Z', 'Completed with no post-vaccine reactions noted.',                                            'Dr. Elaine Brooks', '2025-10-01T09:20:00Z', '2025-10-01T09:20:00Z'),
    (23, '20000000-0000-4000-8000-000000000018', 'PBFD screening',                        'Done',    '2025-12-05T10:30:00Z', '2026-12-05T10:30:00Z', 'Psittacine Beak and Feather Disease test came back negative.',                               'Dr. Nina Patel',    '2025-12-05T10:50:00Z', '2025-12-05T10:50:00Z'),
    (24, '20000000-0000-4000-8000-000000000018', 'Polyomavirus',                          'Due',     '2025-06-20T09:00:00Z', '2026-06-20T09:00:00Z', 'Due mid-year; scheduling around the upcoming feather check.',                                'Dr. Nina Patel',    '2025-06-20T09:20:00Z', '2026-04-21T09:10:00Z'),
    (25, '20000000-0000-4000-8000-000000000019', 'FVRCP',                                 'Done',    '2025-05-12T10:00:00Z', '2026-05-12T10:00:00Z', 'Mittens was brought up to date at shelter intake.',                                          'Dr. Marcus Lee',    '2025-05-12T10:20:00Z', '2025-05-12T10:20:00Z'),
    (26, '20000000-0000-4000-8000-000000000019', 'Rabies',                                'Due',     '2025-05-12T10:05:00Z', '2026-05-12T10:05:00Z', 'Due date approaching; appointment being arranged through foster coordinator.',               'Dr. Marcus Lee',    '2025-05-12T10:25:00Z', '2026-04-03T10:40:00Z'),
    (27, '20000000-0000-4000-8000-000000000021', 'Tyzzer''s Disease prevention',          'NotDone', NULL,                   NULL,                   'Specific protocol varies; owner researching options with the exotics vet.',                  NULL,                '2026-04-07T09:25:00Z', '2026-04-07T09:25:00Z'),
    (28, '20000000-0000-4000-8000-000000000022', 'Chytrid screening',                     'Done',    '2026-02-10T11:00:00Z', '2027-02-10T11:00:00Z', 'Axolotl screened for chytrid fungus at the aquatics specialist clinic.',                     'Dr. Aaron Price',   '2026-02-10T11:20:00Z', '2026-02-10T11:20:00Z'),
    (29, '20000000-0000-4000-8000-000000000023', 'Bordetella',                            'Due',     '2025-11-22T09:00:00Z', '2026-11-22T09:00:00Z', 'Reminder set ahead of the upcoming first wellness visit.',                                   'Dr. Sonia Hart',    '2025-11-22T09:15:00Z', '2026-04-11T10:05:00Z'),
    (30, '20000000-0000-4000-8000-000000000024', 'Inclusion Body Disease screening',      'Done',    '2026-01-28T10:00:00Z', '2027-01-28T10:00:00Z', 'Screen came back negative; monitoring continues.',                                           'Dr. Elaine Brooks', '2026-01-28T10:20:00Z', '2026-01-28T10:20:00Z');

-- Additional illness records (11–20)
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
    (11, '20000000-0000-4000-8000-000000000013', 'Upper respiratory infection',      '2026-03-12T10:00:00Z', 'Resolved', 'Mild sneezing and discharge noticed after a new hay batch was introduced.',                     'Resolved after removing the new hay and adding a short antibiotic course.',    '2026-03-22T10:00:00Z', '2026-03-12T10:15:00Z', '2026-03-22T10:00:00Z'),
    (12, '20000000-0000-4000-8000-000000000014', 'Incomplete shedding (dysecdysis)', '2026-03-08T09:00:00Z', 'Resolved', 'Retained eye caps and tail-tip patches found after the last shed cycle.',                      'Resolved with a warm soak routine and careful manual removal.',                '2026-03-15T09:00:00Z', '2026-03-08T09:15:00Z', '2026-03-15T09:00:00Z'),
    (13, '20000000-0000-4000-8000-000000000015', 'Malocclusion',                     '2026-04-02T14:10:00Z', 'Ongoing',  'Teeth misalignment reducing Dusty''s ability to grind pellets normally.',                     'Dietary adjustments in place; scheduled for a dental trim at the next visit.', NULL,                   '2026-04-02T14:20:00Z', '2026-04-20T14:20:00Z'),
    (14, '20000000-0000-4000-8000-000000000016', 'Metabolic Bone Disease (early)',   '2026-04-08T09:40:00Z', 'Ongoing',  'Early indicators seen during wellness visit; UVB output had been too low.',                   'UVB bulb replaced and calcium dusting schedule increased.',                    NULL,                   '2026-04-08T09:50:00Z', '2026-04-20T09:50:00Z'),
    (15, '20000000-0000-4000-8000-000000000017', 'Hibernation attempt',              '2026-04-14T10:20:00Z', 'Resolved', 'Torpor-like state triggered by a room temperature drop overnight.',                           'Resolved after warming measures and a heating pad schedule was introduced.',   '2026-04-15T10:00:00Z', '2026-04-14T10:30:00Z', '2026-04-15T10:00:00Z'),
    (16, '20000000-0000-4000-8000-000000000018', 'Feather destructive behaviour',    '2026-04-06T09:00:00Z', 'Ongoing',  'Zeus began plucking feathers on his lower chest during understimulated afternoons.',           'Foraging schedule doubled and cage enrichment expanded significantly.',        NULL,                   '2026-04-06T09:10:00Z', '2026-04-21T09:10:00Z'),
    (17, '20000000-0000-4000-8000-000000000019', 'Ear infection',                    '2026-04-16T13:00:00Z', 'Ongoing',  'Mild otitis in Mittens''s right ear detected during a routine foster check-up.',              'Ear drops prescribed; re-check scheduled in two weeks.',                      NULL,                   '2026-04-16T13:15:00Z', '2026-04-20T13:15:00Z'),
    (18, '20000000-0000-4000-8000-000000000020', 'Swim bladder irregularity',        '2026-04-10T17:00:00Z', 'Resolved', 'Finn observed floating at an unusual angle after a rapid tank temperature drop.',              'Temperature stabilised; Finn returned to normal buoyancy within 48 hours.',   '2026-04-12T17:00:00Z', '2026-04-10T17:10:00Z', '2026-04-12T17:00:00Z'),
    (19, '20000000-0000-4000-8000-000000000021', 'Social stress behaviour',          '2026-04-10T09:00:00Z', 'Ongoing',  'Maple displaying excessive barbering of her bonded pair partner.',                            'Pair temporarily separated; reintroduction plan in progress with the vet.',   NULL,                   '2026-04-10T09:10:00Z', '2026-04-20T09:10:00Z'),
    (20, '20000000-0000-4000-8000-000000000022', 'Fungal gill infection',            '2026-03-20T10:00:00Z', 'Resolved', 'Axel presented with white patches on external gills.',                                        'Treated with a salt-bath protocol; gills fully recovered within three weeks.','2026-04-10T10:00:00Z', '2026-03-20T10:15:00Z', '2026-04-10T10:00:00Z');

-- Additional medication records (13–24)
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
    (13, 11, 'Trimethoprim-sulfamethoxazole', '0.1 mL',          'Administer orally twice daily for ten days.',                                              '2026-03-12T09:00:00Z', '2026-03-22T09:00:00Z', 1, ARRAY['09:00', '21:00']::text[], true,  false, '2026-03-12T09:00:00Z', '2026-03-22T09:00:00Z'),
    (14, 12, 'Warm soak solution',            '1 tsp/litre',      'Soak for fifteen minutes; gently assist with any retained patches after soaking.',        '2026-03-08T19:00:00Z', '2026-03-15T19:00:00Z', 1, ARRAY['19:00']::text[],         false, false, '2026-03-08T19:00:00Z', '2026-03-15T19:00:00Z'),
    (15, 13, 'High-fibre critical feed',      '5 mL',             'Syringe-feed twice daily alongside softened pellets.',                                     '2026-04-02T08:00:00Z', NULL,                   1, ARRAY['08:00', '20:00']::text[], true,  true,  '2026-04-02T08:00:00Z', '2026-04-20T14:25:00Z'),
    (16, 14, 'Calcium gluconate dusting',     '0.2 g per feed',   'Dust feeder insects before every feeding session.',                                       '2026-04-08T10:00:00Z', NULL,                   1, ARRAY['10:00']::text[],         false, true,  '2026-04-08T10:00:00Z', '2026-04-20T09:55:00Z'),
    (17, 14, 'UVB bulb upgrade',              'N/A',              'Run new bulb on a 12-hour day cycle; use ceramic heat emitter overnight.',                '2026-04-08T10:00:00Z', NULL,                   1, ARRAY['07:00']::text[],         true,  true,  '2026-04-08T10:00:00Z', '2026-04-20T09:56:00Z'),
    (18, 15, 'Spot temperature correction',   'N/A',              'Set ceramic heat emitter thermostat to maintain floor temperature above 22°C.',           '2026-04-14T21:00:00Z', '2026-04-15T09:00:00Z', 1, ARRAY['21:00']::text[],         false, false, '2026-04-14T21:00:00Z', '2026-04-15T09:00:00Z'),
    (19, 16, 'Foraging enrichment protocol',  'N/A',              'Hide three foraging stations per session; run morning and afternoon sessions daily.',     '2026-04-06T07:00:00Z', NULL,                   1, ARRAY['07:00', '15:00']::text[], true,  true,  '2026-04-06T07:00:00Z', '2026-04-21T09:15:00Z'),
    (20, 17, 'Otibiotic ear drops',           '3 drops',          'Apply to the affected ear canal twice daily; avoid excess head-shaking after dosing.',   '2026-04-16T08:00:00Z', NULL,                   1, ARRAY['08:00', '20:00']::text[], true,  true,  '2026-04-16T08:00:00Z', '2026-04-20T13:20:00Z'),
    (21, 18, 'Temperature stabiliser',        'N/A',              'Maintain tank heater within 18–20°C; check thermometer twice daily during recovery.',    '2026-04-10T18:00:00Z', '2026-04-12T18:00:00Z', 1, ARRAY['09:00', '18:00']::text[], false, false, '2026-04-10T18:00:00Z', '2026-04-12T17:00:00Z'),
    (22, 19, 'Separation and reintroduction', 'N/A',              'Keep pair in adjacent but separate enclosures; allow five-minute supervised contact daily.','2026-04-10T09:00:00Z', NULL,                  1, ARRAY['17:00']::text[],         true,  true,  '2026-04-10T09:00:00Z', '2026-04-20T09:15:00Z'),
    (23, 20, 'Aquarium salt bath',            '1 tsp/gal',        'Prepare a hospital tank with salt solution; soak axolotl for 10 minutes twice daily.',   '2026-03-20T10:00:00Z', '2026-04-10T10:00:00Z', 1, ARRAY['10:00', '22:00']::text[], false, false, '2026-03-20T10:00:00Z', '2026-04-10T10:00:00Z'),
    (24, 20, 'Methylene blue rinse',          '1 drop/gal',       'Add to the soak water during the second week to accelerate gill recovery.',               '2026-03-27T10:00:00Z', '2026-04-10T10:00:00Z', 1, ARRAY['10:00']::text[],         false, false, '2026-03-27T10:00:00Z', '2026-04-10T10:00:00Z');

-- Additional admin action logs (17–32)
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
    (17, 11, 'AdminLogin',                   'AdminUser',             '11',                                   'Admin ''carlos.khoury'' logged in.',                                                                             NULL,                                                          '2026-04-22T09:00:00Z'),
    (18, 12, 'AdminLogin',                   'AdminUser',             '12',                                   'Admin ''sara.nassar'' logged in.',                                                                               NULL,                                                          '2026-04-22T09:10:00Z'),
    (19, 12, 'ApprovePlaceOwnerApplication', 'PlaceOwnerApplication', '6',                                    'Approved Nadia Khalil''s charity application for Paws for Hope Animal Charity.',                                'Charity registration verified.',                              '2026-03-15T10:00:00Z'),
    (20, 11, 'ApprovePlaceOwnerApplication', 'PlaceOwnerApplication', '7',                                    'Approved Lara Younes''s charity application for Furry Friends Foundation.',                                     'Non-profit documents verified.',                              '2026-03-28T14:30:00Z'),
    (21, 14, 'ApprovePlaceOwnerApplication', 'PlaceOwnerApplication', '8',                                    'Approved Hana Tabbara''s application for Urban Pets Boutique.',                                                 'Business documents and certifications confirmed.',            '2026-04-05T09:30:00Z'),
    (22, 15, 'ApprovePlaceOwnerApplication', 'PlaceOwnerApplication', '9',                                    'Approved Samer Barakat''s charity application for Hearts & Paws Charity.',                                      'State charity registration confirmed.',                       '2026-04-12T11:30:00Z'),
    (23, 11, 'ReviewUserProfile',            'User',                  '16',                                   'Reviewed Tarek Mansour''s profile as part of the pending parrot rescue application review.',                    'Routine applicant background check.',                         '2026-04-25T10:00:00Z'),
    (24, 13, 'UpdatePetPlace',               'PetPlace',              '10000000-0000-4000-8000-000000000011', 'Updated Paws for Hope Animal Charity listing with corrected contact email.',                                    'Applicant reported a typo in the original submission.',       '2026-04-22T10:30:00Z'),
    (25, 16, 'ReviewForumPost',              'ForumPost',             '40000000-0000-4000-8000-000000000022', 'Reviewed cockatoo screaming thread following a harassment report and left it visible.',                         'No policy violation found after full thread review.',         '2026-04-23T09:05:00Z'),
    (26, 12, 'ResolveReport',                'Report',                '9',                                    'Dismissed report #9 against the cockatoo thread; content was safe.',                                            'Post was critical but not harassing.',                        '2026-04-23T09:10:00Z'),
    (27, 11, 'ReviewUserProfile',            'User',                  '20',                                   'Flagged user ''hassan.ibrahim'' for a potential scam report; account under review.',                            'Scam report #10 filed against this user.',                    '2026-04-18T11:00:00Z'),
    (28, 18, 'CreateSpecies',                'Species',               '11',                                   'Created species ''Guinea Pig'' with code ''guinea_pig''.',                                                       'Seed dataset coverage for small mammals.',                    '2026-04-22T10:00:00Z'),
    (29, 18, 'CreateBreed',                  'Breed',                 '35',                                   'Created breed ''American Guinea Pig'' for the guinea pig species.',                                              'Seed dataset coverage for small mammals.',                    '2026-04-22T10:01:00Z'),
    (30, 19, 'UpdatePetPlace',               'PetPlace',              '10000000-0000-4000-8000-000000000020', 'Confirmed inactive status for The Cat Lounge pending licence renewal.',                                         'Licensing pause pending renewal review.',                     '2026-04-22T11:00:00Z'),
    (31, 14, 'ReviewForumPost',              'ForumPost',             '40000000-0000-4000-8000-000000000014', 'Reviewed forum post flagged in report #11 and confirmed advice accuracy with the vet team.',                    'Outdated care advice corrected via a follow-up post.',        '2026-04-24T11:05:00Z'),
    (32, 11, 'ResolveReport',                'Report',                '12',                                   'Resolved report #12; deleted the condescending reply and issued a warning to the author.',                      'Policy violation confirmed: dismissive tone toward new users.','2026-04-24T14:05:00Z');

-- Restrict app-supported taxonomy to cats and dogs only.
-- Cascades cleanly remove dependent consultations, vaccine records,
-- illness records, and medication records for unsupported pets.
DELETE FROM public.pets
WHERE species_id NOT IN (1, 2);

DELETE FROM public.breeds
WHERE species_id NOT IN (1, 2);

DELETE FROM public.species
WHERE id NOT IN (1, 2);

SELECT setval(pg_get_serial_sequence('public.users', 'id'), (SELECT MAX(id) FROM public.users), true);
SELECT setval(pg_get_serial_sequence('public.admin_users', 'id'), (SELECT MAX(id) FROM public.admin_users), true);
SELECT setval(pg_get_serial_sequence('public.admin_action_logs', 'id'), (SELECT MAX(id) FROM public.admin_action_logs), true);
SELECT setval(pg_get_serial_sequence('public.species', 'id'), (SELECT MAX(id) FROM public.species), true);
SELECT setval(pg_get_serial_sequence('public.breeds', 'id'), (SELECT MAX(id) FROM public.breeds), true);
SELECT setval(pg_get_serial_sequence('public.conversations', 'id'), (SELECT MAX(id) FROM public.conversations), true);
SELECT setval(pg_get_serial_sequence('public.direct_messages', 'id'), (SELECT MAX(id) FROM public.direct_messages), true);
SELECT setval(pg_get_serial_sequence('public.pet_place_images', 'id'), (SELECT MAX(id) FROM public.pet_place_images), true);
SELECT setval(pg_get_serial_sequence('public.pet_place_schedules', 'id'), (SELECT MAX(id) FROM public.pet_place_schedules), true);
SELECT setval(pg_get_serial_sequence('public.place_owner_applications', 'id'), (SELECT MAX(id) FROM public.place_owner_applications), true);
SELECT setval(pg_get_serial_sequence('public.place_owner_application_images', 'id'), (SELECT MAX(id) FROM public.place_owner_application_images), true);
SELECT setval(pg_get_serial_sequence('public.consultations', 'id'), (SELECT MAX(id) FROM public.consultations), true);
SELECT setval(pg_get_serial_sequence('public.forum_post_attachments', 'id'), (SELECT MAX(id) FROM public.forum_post_attachments), true);
SELECT setval(pg_get_serial_sequence('public.reports', 'id'), (SELECT MAX(id) FROM public.reports), true);
SELECT setval(pg_get_serial_sequence('public.vaccine_records', 'id'), (SELECT MAX(id) FROM public.vaccine_records), true);
SELECT setval(pg_get_serial_sequence('public.illness_records', 'id'), (SELECT MAX(id) FROM public.illness_records), true);
SELECT setval(pg_get_serial_sequence('public.medication_records', 'id'), (SELECT MAX(id) FROM public.medication_records), true);

COMMIT;

-- PetCare backend dummy seed data for PostgreSQL
-- Assumes the schema from create_schema.sql already exists.
--
-- Run with:
--   psql -h 127.0.0.1 -U petapp -d petapp -f PetCare.Api/PetCare.Api/sql/seed_dummy_data.sql
--
-- Test users created by this script:
--   email: sarah@example.com   password: PetCare123!
--   email: omar@example.com    password: PetCare123!
--   email: maya@example.com    password: PetCare123!
--   email: jad@example.com     password: PetCare123!

BEGIN;

-- Shared PBKDF2 hash for password: PetCare123!
-- PBKDF2$100000$ABEiM0RVZneImaq7zN3u/w==$KroxdWT7IvrShuABUvHjXpy/NsrR9uzkxF9XROF/MSs=

INSERT INTO public.species (id, code, name) VALUES
    (1, 'dog', 'Dog'),
    (2, 'cat', 'Cat')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.breeds (id, species_id, name) VALUES
    (1, 1, 'Golden Retriever'),
    (2, 1, 'German Shepherd'),
    (3, 1, 'Mixed Breed'),
    (7, 1, 'Labrador Retriever'),
    (4, 2, 'Persian'),
    (5, 2, 'Siamese'),
    (6, 2, 'Calico'),
    (8, 2, 'Maine Coon')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (
    id,
    username,
    name,
    first_name,
    last_name,
    email,
    phone_number,
    password_hash,
    email_verified,
    avatar_url,
    description,
    created_at,
    last_login
) VALUES
    (
        1,
        'sarahm',
        'Sarah Mansour',
        'Sarah',
        'Mansour',
        'sarah@example.com',
        '+96170000001',
        'PBKDF2$100000$ABEiM0RVZneImaq7zN3u/w==$KroxdWT7IvrShuABUvHjXpy/NsrR9uzkxF9XROF/MSs=',
        TRUE,
        '/uploads/users/sarah.jpg',
        'Cat mom and frequent forum contributor.',
        '2026-01-10T08:00:00Z',
        '2026-04-14T18:30:00Z'
    ),
    (
        2,
        'omark',
        'Omar Khalil',
        'Omar',
        'Khalil',
        'omar@example.com',
        '+96170000002',
        'PBKDF2$100000$ABEiM0RVZneImaq7zN3u/w==$KroxdWT7IvrShuABUvHjXpy/NsrR9uzkxF9XROF/MSs=',
        TRUE,
        '/uploads/users/omar.jpg',
        'Dog owner who uses the consultation and vaccine features.',
        '2026-01-15T10:15:00Z',
        '2026-04-13T09:00:00Z'
    ),
    (
        3,
        'mayaa',
        'Maya Azar',
        'Maya',
        'Azar',
        'maya@example.com',
        '+96170000003',
        'PBKDF2$100000$ABEiM0RVZneImaq7zN3u/w==$KroxdWT7IvrShuABUvHjXpy/NsrR9uzkxF9XROF/MSs=',
        TRUE,
        NULL,
        'Keeps detailed medication schedules for rescue pets.',
        '2026-02-01T07:45:00Z',
        NULL
    ),
    (
        4,
        'jadn',
        'Jad Nader',
        'Jad',
        'Nader',
        'jad@example.com',
        '+96170000004',
        'PBKDF2$100000$ABEiM0RVZneImaq7zN3u/w==$KroxdWT7IvrShuABUvHjXpy/NsrR9uzkxF9XROF/MSs=',
        TRUE,
        '/uploads/users/jad.jpg',
        NULL,
        '2026-02-20T12:10:00Z',
        '2026-04-12T07:20:00Z'
    )
ON CONFLICT (id) DO NOTHING;

UPDATE public.users
SET email_verified = TRUE
WHERE email IN (
    'sarah@example.com',
    'omar@example.com',
    'maya@example.com',
    'jad@example.com'
);

INSERT INTO public.pet_places (
    id,
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
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'Happy Tails Veterinary Clinic',
        '+9611111111',
        'hello@happytailsvet.com',
        '/uploads/places/happy-tails.jpg',
        'Full-service veterinary clinic for checkups and vaccinations.',
        'Main Street 12',
        NULL,
        'Beirut',
        'Lebanon',
        'Active',
        'Vet',
        33.893800,
        35.501800,
        '2026-01-05T09:00:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Paws and Claws Pet Shop',
        '+9611222222',
        'contact@pawsclaws.com',
        '/uploads/places/paws-claws.jpg',
        'Pet supplies, food, and grooming accessories.',
        'Market Road 8',
        'Ground Floor',
        'Jounieh',
        'Lebanon',
        'Active',
        'PetShop',
        33.981100,
        35.617500,
        '2026-01-06T10:30:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'North Shelter Partner',
        '+9611333333',
        'info@northshelter.org',
        NULL,
        'Community partner location for adoption days and rescues.',
        'Harbor Avenue 3',
        NULL,
        'Tripoli',
        'Lebanon',
        'Inactive',
        'Other',
        34.436700,
        35.849700,
        '2026-01-07T11:00:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'Cedars Emergency Vet',
        '+9611444444',
        'urgent@cedarsvet.com',
        '/uploads/places/cedars-emergency.jpg',
        'Emergency clinic available for overnight and urgent care.',
        'Hospital District 2',
        'Building B',
        'Byblos',
        'Lebanon',
        'Closed',
        'Vet',
        34.123400,
        35.648900,
        '2026-01-10T18:00:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'Whisker Corner Boutique',
        '+9611555555',
        'hello@whiskercorner.com',
        NULL,
        'Small boutique specializing in cat toys and grooming tools.',
        'Lake View Center',
        'Unit 5',
        'Zahle',
        'Lebanon',
        'Active',
        'PetShop',
        NULL,
        NULL,
        '2026-01-15T13:00:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        'Rescue Outreach Hub',
        '+9611666666',
        'team@rescuehub.org',
        '/uploads/places/rescue-hub.jpg',
        NULL,
        'Seaside Road 19',
        NULL,
        'Sidon',
        'Lebanon',
        'Active',
        'Other',
        33.562800,
        35.368700,
        '2026-01-18T09:30:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000007',
        'BETA',
        '+96167676767',
        'beta@hazmieh.org',
        '/uploads/places/rescue-hub.jpg',
        NULL,
        'Hazmieh',
        NULL,
        'Beirut',
        'Lebanon',
        'Active',
        'Other',
        33.562800,
        35.368700,
        '2026-01-18T09:30:00Z'
    )
ON CONFLICT (id) DO NOTHING;

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
) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        1,
        'Luna',
        2,
        5,
        'female',
        '2023-06-14T00:00:00Z',
        4.20,
        'White',
        true,
        '/uploads/pets/luna.jpg',
        'Indoor cat, playful, and mildly picky with food.',
        '2026-01-12T08:00:00Z',
        '2026-04-10T17:00:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        2,
        'Max',
        1,
        1,
        'male',
        '2022-03-01T00:00:00Z',
        28.50,
        'Orange',
        false,
        '/uploads/pets/max.jpg',
        'Friendly dog, responds well to treats during vet visits.',
        '2026-01-20T09:30:00Z',
        '2026-04-11T08:15:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        2,
        'Bella',
        1,
        7,
        'female',
        '2020-08-17T00:00:00Z',
        24.30,
        'White',
        true,
        '/uploads/pets/bella.jpg',
        'Calm family dog with a history of seasonal allergies.',
        '2026-02-01T14:00:00Z',
        '2026-04-09T12:00:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        3,
        'Shadow',
        1,
        2,
        'male',
        '2021-11-20T00:00:00Z',
        34.80,
        'Black',
        true,
        '/uploads/pets/shadow.jpg',
        NULL,
        '2026-02-05T07:00:00Z',
        '2026-04-14T06:45:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000005',
        3,
        'Mochi',
        2,
        NULL,
        'female',
        NULL,
        NULL,
        'Calico',
        false,
        NULL,
        'Recently adopted rescue cat. Approximate age unknown.',
        '2026-02-10T10:20:00Z',
        '2026-04-12T15:00:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000006',
        4,
        'Nala',
        2,
        8,
        'female',
        '2022-12-05T00:00:00Z',
        5.80,
        'Black',
        true,
        '/uploads/pets/nala.jpg',
        'Long-haired cat that needs regular grooming and routine checkups.',
        '2026-03-01T11:00:00Z',
        '2026-04-10T09:15:00Z'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chat_sessions (id, user_id, created_at, updated_at) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        1,
        '2026-04-12T08:00:00Z',
        '2026-04-12T08:03:00Z'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        2,
        '2026-04-13T10:00:00Z',
        '2026-04-13T10:05:00Z'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        3,
        '2026-04-14T06:30:00Z',
        '2026-04-14T06:36:00Z'
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        4,
        '2026-04-14T20:10:00Z',
        '2026-04-14T20:12:00Z'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chat_messages (
    id,
    chat_session_id,
    role,
    content,
    created_at
) VALUES
    (
        1,
        '30000000-0000-0000-0000-000000000001',
        'User',
        'Luna has been scratching the couch more than usual. Any ideas?',
        '2026-04-12T08:00:00Z'
    ),
    (
        2,
        '30000000-0000-0000-0000-000000000001',
        'Bot',
        'It may help to provide a scratching post and monitor for stress or skin irritation.',
        '2026-04-12T08:01:00Z'
    ),
    (
        3,
        '30000000-0000-0000-0000-000000000001',
        'User',
        'Thanks, I will try moving one next to her bed.',
        '2026-04-12T08:03:00Z'
    ),
    (
        4,
        '30000000-0000-0000-0000-000000000002',
        'User',
        'When should Max get his next booster shot?',
        '2026-04-13T10:00:00Z'
    ),
    (
        5,
        '30000000-0000-0000-0000-000000000002',
        'Bot',
        'Check the vaccine records section and confirm the due date with your vet if needed.',
        '2026-04-13T10:01:00Z'
    ),
    (
        6,
        '30000000-0000-0000-0000-000000000003',
        'User',
        'Shadow is taking two medications. How can I keep the reminders organized?',
        '2026-04-14T06:30:00Z'
    ),
    (
        7,
        '30000000-0000-0000-0000-000000000003',
        'Bot',
        'Set different times for each medication and mark doses as taken after each reminder.',
        '2026-04-14T06:31:00Z'
    ),
    (
        8,
        '30000000-0000-0000-0000-000000000003',
        'User',
        'Great, I also need to monitor whether he should skip doses after meals.',
        '2026-04-14T06:36:00Z'
    ),
    (
        9,
        '30000000-0000-0000-0000-000000000004',
        'User',
        'Nala sheds a lot this week. Should I worry or just brush more often?',
        '2026-04-14T20:10:00Z'
    ),
    (
        10,
        '30000000-0000-0000-0000-000000000004',
        'Bot',
        'Seasonal shedding can be normal, but watch for bald patches or skin irritation and consult a vet if those appear.',
        '2026-04-14T20:12:00Z'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forum_posts (
    id,
    user_id,
    content,
    is_a_reply,
    replying_to_post,
    created_at,
    updated_at
) VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        1,
        'Does anyone have tips for introducing a new scratching post to an indoor cat?',
        false,
        NULL,
        '2026-04-10T12:00:00Z',
        '2026-04-10T12:00:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        2,
        'Max had a great checkup today. Sharing a reminder to keep vaccine records updated.',
        false,
        NULL,
        '2026-04-11T09:30:00Z',
        '2026-04-11T09:30:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        2,
        'Try placing the scratching post near Luna''s favorite resting spot and rewarding her when she uses it.',
        true,
        '40000000-0000-0000-0000-000000000001',
        '2026-04-11T10:00:00Z',
        '2026-04-11T10:00:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000004',
        3,
        'For pets on multiple meds, I use color-coded reminders and separate morning/evening notes.',
        false,
        NULL,
        '2026-04-12T07:10:00Z',
        '2026-04-12T07:10:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000005',
        4,
        'Any tips for keeping long-haired cats from getting mats during shedding season?',
        false,
        NULL,
        '2026-04-12T17:45:00Z',
        '2026-04-13T08:20:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000006',
        1,
        'We tried catnip on the post and it helped a lot. Luna is finally using it.',
        true,
        '40000000-0000-0000-0000-000000000001',
        '2026-04-13T09:15:00Z',
        '2026-04-13T09:15:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000007',
        3,
        'If you are tracking vaccine due dates, add the next appointment immediately after the visit while it is fresh.',
        false,
        NULL,
        '2026-04-14T11:05:00Z',
        '2026-04-14T11:05:00Z'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forum_post_attachments (
    id,
    forum_post_id,
    url,
    created_at
) VALUES
    (
        1,
        '40000000-0000-0000-0000-000000000001',
        '/uploads/forum/luna-scratching-post.jpg',
        '2026-04-10T12:01:00Z'
    ),
    (
        2,
        '40000000-0000-0000-0000-000000000002',
        '/uploads/forum/max-checkup-card.jpg',
        '2026-04-11T09:31:00Z'
    ),
    (
        3,
        '40000000-0000-0000-0000-000000000004',
        '/uploads/forum/medication-board.png',
        '2026-04-12T07:11:00Z'
    ),
    (
        4,
        '40000000-0000-0000-0000-000000000005',
        '/uploads/forum/nala-grooming.jpg',
        '2026-04-12T17:46:00Z'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forum_post_bookmarks (
    user_id,
    forum_post_id,
    created_at
) VALUES
    (1, '40000000-0000-0000-0000-000000000002', '2026-04-11T12:15:00Z'),
    (1, '40000000-0000-0000-0000-000000000004', '2026-04-14T08:10:00Z'),
    (2, '40000000-0000-0000-0000-000000000001', '2026-04-11T12:20:00Z'),
    (2, '40000000-0000-0000-0000-000000000007', '2026-04-14T11:10:00Z'),
    (3, '40000000-0000-0000-0000-000000000002', '2026-04-12T15:45:00Z'),
    (4, '40000000-0000-0000-0000-000000000005', '2026-04-13T08:30:00Z')
ON CONFLICT (user_id, forum_post_id) DO NOTHING;

INSERT INTO public.consultations (
    id,
    user_id,
    pet_id,
    vet_place_id,
    date,
    details,
    created_at,
    updated_at
) VALUES
    (
        1,
        1,
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '2026-03-20T09:00:00Z',
        'Routine wellness exam. Vet recommended more enrichment and hydration monitoring.',
        '2026-03-18T08:00:00Z',
        '2026-03-20T10:00:00Z'
    ),
    (
        2,
        2,
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        '2026-04-25T14:30:00Z',
        'Scheduled annual booster consultation for Max.',
        '2026-04-10T11:00:00Z',
        '2026-04-10T11:00:00Z'
    ),
    (
        3,
        3,
        '20000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000004',
        '2026-04-02T21:15:00Z',
        'Emergency visit for stomach irritation. Medication and bland diet prescribed.',
        '2026-04-02T20:50:00Z',
        '2026-04-03T07:30:00Z'
    ),
    (
        4,
        3,
        '20000000-0000-0000-0000-000000000005',
        NULL,
        '2026-04-18T16:00:00Z',
        'Follow-up consultation scheduled but clinic not assigned yet.',
        '2026-04-14T13:00:00Z',
        NULL
    ),
    (
        5,
        4,
        '20000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000001',
        '2026-03-28T09:45:00Z',
        'Grooming-related consultation for coat maintenance and skin check.',
        '2026-03-25T10:00:00Z',
        '2026-03-28T10:20:00Z'
    )
ON CONFLICT (id) DO NOTHING;

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
) VALUES
    (
        1,
        '20000000-0000-0000-0000-000000000001',
        'Seasonal Skin Irritation',
        '2026-03-05T10:00:00Z',
        'Resolved',
        'Mild irritation around the neck area with occasional scratching.',
        'Resolved after short treatment and cone use.',
        '2026-03-18T12:00:00Z',
        '2026-03-05T10:30:00Z',
        '2026-03-18T12:00:00Z'
    ),
    (
        2,
        '20000000-0000-0000-0000-000000000002',
        'Ear Infection',
        '2026-04-08T16:00:00Z',
        'Ongoing',
        'Right ear infection being treated with a cleaning routine and medication.',
        'Follow-up check needed if symptoms persist after 10 days.',
        NULL,
        '2026-04-08T16:15:00Z',
        '2026-04-12T09:00:00Z'
    ),
    (
        3,
        '20000000-0000-0000-0000-000000000004',
        'Digestive Sensitivity',
        '2026-04-02T21:10:00Z',
        'Ongoing',
        'Likely triggered by sudden diet change after rescue intake.',
        NULL,
        NULL,
        '2026-04-02T21:20:00Z',
        '2026-04-14T06:40:00Z'
    ),
    (
        4,
        '20000000-0000-0000-0000-000000000005',
        'Minor Paw Injury',
        '2026-02-14T10:00:00Z',
        'Resolved',
        NULL,
        'Healed quickly after cleaning and short indoor rest.',
        '2026-02-20T18:00:00Z',
        '2026-02-14T10:10:00Z',
        '2026-02-20T18:00:00Z'
    ),
    (
        5,
        '20000000-0000-0000-0000-000000000006',
        'Hairball Irritation',
        '2026-03-28T10:00:00Z',
        'Ongoing',
        'Mild digestive irritation associated with frequent hairballs during shedding season.',
        'Improving with grooming and diet support.',
        NULL,
        '2026-03-28T10:10:00Z',
        '2026-04-11T08:30:00Z'
    )
ON CONFLICT (id) DO NOTHING;

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
) VALUES
    (
        1,
        '20000000-0000-0000-0000-000000000001',
        'Rabies',
        'Done',
        '2026-02-15T10:00:00Z',
        '2027-02-15T10:00:00Z',
        'No side effects observed.',
        'Dr. Mira Haddad',
        '2026-02-15T10:30:00Z',
        '2026-02-15T10:30:00Z'
    ),
    (
        2,
        '20000000-0000-0000-0000-000000000002',
        'DHPP Booster',
        'Due',
        '2025-04-25T09:00:00Z',
        '2026-04-25T09:00:00Z',
        'Reminder enabled for upcoming appointment.',
        'Dr. Mira Haddad',
        '2025-04-25T09:15:00Z',
        '2026-04-10T11:05:00Z'
    ),
    (
        3,
        '20000000-0000-0000-0000-000000000003',
        'Kennel Cough Booster',
        'Done',
        '2026-01-20T08:00:00Z',
        '2027-01-20T08:00:00Z',
        'Given before boarding season.',
        'Dr. Youssef Barakat',
        '2026-01-20T08:15:00Z',
        '2026-01-20T08:15:00Z'
    ),
    (
        4,
        '20000000-0000-0000-0000-000000000004',
        'Rabies Booster',
        'Done',
        '2026-01-12T11:00:00Z',
        '2027-01-12T11:00:00Z',
        NULL,
        'Dr. Youssef Barakat',
        '2026-01-12T11:10:00Z',
        '2026-01-12T11:10:00Z'
    ),
    (
        5,
        '20000000-0000-0000-0000-000000000005',
        'FVRCP',
        'Due',
        '2025-10-01T09:30:00Z',
        '2026-05-01T09:30:00Z',
        'Rescue follow-up planned after adoption records were consolidated.',
        'Dr. Rana Choueiri',
        '2025-10-01T09:45:00Z',
        '2026-04-14T12:15:00Z'
    ),
    (
        6,
        '20000000-0000-0000-0000-000000000006',
        'Feline Leukemia',
        'NotDone',
        NULL,
        '2026-06-10T10:00:00Z',
        'Pending indoor/outdoor risk discussion at the next visit.',
        'Dr. Rana Choueiri',
        '2026-03-28T10:30:00Z',
        '2026-03-28T10:30:00Z'
    )
ON CONFLICT (id) DO NOTHING;

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
) VALUES
    (
        1,
        1,
        'Topical Ointment',
        'Apply thin layer',
        'Apply gently to the affected area after cleaning.',
        '2026-03-05T11:00:00Z',
        '2026-03-15T11:00:00Z',
        1,
        ARRAY['09:00', '21:00'],
        true,
        false,
        '2026-03-05T11:00:00Z',
        '2026-03-18T12:00:00Z'
    ),
    (
        2,
        2,
        'Oticlean Drops',
        '5 drops',
        'Clean ear first, then apply drops and massage gently.',
        '2026-04-08T18:00:00Z',
        '2026-04-18T18:00:00Z',
        1,
        ARRAY['08:00', '20:00'],
        true,
        true,
        '2026-04-08T18:00:00Z',
        '2026-04-12T09:00:00Z'
    ),
    (
        3,
        2,
        'Anti-inflammatory Tablet',
        '1 tablet',
        'Give with food every other day for one week.',
        '2026-04-09T08:00:00Z',
        '2026-04-16T08:00:00Z',
        2,
        ARRAY['08:00'],
        true,
        true,
        '2026-04-09T08:00:00Z',
        '2026-04-12T09:00:00Z'
    ),
    (
        4,
        3,
        'Digestive Support Powder',
        '1 sachet',
        'Mix with breakfast only.',
        '2026-04-03T07:00:00Z',
        NULL,
        1,
        ARRAY['07:00'],
        true,
        true,
        '2026-04-03T07:00:00Z',
        '2026-04-14T06:35:00Z'
    ),
    (
        5,
        3,
        'Probiotic Capsules',
        NULL,
        'Open capsule and sprinkle half over evening meal.',
        '2026-04-03T19:00:00Z',
        '2026-04-17T19:00:00Z',
        1,
        ARRAY['19:00'],
        false,
        true,
        '2026-04-03T19:00:00Z',
        '2026-04-10T07:00:00Z'
    ),
    (
        6,
        4,
        'Antiseptic Spray',
        '2 sprays',
        NULL,
        '2026-02-14T10:30:00Z',
        '2026-02-19T10:30:00Z',
        1,
        ARRAY['10:30'],
        false,
        false,
        '2026-02-14T10:30:00Z',
        '2026-02-20T18:00:00Z'
    ),
    (
        7,
        5,
        'Hairball Gel',
        '2 cm strip',
        'Administer after evening brushing sessions.',
        '2026-03-29T17:30:00Z',
        NULL,
        1,
        ARRAY['17:30'],
        true,
        true,
        '2026-03-29T17:30:00Z',
        '2026-04-11T08:30:00Z'
    )
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.species', 'id'), COALESCE((SELECT MAX(id) FROM public.species), 1), true);
SELECT setval(pg_get_serial_sequence('public.breeds', 'id'), COALESCE((SELECT MAX(id) FROM public.breeds), 1), true);
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 1), true);
SELECT setval(pg_get_serial_sequence('public.chat_messages', 'id'), COALESCE((SELECT MAX(id) FROM public.chat_messages), 1), true);
SELECT setval(pg_get_serial_sequence('public.forum_post_attachments', 'id'), COALESCE((SELECT MAX(id) FROM public.forum_post_attachments), 1), true);
SELECT setval(pg_get_serial_sequence('public.consultations', 'id'), COALESCE((SELECT MAX(id) FROM public.consultations), 1), true);
SELECT setval(pg_get_serial_sequence('public.illness_records', 'id'), COALESCE((SELECT MAX(id) FROM public.illness_records), 1), true);
SELECT setval(pg_get_serial_sequence('public.vaccine_records', 'id'), COALESCE((SELECT MAX(id) FROM public.vaccine_records), 1), true);
SELECT setval(pg_get_serial_sequence('public.medication_records', 'id'), COALESCE((SELECT MAX(id) FROM public.medication_records), 1), true);

COMMIT;

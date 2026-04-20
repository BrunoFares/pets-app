-- Inserts a verified local account for Bruno and removes the two requested emails first.
-- Warning: deleting users will cascade to their pets, posts, chats, and related data.
--
-- Run with:
--   psql -h 127.0.0.1 -U brunofares -d petapp -f PetCare.Api/PetCare.Api/sql/upsert_brunofares_account.sql

BEGIN;

DELETE FROM public.users
WHERE email IN (
    'faresbruno04@gmail.com',
    'bruno@fares.com'
);

INSERT INTO public.users (
    username,
    name,
    first_name,
    last_name,
    email,
    phone_number,
    password_hash,
    email_verified,
    email_verification_token_hash,
    email_verification_token_expires_at,
    avatar_url,
    description,
    created_at,
    last_login
) VALUES (
    'brunofares',
    'brunof',
    'bruno',
    'fares',
    'faresbruno04@gmail.com',
    '+96176315109',
    'PBKDF2$100000$OlZ/TR5wOP9KELrgamXlyw==$4mA8HnbRhGTx4l+nulG24+KWvi8YI2qAzlgPKW9150Q=',
    TRUE,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NULL
)
RETURNING id, username, email, email_verified;

COMMIT;

-- Grants runtime access to the PetCare API role on an existing petapp database.
-- Run this as the table owner or a PostgreSQL superuser.
--
-- Example:
--   psql -h 127.0.0.1 -U postgres -d petapp -f PetCare.Api/PetCare.Api/sql/grant_petapp_permissions.sql

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'petapp'
    ) THEN
        GRANT USAGE ON SCHEMA public TO petapp;
        GRANT USAGE ON TYPE public.pet_sex TO petapp;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO petapp;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO petapp;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO petapp;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT USAGE, SELECT ON SEQUENCES TO petapp;
    ELSE
        RAISE NOTICE 'Role "petapp" does not exist. Skipping grants.';
    END IF;
END $$;

COMMIT;

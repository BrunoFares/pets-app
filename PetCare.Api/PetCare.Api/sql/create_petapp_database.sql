\set ON_ERROR_STOP on

-- Creates the PostgreSQL login role and application database used by PetCare.
-- Run this as a PostgreSQL superuser, or another role that can create roles
-- and databases.
--
-- The created runtime role password is:
--   petapp / PetAppDb!2026
--
-- Example:
--   psql -h 127.0.0.1 -U postgres -d postgres -f sql/create_petapp_database.sql

SELECT 'CREATE ROLE petapp LOGIN PASSWORD ''PetAppDb!2026'''
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'petapp'
) \gexec

ALTER ROLE petapp WITH LOGIN PASSWORD 'PetAppDb!2026';

SELECT 'CREATE DATABASE petapp OWNER petapp ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_database
    WHERE datname = 'petapp'
) \gexec

ALTER DATABASE petapp OWNER TO petapp;

\connect petapp

GRANT ALL PRIVILEGES ON DATABASE petapp TO petapp;
GRANT USAGE, CREATE ON SCHEMA public TO petapp;

COMMENT ON DATABASE petapp IS 'PetCare application database';

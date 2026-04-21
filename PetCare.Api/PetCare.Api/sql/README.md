This folder contains PostgreSQL helper scripts for local setup and demo data.
Run these from the `PetCare.Api/PetCare.Api` directory. The schema itself still
comes from EF Core migrations, so use the scripts in this order:

1. Create the PostgreSQL login/database:

   ```powershell
   psql -h 127.0.0.1 -U postgres -d postgres -f sql/create_petapp_database.sql
   ```

2. Apply the EF Core schema:

   ```powershell
   dotnet ef database update
   ```

3. Load the dummy dataset:

   ```powershell
   psql -h 127.0.0.1 -U petapp -d petapp -f sql/seed_petapp_dummy_data.sql
   ```

Notes:

- `create_petapp_database.sql` creates the `petapp` PostgreSQL role and the
  `petapp` database.
- `seed_petapp_dummy_data.sql` is intentionally destructive for app data. It
  truncates the current PetCare tables, then reloads a full sample dataset.
- Update your local connection string password to match the database role
  password defined in `create_petapp_database.sql`.
- `grant_petapp_permissions.sql` is still useful when you already have a
  PostgreSQL database and only need to grant runtime access to the `petapp`
  role.

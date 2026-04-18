# PetsApp Admin

This folder contains a lightweight browser admin dashboard for the existing PetsApp API.

## What it supports

- Use the backend's own origin automatically when opened through `/admin`
- Sign in and keep a local bearer token for protected actions
- Create new user accounts through `POST /api/auth/register`
- Create, edit, and delete pet places through `POST/PUT/DELETE /api/places`
- Browse and filter the current place directory through `GET /api/places`

## How to use it

1. Start the API:

   ```bash
   dotnet run --project PetCare.Api/PetCare.Api/PetCare.Api.csproj
   ```

2. Open the admin site through the backend:

   ```text
   http://localhost:5063/admin/
   ```

   If you're running the HTTPS profile, use:

   ```text
   https://localhost:7091/admin/
   ```

3. The admin site will automatically use that same backend origin for all API calls.

4. Only if you are testing the UI separately, you can still serve the folder by itself, for example:

   ```bash
   python3 -m http.server 4173
   ```

   In that standalone mode, point the connection field to the API manually.

## Important

Do not run `node app.js`.

`pets-app-admin/app.js` is browser-side JavaScript and expects `window`, `document`, and `localStorage` to exist. The intended ways to use it are:

- open `http://localhost:5063/admin/` after starting the backend
- or serve the `pets-app-admin` folder with a small static server for standalone testing

## Backend note

`PetCare.Api/PetCare.Api/Program.cs` now serves the admin UI directly from the backend at `/admin`, which is the intended integration path. The local CORS fallback still exists for standalone UI testing, but the normal flow no longer depends on it.

# Pets App

Full-stack pet care application with a mobile frontend, ASP.NET Core backend, and a lightweight admin UI.

## Repositories

- `pets-app-front/` - Expo React Native mobile app
- `PetCare.Api/` - ASP.NET Core Web API and data layer
- `pets-app-admin/` - browser-based admin interface

## Features

- User accounts, email verification, password reset, and profile management
- Pet profiles, vaccines, illnesses, medication reminders, and consultations
- Discovery for vets, pet shops, and charity organisations
- Place owner applications and place management
- Forum posting, replies, likes, bookmarks, moderation, reports, and user blocking
- Direct messaging with text, image, and video media
- Pet audio translation flow
- Admin review tools for users, places, reports, and moderation

## Local Development

Start the backend first:

```bash
cd PetCare.Api/PetCare.Api
dotnet restore
dotnet ef database update
dotnet run
```

Then start the frontend:

```bash
cd pets-app-front
npm install
npm start
```

The backend listens on port `5063` by default. The frontend uses that port automatically for local development, and can be pointed elsewhere with:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_HOST:5063
```

## Documentation

- Frontend details: `pets-app-front/README.md`
- Backend details: `PetCare.Api/README.md`

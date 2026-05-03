# Pets App Frontend

Mobile client for the Pets App ecosystem, built with Expo, React Native, and Expo Router.

## What It Includes

- Authentication, email verification, password reset, and account settings
- Pet profiles, vaccines, illnesses, medication reminders, and consultations
- Place discovery for vets, pet shops, and charities
- Place owner application and place management flows
- Forum posts, replies, bookmarks, likes, reports, and user blocking
- Direct messages with text, image, and video attachments
- Pet translator audio workflow
- Push notification setup for reminders

## Tech Stack

- Expo 54
- React 19 / React Native 0.81
- Expo Router
- TypeScript
- React Navigation

## Setup

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm start
```

Run on a platform:

```bash
npm run ios
npm run android
npm run web
```

## API Configuration

By default the app tries to reach the backend on port `5063`. You can override the API base URL with:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_HOST:5063
```

The API client also attempts common local development hosts for simulator, emulator, and LAN use.

## Useful Commands

```bash
npm run lint
npx tsc --noEmit
```

## Project Structure

- `app/` - Expo Router screens and nested navigation
- `components/` - shared UI components
- `contexts/` - auth and global UI state
- `lib/` - API clients and domain helpers
- `hooks/` - reusable React hooks
- `data/` - models, translations, and local static data
- `assets/` - fonts, images, and icons

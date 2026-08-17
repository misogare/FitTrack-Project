# FitTrack Figma implementation

This frontend implementation follows the supplied FitTrack Figma/UX Pilot screens using the existing React 18 + Vite + React Router 6 stack and plain CSS. Tailwind was not added.

## Implemented routes

- `/` — Landing Page
- `/login` — Login
- `/register` — User Registration
- `/forgot-password` — Forgot Password
- `/dashboard` — Main Dashboard
- `/workouts` — Activity Tracking / Workout Entry
- `/plans` — Workout Plans
- `/nutrition` — Nutrition Tracking
- `/analytics` — Progress Analytics
- `/goals` — Goals Management
- `/profile` — User Profile
- `/settings` — Privacy & Data Settings

## Backend integration

The frontend uses the supplied Express API through `src/services/api.js` and cookie credentials. The following supplied backend endpoints are integrated:

- authentication: login, register, logout, profile read/update
- dashboard
- workouts: list/create/delete
- meals: list/create/delete
- goals: list/create/progress/delete

The supplied backend does **not** expose password-reset, password-change, privacy-preference persistence, data-export, session-revocation, account-deletion, or workout-plan endpoints. Those screens are implemented visually and interactively, but the frontend does not invent API calls for endpoints that do not exist.

## Figma mapping

The implementation was based on the supplied node links for Landing, Login, Registration, Dashboard, Activity Tracking, Workout Plans, Progress Analytics, Forgot Password, Goals, User Profile, and Privacy & Data Settings.

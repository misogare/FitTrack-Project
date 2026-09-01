# FitTrack — User Guide

**Audience:** Members using the FitTrack web app to track workouts, nutrition and goals.
**Applies to:** the live FitTrack app (React frontend + Express/MySQL backend).

---

## 1. What FitTrack does

FitTrack lets you log workouts, track meals and hydration, follow workout plans, record body metrics, set wellness goals, and see it all summarised on one dashboard. Everything you enter is private to your own account — no one else can see it.

## 2. Creating an account and signing in

1. Open the FitTrack site and click **Get Started** / **Register** on the landing page.
2. Enter your first name, last name, email address and a password, then submit.
   - Your email must be unique — you can't register twice with the same address.
   - Your password is stored securely (hashed); FitTrack staff never see it in plain text.
3. You're logged in automatically after registering. To sign in again later, use **Login** with the same email and password.
4. **Logging out:** use the logout control in the navigation — this clears your session cookie.

> **"Forgot password" limitation:** the Login page has a "Reset your password" link. Right now this screen only *simulates* sending a reset email — no email is actually sent, because the backend doesn't yet have a password-reset endpoint. If you're locked out, see the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) for how to recover access, or ask an administrator to reset your password directly.
5. Already logged in and want to change your password on purpose? Do that from **Profile**, not the forgot-password screen (see §7).

## 3. Getting around the app

Once logged in you land on the **Dashboard**, with navigation to:

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Daily/weekly summary of everything below |
| Workouts | `/workouts` | Log and review individual workouts |
| Plans | `/plans` | Structured, multi-day workout plans |
| Nutrition | `/nutrition` | Meals, food search, water intake |
| Analytics | `/analytics` | Body metrics and distance trends over time |
| Goals | `/goals` | Wellness goals and progress |
| Profile | `/profile` | Your personal details and password |
| Settings | `/settings` | Daily targets, privacy, data export/delete |

All of these pages require you to be logged in — visiting them directly while logged out sends you back to the landing page.

## 4. Dashboard

The Dashboard is your at-a-glance summary: a weekly activity chart, a nutrition ring (calories/macros for today), your active goals with progress bars, and stat cards (e.g. workouts this week, streak). It pulls live data from your workouts, meals and goals — there's nothing to fill in here directly.

## 5. Workouts

**Log a workout:**
1. Go to **Workouts** → **Log Workout** (or the equivalent add button).
2. Enter the activity name, workout type, duration (minutes), intensity (Low/Medium/High), and optionally calories burned, distance (km), the date, and notes.
3. Save. It appears immediately in your workout history and feeds the Dashboard and Analytics.

**View history:** the Workouts page lists past entries; use it to edit or delete a logged workout. A **daily summary** view rolls up everything logged for a given day.

**Workouts started from a Plan** (see §6) are pre-filled and logged the same way, and are linked back to that plan for stats.

## 6. Plans (structured workout programs)

- Browse plans on the **Plans** page — each has a status: **Active**, **Paused**, or **Completed**, and a set of daily sessions.
- Each session lists exercises pulled from FitTrack's built-in **exercise library** (filterable by muscle group, e.g. Chest, Back, Quads), with sets/reps/weight/rest guidance.
- **Start a workout** from a plan session to log it as a real workout in one step, pre-filled from the plan.
- You can create your own plan, and add/edit/swap/remove exercises within *your* plan's sessions. The underlying exercise library itself (the master list of exercise names/muscle groups) is fixed content maintained by the system — you customise how you use it, not the library itself.
- **Plan stats** show adherence/progress for a plan over time.

## 7. Profile

On **Profile** you can:
- Edit your name, date of birth, gender, height (cm), weight (kg), fitness level, and pick an avatar colour/style.
- **Change your password** — this is the correct way to change a password you already know (as opposed to the "forgot password" flow, which doesn't work yet).
- See member stats (e.g. member-since date).

## 8. Nutrition

- **Log a meal:** choose a meal type (Breakfast/Lunch/Dinner/Snack), search the food database or scan a barcode, and it fills in calories and macros (protein/carbs/fat) for you; adjust the serving if needed.
- **Search / barcode lookup:** the food search covers built-in foods plus any custom foods you've personally added. Scanning uses your device camera via the barcode scanner button.
- **Add a custom food:** if a food isn't in the database, add it with its own name and nutrition values — it's saved privately to your account and available next time you search.
- **Water intake:** log glasses/millilitres of water for the day from the hydration widget; delete a log entry if you made a mistake.
- **Nutrition/macro goals:** your daily calorie and macro (protein/carbs/fat) targets that the nutrition ring measures against are managed on the **Settings** page (§10), not on the Nutrition page itself.

## 9. Goals

1. **Set a goal** — pick a goal type (e.g. weight, steps, a running distance, workout frequency), a target value, a start date and a target date.
2. **Record progress** — add progress entries against an active goal over time; FitTrack plots these so you can see the trend, not just the latest number.
3. Goals move through statuses: **Active → Achieved** (or **Abandoned** if you stop pursuing it).

## 10. Analytics

Track **body metrics** over time — weight, BMI, body-fat %, and body measurements (chest/waist/hips/arms) — and **distance** trends from workouts that record distance (e.g. runs). Use this to see progress over weeks/months rather than a single session.

## 11. Settings

- **Daily targets:** step goal, workout minutes, calorie-burn goal, hydration (litres), and nutrition targets (calories, protein, carbs, fat) — these drive the Dashboard and Nutrition progress indicators.
- **Privacy:**
  - *Research data sharing* — an opt-in toggle; leave it off unless you specifically want to contribute anonymised data.
  - *Email reminders* — opt in/out of reminder emails.
  - *Public profile visibility* — controls whether basic profile info could be visible beyond your own account.
- **Export your data** — download your FitTrack data.
- **Delete all my data** — wipes your logged workouts/meals/goals/etc. but keeps your account and login.
- **Delete my account** — permanently removes your account. This cannot be undone; make sure you've exported anything you want to keep first.

## 12. Your data, briefly

Your data belongs to you: you can export it or delete it at any time from Settings, and no other member can see your workouts, meals, goals, or body metrics. FitTrack stores only what's needed to run the features above (see the project's data dictionary in `project_structure.md` if you want the full technical detail).

## 13. Getting help

If something doesn't work as described here, check the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) first. If that doesn't resolve it, contact your team's administrator/maintainer with: what you were doing, what you expected, what happened instead, and (if possible) a screenshot.

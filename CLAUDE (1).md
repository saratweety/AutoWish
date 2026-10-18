# AutoWish: project brief for Claude Code

Read this whole file before writing any code. It is the single source of truth for the AutoWish app: what it does, how it looks, how it moves, and the order to build it in.

## 0. About the developer (read first)

- I'm new to Mac, the terminal and React Native. Explain every step in plain, simple English.
- Before running a command, say in one line what it does. Before asking me to do something on my phone or Mac, give exact click-by-click steps.
- Build in small milestones (section 12). After each milestone, stop, tell me how to test it on my phone, and wait for me to confirm before continuing.
- If something fails, explain the error simply and fix it. Don't silently change the design or remove features to make errors go away.
- My machine: Apple Silicon Mac (Homebrew in /opt/homebrew), VS Code, Node.js via Homebrew. I test on my phone with the Expo Go app.
- The backend (section 14) runs on **Railway** (server + PostgreSQL database) with **Clerk** for login. I have never deployed a server before: when you need me to click something on railway.app or clerk.com, give me the exact clicks, and tell me which values are secret.

## 1. The product

**AutoWish** reminds you of your loved ones' special dates and sends your pre-written wish on WhatsApp at the right time, even when you're busy.

- Tagline: **Never miss a special day**
- Users: busy young adults and working people in Pakistan (also works anywhere) who don't want to miss a friend's, family member's or colleague's special day
- Occasions: Birthday, Anniversary, Mother's Day, Father's Day, Other (custom name)
- Relationships: Friend, Family, Colleague
- Core idea: get a reminder before the day. If you'll be busy, write the wish now and AutoWish handles sending it at 12:00 AM (or a time you pick)
- Language: English UI. Wishes can be written in English, Urdu or Roman Urdu

## 2. Scope

### Version 1 (build this now): works on Android and iPhone

Version 1 now includes accounts: login with email or Google, and cloud sync of special days, wishes, settings and My Gift progress. The app must still work fully offline, and the user can choose "Use without an account".

1. Add, edit and delete special days, saved on the phone and (once the user logs in) backed up to their account on our server, so they come back after logging out or on a new phone (section 14)
2. Import birthdays from phone contacts (optional, if the contact has a birthday saved)
3. Reminder notification X days before (1 day, 3 days or 1 week, chosen per person), at 10:00 AM local time
4. Write a wish ahead of time and schedule it for a date and time (default 12:00 AM on the day)
5. **Tap-to-send:** at the send time, a local notification says "It's time! Tap to send your wish to Ahmed". Tapping it opens AutoWish, which opens WhatsApp with the chat and the message already typed. The user presses Send in WhatsApp
6. After WhatsApp opens, ask "Did you send it?" (Yes / Not yet). Yes marks the wish as Sent and plays the Sent animation
7. Yearly repeat: after the day passes, the special day rolls to next year automatically
8. Wish suggestions: a "Suggest a wish" button that fills the message box from a built-in list of templates per occasion and tone (Funny, Emotional, Formal, Urdu). No AI API in v1
9. All screens, animations and motion from this brief

### Version 2 (later, do NOT build now)

- Fully automatic sending on Android using an AccessibilityService (native Kotlin module + Expo config plugin + development build). Needs exact alarms, a "screen must be unlocked" warning, and careful Google Play review justification
- iPhone stays tap-to-send forever (Apple does not allow automatic WhatsApp sending)
- AI-written wishes via an API
- The gift shop (section 14.9: handmade and other gifts to buy before a special day)

## 3. Tech stack

- **Expo** (latest stable SDK) + **React Native** + **TypeScript**, created with `npx create-expo-app@latest autowish --template blank-typescript`
- Navigation: `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`
- Storage: `@react-native-async-storage/async-storage` (simple typed wrapper; one key per collection)
- Notifications: `expo-notifications` (local scheduled notifications only)
- Contacts: `expo-contacts`
- Images: `expo-image-picker` for profile photos
- Fonts: `expo-font` + `@expo-google-fonts/fredoka` + `@expo-google-fonts/nunito`
- Animation: `react-native-reanimated` (UI motion) + `lottie-react-native` (illustrated animations)
- Splash: `expo-splash-screen` (keep native splash until fonts load, then play the Lottie splash)
- Dates: `date-fns`
- Install packages with `npx expo install <name>` so versions match the SDK
- If a feature doesn't work in Expo Go, explain why and set up a development build (`npx expo run:android` or EAS) step by step
- Login: `@clerk/clerk-expo` + `expo-secure-store` (token cache) + `expo-web-browser` and `expo-auth-session` (Google sign-in)
- Network status: `@react-native-community/netinfo` (sync when the phone comes back online)
- Backend: see section 14 (Node.js + TypeScript + Express + Prisma + PostgreSQL on Railway)

## 4. Brand: use these tokens everywhere, never raw hex in components

### Colours (`src/theme/colors.ts`)

| Token | Hex | Used for |
| --- | --- | --- |
| background | #F6F5F2 | App background (warm off-white) |
| surface | #FFFFFF | Cards, sheets, chat bubble |
| surfaceMuted | #EFEEEC | Subtle fills |
| text | #2F3550 | Main text (dark navy) |
| textMuted | #5D6585 | Secondary text |
| pink | #FFB4B4 | Gift lid, Today card |
| pinkLight | #FDE3E4 | Glows, soft fills |
| coral | #F9A39C | Gift box |
| heart | #EF7A70 | Heart, success circle |
| wordmarkCoral | #E0645A | "Wish" in the wordmark |
| blue | #789BD9 | Ribbon knot, Sent tick, selected chips |
| blueLight | #A9C1E6 | Ribbon, dotted trails |
| blueMist | #DAE3EA | Chips, Scheduled pill, calendar |
| greyBlue | #A0AFCC | Muted icons |
| orange | #FFA618 | Main buttons, countdown badges |
| yellow | #FFD961 | Today chip, confetti |
| sparkle | #F2C94C | Sparkles |
| outline | #E6DFD3 | Borders, bubble outline |
| danger | #E5736B | Failed status (soft red) |

### Typography

- Headings, app name, big numbers: **Fredoka** 600/700
- Body, buttons, labels: **Nunito** 400/600/700/800
- Scale: 28 / 22 / 18 / 16 (body) / 14 / 12
- Text on pink, yellow or orange is ALWAYS dark navy (#2F3550), never white

### Shape and style

- Corner radius: cards 20, large cards 24, sheets 28 (top corners), buttons and chips fully rounded (999)
- Flat pastel style, no gradients, very soft shadows only (or none)
- Main button: orange pill, dark navy Nunito 800 text, min height 52
- Secondary: text button in textMuted, min height 44
- Touch targets at least 44 × 44
- Icons: simple rounded line icons (`@expo/vector-icons` Feather or Ionicons outline). Never emoji in the UI
- Spacing scale: 4, 8, 12, 16, 20, 24, 32. Screen side padding 16 (20 on forms)

### Status styles (must be consistent everywhere)

- **Scheduled:** blueMist pill, navy text
- **Sent:** blue (#789BD9) circle tick + "Sent" in a darker blue (#4A68A8)
- **Failed / Not sent:** soft red pill with a "Retry" button
- **Countdown badge:** orange pill, navy text ("3 days", "Tomorrow", "Today")

### Logo and mascot

- Mascot: the AutoWish **gift box**: coral box (#F9A39C), pink lid (#FFB4B4), light blue ribbon and bow (#A9C1E6), blue knot (#789BD9), with a white chat bubble holding a coral heart (#EF7A70)
- Wordmark: "Auto" in navy + "Wish" in #E0645A, Fredoka 700
- App icon: the gift alone on a full #F6F5F2 square (1024 × 1024 PNG, supplied in `autowish-kit/assets/icon.png`)

## 5. Motion rules (`src/theme/motion.ts`)

Every animation in the app uses one shared feel.

- Bounce curve: `Easing.bezier(0.34, 1.56, 0.64, 1)` (the same curve is inside every Lottie file)
- Card enter: slide up 24 px + fade in, 450 ms, 100 ms stagger between cards, max 8 staggered
- Button press: scale to 0.95 with a spring, spring back with a tiny bounce
- Bottom sheet: spring up (damping 16, stiffness 160), dark navy scrim at 35%
- Respect "reduce motion" (`useReducedMotion`): Lottie rests on a still frame, cards appear without moving, buttons don't shrink

I already have ready-made code for this in the `autowish-kit` folder (from `AutoWish_complete_kit.zip`): `src/theme/colors.ts`, `src/theme/motion.ts`, `src/components/SlideInCard.tsx`, `BounceButton.tsx`, `SlideUpSheet.tsx`, and an example `HomeScreen.example.tsx`. Use them as the base (move them into the project's `src/`, add missing tokens from section 4). The kit's `assets/animations/` holds the 10 Lottie files and `assets/icon.png` + `assets/adaptive-icon.png` are the app icon (1024 × 1024). Once everything is moved, the `autowish-kit` folder can be deleted.

## 6. Animations (Lottie files already made, in `assets/animations/`)

All are 512 × 512 Lottie JSON with transparent backgrounds (except the splash, which has the #F6F5F2 background). Do not redesign them; just play them in the right place.

| # | File | Where | How to play |
| --- | --- | --- | --- |
| 1 | autowish_splash.json | Splash screen | Once (2.5 s), then go to Onboarding or Home |
| 2a | autowish_onboarding_1_calendar.json | Onboarding page 1 | Loop |
| 2b | autowish_onboarding_2_write.json | Onboarding page 2 | Loop |
| 2c | autowish_onboarding_3_send.json | Onboarding page 3 | Loop |
| 3 | autowish_today_gift.json | Home, Today card (88–96 px) | Loop |
| 4 | autowish_reminder_gift.json | Reminder bottom sheet | Once, start 300 ms after the sheet opens |
| 5 | autowish_schedule_plane.json | Write Wish, on Schedule tap | Once (1.5 s), then navigate to Success |
| 6 | autowish_success.json | Success screen | Once (2 s), stays on the last frame |
| 7 | autowish_wish_sent.json | Scheduled Wishes row, when a wish becomes Sent (40 px) | Once (0.8 s), stays as the Sent icon |
| 8 | autowish_empty_state.json | Home when no special days | Loop |
| 9 | (code) SlideInCard / BounceButton / SlideUpSheet | Lists, buttons, sheets | See section 5 |

## 7. Screens

All mobile, designed for 390 × 844, on the background colour, using SafeArea. Bottom tab bar on main screens: **Home**, **Wishes**, **Settings** (rounded line icons, active tab in orange).

1. **Splash:** Lottie 1 centred, wordmark + tagline below. First launch → Onboarding, otherwise → Home.
2–4. **Onboarding (3 swipeable pages):** "Skip" top right. Lottie 2a/2b/2c. Titles and text:
   - "Never forget a special day" · Birthdays, anniversaries, Mother's Day and Father's Day in one place.
   - "Busy? Write your wish in advance" · Write it whenever you have a minute and pick when it goes out.
   - "We send it on WhatsApp" · At the right time, we open WhatsApp with your wish ready. Just tap Send.
   - Page dots (active = coral pill), orange "Next" button, last page "Get started".
5. **Permissions setup:** "Let's set up AutoWish". Cards: Notifications (to remind you, required), Contacts (to import birthdays, optional). Each with an "Allow" button that shows "Allowed" with a blue tick after. Orange "Continue", text button "I'll do this later".
6. **Home:** "Hi {name}" (ask the user's first name once during onboarding or default to "Hi there"). Today card (pink) if any day is today: Lottie 3, yellow "TODAY" chip, "{Name}'s {occasion}", wish status line. "Upcoming" list sorted by days left: photo or initial avatar, name, "{Occasion} · {Relationship}", orange countdown badge. Floating orange "+" button. Cards use SlideInCard.
7. **Home empty:** Lottie 8, "No special days yet", "Add your first special day and we'll remind you before it comes.", orange "+ Add your first special day", blue text button "Import birthdays from contacts".
8. **Add / Edit Special Day:** photo picker circle, Name, WhatsApp number (country code picker defaulting to +92, digits only), Occasion chips (Birthday, Anniversary, Mother's Day, Father's Day, Other + text field), Date picker (year optional; Mother's/Father's Day set automatically, see section 9), Relationship chips, "Remind me" chips (1 day, 3 days, 1 week before). Orange "Save". Edit mode adds a "Delete" text button with an in-app confirm.
9. **Reminder pop-up (bottom sheet):** shown when the user opens the app from a reminder notification (and on Home for anything due tomorrow without a wish). SlideUpSheet + Lottie 4. "{Name}'s {occasion} is tomorrow!" (or "in 3 days"), "Busy? Schedule your wish now." Orange "Write Wish", text button "Remind me later" (re-reminds on the day at 10:00 AM).
10. **Write Wish:** "Wish for {Name}". Multiline message box. "Suggest a wish" button (sparkle icon). Tone chips: Funny, Emotional, Formal, Urdu (selected chip = blue fill, white text). Send time row "Send on WhatsApp · {date} · {time}" opening a date/time picker (default the day at 12:00 AM). Preview: the message in a WhatsApp-style bubble. Orange "Schedule Wish" (disabled while empty). On tap: play Lottie 5, schedule the notification, save, then go to Success.
11. **Success:** Lottie 6, "Wish scheduled!", "We'll remind you to send it to {Name} on WhatsApp at {time}, {date}." Orange "Back to Home", text button "View scheduled wishes".
12. **Scheduled Wishes (Wishes tab):** filter chips All, Scheduled, Sent, Not sent. Rows: avatar, name, "{Occasion} · {date, time}", status per section 4. Tapping a scheduled wish opens Write Wish to edit; a "Send now" option opens WhatsApp immediately.
13. **Settings:** **Account card at the top** (see section 14.7: email, "Saved to your account · 2 min ago", "Sync now", "Log out", "Delete account"; or "Sign in to back up your special days" for guests), default send time (12:00 AM), default reminder (1 day before), reminder time of day (10:00 AM), notifications status with a button to open system settings, import from contacts, "Test a notification" button, about/privacy line ("Your special days are saved privately to your account so you never lose them.").
14. **Login (Welcome back):** see section 14.7.
15. **Email code:** see section 14.7.

## 8. User flow

- Splash → first launch? yes → Onboarding (3) → Login (or "Use without an account") → Permissions → Home; no → Home (signed-in users sync in the background)
- Logged out user opens the app → Login screen → after login, all their data downloads and appears on Home (section 14.5)
- Home → any dates saved? no → Empty state → Add Special Day → Home; yes → Home list
- A day before the date (per person setting) → reminder notification → tap → app opens with the Reminder sheet
- Reminder sheet → busy? yes → Write Wish → Schedule → Success; no → "Remind me later" → reminder again on the day
- At the send time → "Tap to send" notification → tap → WhatsApp opens with the message → back in app: "Did you send it?" → Yes → status Sent (Lottie 7)

## 9. Data and logic

```ts
type Occasion = 'birthday' | 'anniversary' | 'mothers_day' | 'fathers_day' | 'other';
type Relationship = 'friend' | 'family' | 'colleague';
type Tone = 'funny' | 'emotional' | 'formal' | 'urdu';
type WishStatus = 'scheduled' | 'sent' | 'not_sent';

interface SpecialDay {
  id: string;
  name: string;
  phone: string;            // full international number, digits only, e.g. "923001234567"
  occasion: Occasion;
  customOccasion?: string;  // when occasion === 'other'
  month: number;            // 1-12
  day: number;              // 1-31
  year?: number;            // optional, for "turns 25" / "10th anniversary"
  relationship: Relationship;
  photoUri?: string;
  remindDaysBefore: 1 | 3 | 7;
  reminderNotificationId?: string; // LOCAL ONLY, never synced (see 14.4)
  createdAt: string;
  updatedAt: string;        // ISO, set on every change, used for sync
  deletedAt?: string;       // soft delete so other phones learn about deletions
}

interface Wish {
  id: string;
  specialDayId: string;
  text: string;
  tone: Tone;
  sendAt: string;           // ISO date-time in local time
  status: WishStatus;
  notificationId?: string;  // LOCAL ONLY, never synced (see 14.4)
  sentAt?: string;
  updatedAt: string;
  deletedAt?: string;
}

interface Settings {
  userName?: string;
  defaultSendTime: string;  // "00:00"
  defaultRemindDaysBefore: 1 | 3 | 7;
  reminderTimeOfDay: string; // "10:00"
  onboardingDone: boolean;  // LOCAL ONLY (per phone)
  updatedAt: string;
}
```

- **Next occurrence:** compute the next date from month/day (this year if not passed, else next year). Feb 29 → Feb 28 in non-leap years
- **Mother's Day** = second Sunday of May. **Father's Day** = third Sunday of June. Recompute every year
- **Countdown:** "Today", "Tomorrow", "In N days"
- **Reminders:** schedule one local notification per special day at reminderTimeOfDay, N days before the next occurrence. After the day passes (check on app open), reschedule for next year. Cancel and reschedule when a day is edited or deleted
- **Send notification:** title "It's time to wish {Name}!", body "Tap to send your {occasion} wish on WhatsApp". Notification `data` holds the wish id
- **Opening WhatsApp:** `https://wa.me/{phone}?text={encodeURIComponent(text)}` via `Linking.openURL`. If WhatsApp isn't installed, show a friendly in-app message. On iOS add `whatsapp` to `LSApplicationQueriesSchemes` in app.json if checking `canOpenURL`
- **Notification tap handling:** use `Notifications.addNotificationResponseReceivedListener` and `getLastNotificationResponseAsync` (for cold start). Reminder → open Reminder sheet for that day. Send → open WhatsApp, then show "Did you send it?" when the app comes back to the foreground
- **Missed wishes:** if the send time passed and status is still scheduled, show it as "Not sent" with a "Send now" button
- **Android:** create a notification channel "autowish-reminders" with high importance. Ask notification permission on Android 13+
- **Storage:** wrap AsyncStorage in `src/storage/` with typed `load/save` for specialDays, wishes, settings. Keep state in a React Context (`src/state/AppContext.tsx`)
- **Wish templates:** `src/data/wishTemplates.ts`, 5+ templates per occasion × tone, with `{name}` placeholders. Urdu tone in Roman Urdu (e.g. "Saalgirah mubarak ho, {name}!")

## 10. Project structure

```
autowish/
  App.tsx                 // fonts, providers, navigation, notification listeners
  app.json                // name "AutoWish", slug "autowish", icon, splash bg #F6F5F2, android package com.autowish.app
  assets/
    animations/           // the 10 Lottie JSON files
    icon.png, adaptive-icon.png, splash-icon.png
  src/
    theme/                // colors.ts, motion.ts, typography.ts, spacing.ts
    components/           // BounceButton, SlideInCard, SlideUpSheet, Chip, Avatar, CountdownBadge, StatusPill, Field, WhatsAppBubble, ScreenHeader
    screens/              // one file per screen in section 7
    navigation/           // RootNavigator, Tabs, types
    state/                // AppContext
    storage/              // AsyncStorage wrapper
    services/             // notifications.ts, whatsapp.ts, contacts.ts, dates.ts
    data/                 // wishTemplates.ts
    utils/
    api/                  // client.ts (fetch with Clerk token), sync.ts (sync engine, section 14.4)
server/                   // the backend, deployed to Railway (section 14)
  src/
    index.ts              // Express app, middleware, routes
    routes/               // me.ts, sync.ts
    lib/                  // prisma.ts, auth.ts, validate.ts
  prisma/
    schema.prisma         // database tables (section 14.3)
  package.json, tsconfig.json, .env.example
```

The app and the server live in the same GitHub repo. Railway deploys only the `server/` folder.

## 11. Code rules

- TypeScript strict. Functional components and hooks
- Every colour, font, radius and spacing from `src/theme`. No raw hex in screens
- Small, reusable components. One screen per file
- Accessibility: `accessibilityRole` and `accessibilityLabel` on buttons and icon buttons, text scales with system font size where possible, contrast 4.5:1 for body text
- No emoji in UI text. Friendly, short copy; error messages say what went wrong and how to fix it
- Keep the app working offline. Personal data is only ever sent to our own AutoWish server over HTTPS, never to any other service (Clerk only receives the user's email/Google login)
- Never commit secrets: `.env` files go in `.gitignore`; only `.env.example` with empty values is committed. App-side public values use the `EXPO_PUBLIC_` prefix; the Clerk secret key and database URL live only on Railway
- Comment non-obvious logic (date maths, notification scheduling) in simple English

## 12. Build order (stop after each milestone and tell me how to test it)

1. **Setup check:** confirm the Expo project runs on my phone. Install all packages. Copy in the motion kit and Lottie files. Load fonts. Add theme files
2. **Navigation shell:** all 13 screens as simple placeholders, tabs, and the full flow from section 8 clickable
3. **Data:** storage, AppContext, Add/Edit/Delete Special Day, Home list with countdowns and the empty state
4. **Design pass 1:** Splash, Onboarding, Permissions, Home, Empty, Add Special Day fully styled with animations
5. **Wishes:** Write Wish, templates, Success, Scheduled Wishes, statuses
6. **Notifications:** reminders, send notifications, tap handling, Reminder sheet, "Did you send it?", missed wishes, yearly rollover
7. **WhatsApp:** open chat with message, error handling
8. **Settings and contacts import**
9. **Polish:** reduce motion, accessibility, edge cases (Feb 29, deleting a day with a scheduled wish, changing phone time zone), app icon and splash
10. **Backend B1, server on Railway:** create `server/`, Prisma schema, `/health`, deploy to Railway with PostgreSQL. Test: open the Railway URL + `/health` in my phone's browser and see `{"ok":true}`
11. **Backend B2, login:** Clerk app (email code + Google), Login and Email code screens, "Use without an account", server checks the token, `/me`. Test: log in with Google and with email on my phone
12. **Backend B3, sync:** the sync engine and `/sync` (section 14.4–14.5). Test the four scenarios in 14.10 on my phone
13. **Backend B4, account:** Settings account card, Log out, Delete account, guest → sign in upload. Test: delete a test account and check its rows are gone
14. **Backend B5, photos:** upload profile photos so they appear on a new phone (14.6)
15. **Release prep:** explain EAS Build, making an Android APK to share with friends, and what the Google Play listing needs (privacy policy that mentions the account and server, Data safety form, account deletion link, screenshots, icon)

## 13. Definition of done for v1

- I can add 5 people with different occasions, see correct countdowns, get a reminder notification, write and schedule a wish, get the send notification, tap it, land in WhatsApp with the message typed, come back and mark it Sent
- Every screen matches the brand tokens, uses the right animation, and looks consistent
- No crashes; data survives closing and reopening the app
- I log out, log back in, and every special day, wish, setting and My Gift item is back, with its reminders scheduled again. Same on a second phone

## 14. Backend, accounts and sync

### 14.1 The big picture

```
AutoWish app (phone)  ──HTTPS──►  AutoWish server (Railway)  ──►  PostgreSQL (Railway)
  keeps a full local copy           checks who the user is           the master copy
  works offline                     only touches that user's rows    of every user's data
        │
        └── Clerk (login only: email code + Google)
```

- **The phone keeps a full copy** of the user's data in AsyncStorage, exactly as in v1. Screens always read from the local copy, so the app is fast and works offline.
- **The server holds the master copy.** Changes go up, other phones' changes come down. The app NEVER talks to the database directly.
- **Clerk does login.** The app gets a short-lived token from Clerk and sends it with every request. The server checks the token with Clerk and uses the Clerk user id as the owner of every row. We never store passwords.
- **Notifications stay local.** The server does not send reminders. Each phone schedules its own local notifications from its local copy (section 9). After a download, the phone reschedules.

### 14.2 Server stack

- Node.js (LTS) + TypeScript, Express, Prisma ORM, PostgreSQL
- `@clerk/express` (verify tokens, `getAuth(req).userId`), `zod` (validate every request body), `helmet`, `cors`, `express-rate-limit`
- Scripts: `dev` (tsx watch), `build` (tsc), `start` (`prisma migrate deploy && node dist/index.js`)
- Env vars (see `.env.example`): `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `PORT`
- App env (in `autowish/.env`): `EXPO_PUBLIC_API_URL` (the Railway URL), `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

### 14.3 Database tables (`server/prisma/schema.prisma`)

```prisma
model User {
  id          String   @id            // the Clerk user id
  email       String
  name        String?
  createdAt   DateTime @default(now())
  specialDays SpecialDay[]
  wishes      Wish[]
  settings    Settings?
  giftState   GiftState?
}

model SpecialDay {
  id               String    @id      // UUID made on the phone, so offline-created rows keep their id
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name             String
  phone            String
  occasion         String
  customOccasion   String?
  month            Int
  day              Int
  year             Int?
  relationship     String
  photoUrl         String?
  remindDaysBefore Int
  createdAt        DateTime
  updatedAt        DateTime
  deletedAt        DateTime?
  @@index([userId, updatedAt])
}

model Wish {
  id           String    @id
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialDayId String
  text         String
  tone         String
  sendAtLocal  String    // "2026-11-02T00:00" local wall-clock time, so 12:00 AM stays 12:00 AM in any time zone
  status       String
  sentAt       DateTime?
  updatedAt    DateTime
  deletedAt    DateTime?
  @@index([userId, updatedAt])
}

model Settings {
  userId                  String   @id
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userName                String?
  defaultSendTime         String   // "00:00"
  defaultRemindDaysBefore Int
  reminderTimeOfDay       String   // "10:00"
  updatedAt               DateTime
}

model GiftState {                  // My Gift: stars and unlocked/equipped items
  userId    String   @id
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stars     Int
  unlocked  Json     // e.g. { hats: ["h01","h04"], ribbons: [...], cards: [...], stickers: [...] }
  equipped  Json
  updatedAt DateTime
}
```

### 14.4 API (every route except `/health` requires a valid Clerk token)

| Route | What it does |
| --- | --- |
| `GET /health` | `{ "ok": true }`, used to test the deploy |
| `GET /me` | Creates the User row on first call (upsert from the Clerk user), returns the user |
| `GET /sync?since=<ISO>` | Returns every SpecialDay, Wish, Settings, GiftState of this user changed after `since` (including soft-deleted rows), plus `serverTime`. `since=0` = everything |
| `POST /sync` | Body: `{ lastSyncedAt, changes: { specialDays[], wishes[], settings?, giftState? } }`. Saves each change, then returns the same as `GET /sync?since=lastSyncedAt` |
| `DELETE /me` | Deletes all of this user's rows (cascade) and the Clerk user. Required by Google Play |
| `POST /photos` (B5) | Uploads a profile photo, returns its `photoUrl` |

**Rules the server must follow (comment these in the code):**
- The owner is ALWAYS `getAuth(req).userId`. Ignore any `userId` sent in the body.
- If a row id already exists but belongs to a different user, reject that row.
- Conflict rule = **last change wins**: only overwrite a row if the incoming `updatedAt` is newer than the stored one.
- Deletes are soft (`deletedAt` set) so other phones find out. A cleanup job may hard-delete rows soft-deleted more than 30 days ago.
- Validate every body with zod. Rate-limit to about 60 requests per minute per user.

**The sync engine on the phone (`src/api/sync.ts`):**
- Every local add, edit or delete sets `updatedAt = now`, saves locally, and adds the record id to an **outbox** (saved in AsyncStorage).
- Notification ids (`reminderNotificationId`, `notificationId`) and `onboardingDone` are **per phone and never uploaded**. Keep them in a local-only map `{ recordId: notificationId }`.
- `syncNow()`: send the outbox with `POST /sync` → merge what comes back into local storage (newer `updatedAt` wins, soft-deleted rows are removed from the screens) → clear the sent outbox items → save `lastSyncedAt = serverTime` → reschedule notifications for the records that changed.
- Run `syncNow()`: right after login, on app start, when the app comes to the foreground, when the network comes back (NetInfo), 2 seconds after any local change (debounced), and on pull-to-refresh on Home and Wishes.
- Offline: nothing breaks. Changes wait in the outbox and go up next time.
- Show a tiny sync state in the Settings account card: "Saved to your account · 2 min ago", "Saving…", or "Not saved yet · you're offline".

### 14.5 What happens on logout, login and a new phone

This is the most important part. Build it exactly like this.

**Log out (Settings → Log out)**
1. Try `syncNow()` so nothing is lost.
2. If the outbox is still not empty (offline), show an in-app sheet: "Some changes aren't saved to your account yet. Connect to the internet and try again, or log out anyway and lose them." Buttons: orange "Try again", text button "Log out anyway".
3. Cancel ALL scheduled notifications on this phone (otherwise a logged-out phone would keep reminding).
4. Clear local special days, wishes, settings, gift state, outbox and `lastSyncedAt`.
5. Clerk `signOut()`, then go to the Login screen.

**Log in again (same phone) or on a new phone**
1. Clerk login (Google or email code).
2. `GET /me`, then `GET /sync?since=0`: download everything.
3. Save it all locally. Show a short loading state on Home with the gift Lottie: "Getting your special days…".
4. **Reschedule every reminder and every future scheduled wish** on this phone (section 9 rules). Wishes whose time has passed and are still `scheduled` show as "Not sent" with "Send now".
5. On a new phone, ask for notification permission if not given yet (Permissions screen).
6. Home shows all their special days. A small toast: "Welcome back, {name}. Your special days are here."

**Two phones logged in at the same time:** both stay in sync, and both phones schedule reminders, so the user gets the reminder on both. That's fine for now. Later add a per-phone setting "Reminders on this phone".

**"Use without an account" (guest)**
- The app works exactly like v1, local only. Settings shows "Sign in to back up your special days".
- When a guest signs in, put ALL their local records in the outbox and run `syncNow()`. The server merges them with anything the account already has. Nothing is deleted.

### 14.6 Photos (milestone B5)

`photoUri` from the image picker only exists on that phone. To make photos appear on a new phone: resize to max 512 px (`expo-image-manipulator`), upload with `POST /photos` to file storage (a Railway storage bucket if available, otherwise Cloudflare R2, which is S3-compatible), save the returned `photoUrl` on the SpecialDay. Until B5 is built, other phones show the initial avatar.

### 14.7 New screens and changes (same brand tokens and motion as section 4–5)

- **Login ("Welcome to AutoWish"):** after onboarding, and whenever logged out. Splash gift Lottie (small, looping), wordmark, "Save your special days to your account so you never lose them." Buttons: white pill "Continue with Google" (Google "G" icon, navy text, outline border), orange "Continue with email", text button "Use without an account". Small line: "We only use your email to log you in."
- **Email code:** "Check your email", "We sent a 6-digit code to {email}". Six large code boxes, auto-advance, paste support. "Resend code" (after 30 s). Friendly errors: "That code didn't work. Check it and try again."
- **Settings account card** (top of Settings): avatar initial, email, sync line, "Sync now", "Log out". At the bottom of Settings, a red text button "Delete account" → in-app confirm sheet: "This deletes your account and all your special days and wishes from our server. This can't be undone." Buttons: soft red "Delete my account", text button "Keep my account".
- **Home:** pull-to-refresh runs `syncNow()`.

### 14.8 Railway and Clerk setup (guide me click by click when we get there)

**Clerk**
1. clerk.com → Sign up → Create application → name "AutoWish" → turn on **Email** (verification code) and **Google** → Create.
2. API keys page: copy the **Publishable key** (safe, goes in the app) and the **Secret key** (SECRET, Railway only).

**Railway**
1. railway.app → Login with GitHub → New Project → **Deploy PostgreSQL**.
2. In the same project: New → **GitHub Repo** → pick the AutoWish repo → open the service → Settings → **Root Directory** = `server`.
3. Variables: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`.
4. Settings → Networking → **Generate Domain**. Put that URL in the app as `EXPO_PUBLIC_API_URL`.
5. Every push to GitHub redeploys automatically. Show me where to read the deploy logs if something fails.

Cost to explain to me: Railway's Hobby plan is about $5/month; Clerk is free for a small app.

### 14.9 Later: the gift shop (do NOT build yet, but keep the database ready for it)

Idea: "Ahmed's birthday is in 7 days. Send him a gift?" Handmade and other gifts, ordered in time to arrive before the day.

- Future tables: `Seller`, `Product` (photos, price PKR, handmade yes/no, delivery days, stock), `Order`, `OrderItem`, `Address`, `Payment`. An order can link to a `specialDayId`.
- Payments: start with cash on delivery, later JazzCash / Easypaisa / Safepay. Physical goods do not need Google Play billing.
- Smart timing: show "Order by {date} so it arrives in time" using the product's delivery days.
- Adding the shop must not change how special days and wishes sync.

### 14.10 Backend definition of done (test all four on my phone)

1. **Logout → login:** add 3 special days and 2 scheduled wishes, log out (Home is empty, no reminders fire), log back in → all 5 records are back and reminders are scheduled again.
2. **New phone:** log in on a second phone (or delete and reinstall the app) → everything appears.
3. **Offline:** turn on airplane mode, add a special day, turn airplane mode off → within a few seconds Settings says "Saved to your account".
4. **Delete account:** delete a test account → logging in again with that email starts empty, and the rows are gone in the Railway database view.

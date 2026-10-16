# AutoWish: project brief for Claude Code

Read this whole file before writing any code. It is the single source of truth for the AutoWish app: what it does, how it looks, how it moves, and the order to build it in.

## 0. About the developer (read first)

- I'm new to Mac, the terminal and React Native. Explain every step in plain, simple English.
- Before running a command, say in one line what it does. Before asking me to do something on my phone or Mac, give exact click-by-click steps.
- Build in small milestones (section 12). After each milestone, stop, tell me how to test it on my phone, and wait for me to confirm before continuing.
- If something fails, explain the error simply and fix it. Don't silently change the design or remove features to make errors go away.
- My machine: Apple Silicon Mac (Homebrew in /opt/homebrew), VS Code, Node.js via Homebrew. I test on my phone with the Expo Go app.

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

1. Add, edit and delete special days, saved on the phone (no server, no login)
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
- Cloud backup

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
- App icon: the gift alone on a full #F6F5F2 square (1024 × 1024 PNG in `assets/icon.png`; I will supply it)

## 5. Motion rules (`src/theme/motion.ts`)

Every animation in the app uses one shared feel.

- Bounce curve: `Easing.bezier(0.34, 1.56, 0.64, 1)` (the same curve is inside every Lottie file)
- Card enter: slide up 24 px + fade in, 450 ms, 100 ms stagger between cards, max 8 staggered
- Button press: scale to 0.95 with a spring, spring back with a tiny bounce
- Bottom sheet: spring up (damping 16, stiffness 160), dark navy scrim at 35%
- Respect "reduce motion" (`useReducedMotion`): Lottie rests on a still frame, cards appear without moving, buttons don't shrink

I already have ready-made code for this in `AutoWish_motion_kit.zip`: `src/theme/colors.ts`, `src/theme/motion.ts`, `src/components/SlideInCard.tsx`, `BounceButton.tsx`, `SlideUpSheet.tsx`, and an example `HomeScreen.example.tsx`. Use them as the base (adjust paths, add missing tokens from section 4).

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
13. **Settings:** default send time (12:00 AM), default reminder (1 day before), reminder time of day (10:00 AM), notifications status with a button to open system settings, import from contacts, "Test a notification" button, about/privacy line ("Everything stays on your phone").

## 8. User flow

- Splash → first launch? yes → Onboarding (3) → Permissions → Home; no → Home
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
  reminderNotificationId?: string;
  createdAt: string;
}

interface Wish {
  id: string;
  specialDayId: string;
  text: string;
  tone: Tone;
  sendAt: string;           // ISO date-time in local time
  status: WishStatus;
  notificationId?: string;
  sentAt?: string;
}

interface Settings {
  userName?: string;
  defaultSendTime: string;  // "00:00"
  defaultRemindDaysBefore: 1 | 3 | 7;
  reminderTimeOfDay: string; // "10:00"
  onboardingDone: boolean;
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
```

## 11. Code rules

- TypeScript strict. Functional components and hooks
- Every colour, font, radius and spacing from `src/theme`. No raw hex in screens
- Small, reusable components. One screen per file
- Accessibility: `accessibilityRole` and `accessibilityLabel` on buttons and icon buttons, text scales with system font size where possible, contrast 4.5:1 for body text
- No emoji in UI text. Friendly, short copy; error messages say what went wrong and how to fix it
- Keep the app working offline; never send personal data anywhere
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
10. **Release prep:** explain EAS Build, making an Android APK to share with friends, and what the Google Play listing needs (privacy policy, screenshots, icon)

## 13. Definition of done for v1

- I can add 5 people with different occasions, see correct countdowns, get a reminder notification, write and schedule a wish, get the send notification, tap it, land in WhatsApp with the message typed, come back and mark it Sent
- Every screen matches the brand tokens, uses the right animation, and looks consistent
- No crashes; data survives closing and reopening the app

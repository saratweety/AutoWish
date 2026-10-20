# AutoWish: what's left, step by step

Written 19 October 2026, after a full review of the app, the server, the native
auto-send module and the git history.

**How to use this file:** do the steps in order. Each step has a **Checkpoint** —
do not move to the next step until the checkpoint passes. Change `- [ ]` to
`- [x]` when a step is done, so you always know where you stopped.

Lines starting with `$` are Terminal commands. Type everything after the `$`.

---

## Where the project stands

Already built and working: all screens, theme, 10 Lottie animations, local
storage, notifications, WhatsApp tap-to-send, contacts import, wish templates,
the confetti game and My Gift, the Android auto-send native module, Clerk login,
the sync engine with offline outbox, photo upload and resize, and the whole
server (Express + Prisma + Postgres, `/health` `/me` `/sync` `DELETE /me`
`/photos`, first migration written).

Checked on 19 October 2026: `tsc --noEmit` clean on the app **and** the server,
`expo lint` clean, no TODO or FIXME anywhere in the code.

**The one big gap:** the server has never actually run. `server/.env` does not
exist and `EXPO_PUBLIC_API_URL` in `.env` is empty, so login and sync are
written but untested. Steps 1 to 7 below fix exactly that.

---

## - [ ] Step 0. Tidy the leftover files (5 minutes)

**Why:** there are two brief files. `CLAUDE (1).md` is the real, full one (it has
section 14, the backend). `CLAUDE.md` is an older copy with a stray `ca` typed on
line 1 by accident. Claude Code reads `CLAUDE.md`, so right now it reads the
wrong one. `HomeScreen.example.tsx` came from the motion kit and nothing uses it.

Do this:

```
$ cd ~/Documents/autowish/autowish
$ mv "CLAUDE (1).md" CLAUDE.md
$ rm src/screens/HomeScreen.example.tsx
$ git add -A && git commit -m "Use the full brief as CLAUDE.md, remove kit example screen"
```

**Checkpoint.** Run:

```
$ head -1 CLAUDE.md && grep -c "14. Backend" CLAUDE.md && git status --short
```

Done when the first line is `# AutoWish: project brief for Claude Code` (no `ca`),
the count is `1` or more, and `git status --short` prints nothing.

---

## - [x] Step 1. Create the Clerk app (10 minutes)

**Why:** Clerk does the login. Without it, "Continue with Google" and the email
code screen have nothing to talk to.

Click by click:

1. Open **clerk.com** -> **Sign up**.
2. **Create application** -> name it `AutoWish`.
3. Turn **on** two sign-in options: **Email** (verification code) and **Google**.
4. Click **Create application**.
5. Left sidebar -> **API keys**. You need two values from this page:
   - **Publishable key**, starts with `pk_` — safe, goes in the app
   - **Secret key**, starts with `sk_` — SECRET, only ever on the server
6. Keep this browser tab open; you paste these keys in Steps 3 and 4.

**Checkpoint.** You have both keys copied somewhere safe, and the Clerk
dashboard shows Email and Google as enabled sign-in methods.

---

## - [x] Step 2. Deploy the database on Railway (10 minutes)

**Why:** the server needs a Postgres database to be the master copy of everyone's
special days.

Click by click:

1. Open **railway.app** -> **Login with GitHub**.
2. **New Project** -> **Deploy PostgreSQL**. Wait for the box to go green.
3. Click the **Postgres** box -> **Variables** tab.
4. Copy **`DATABASE_PUBLIC_URL`** (the *public* one — your Mac can only reach
   that one from home). It looks like
   `postgresql://postgres:xxxx@yyyy.proxy.rlwy.net:12345/railway`.

**Checkpoint.** The Postgres service shows a green/active state and you have the
`DATABASE_PUBLIC_URL` copied.

---

## - [ ] Step 3. Run the server on your Mac first (15 minutes) - OPTIONAL, skipped for now

**Why:** running it locally first means mistakes appear on your own screen
instead of hiding in a deploy log. This also creates the database tables.

Create the settings file:

```
$ cd ~/Documents/autowish/autowish/server
$ cp .env.example .env
$ open -a TextEdit .env
```

Fill in exactly three lines, then save (Cmd+S) and close:

- `DATABASE_URL=` paste the `DATABASE_PUBLIC_URL` from Step 2
- `CLERK_SECRET_KEY=` paste your `sk_...` key
- `CLERK_PUBLISHABLE_KEY=` paste your `pk_...` key

Leave `PORT=8080` as it is. Leave every `S3_` line empty for now (Step 8).

Create the tables, then start the server:

```
$ npx prisma migrate deploy
$ npm run dev
```

`prisma migrate deploy` builds the tables from
`server/prisma/migrations/`. `npm run dev` starts the server and keeps running —
that Terminal tab is now busy, so open a **new tab** (Cmd+T) for the checkpoint.

**Checkpoint.** In the new tab:

```
$ curl http://localhost:8080/health
```

Done when it prints `{"ok":true}`. Also check the tables exist:

```
$ cd ~/Documents/autowish/autowish/server && npx prisma studio
```

A browser page opens listing User, SpecialDay, Wish, Settings, GiftState.
Close it, and stop the server with **Ctrl+C** in the first tab.

**Security note.** `DATABASE_PUBLIC_URL` only exists after you switch on
**Public access** (Postgres service -> Settings -> Networking). That opens the
database to the internet, protected only by its password. It is only there so
your Mac can reach it while testing. **Switch Public access back off once Step 7
is finished** — the deployed server talks to Postgres over Railway's private
network and never needs it.

**If it fails:** `Can't reach database server` means the `DATABASE_URL` is the
internal one, not the public one — go back to Step 2.4. Any other red text:
copy the whole error and send it to me.

---

## - [x] Step 4. Deploy the server to Railway (10 minutes)

**Why:** your phone cannot reach your Mac. The server has to live on the
internet with its own `https://` address.

Click by click:

1. In Terminal: `$ cd ~/Documents/autowish/autowish && git push`
   (Railway deploys from GitHub, so your code has to be pushed first.)
2. In your Railway project -> **New** -> **GitHub Repo** -> pick
   **saratweety/AutoWish**.
3. Open that new service -> **Settings** -> find **Root Directory** -> type
   `server` -> save. (The repo has the app at the top and the server in a
   subfolder; this tells Railway which part to build.)
4. **Variables** tab -> add three variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` — type it exactly like that,
     braces included. Railway swaps in the real address itself.
   - `CLERK_SECRET_KEY` = your `sk_...`
   - `CLERK_PUBLISHABLE_KEY` = your `pk_...`
5. **Settings** -> **Networking** -> **Generate Domain**. Copy the
   `https://....up.railway.app` address.

**Checkpoint.** In Terminal, with your own address:

```
$ curl https://YOUR-ADDRESS.up.railway.app/health
```

Done when it prints `{"ok":true}`.

**If it fails:** service -> **Deployments** -> click the newest one -> **View
logs**. Read the first red line from the top (not the bottom). Send it to me.

**Cost:** Railway's Hobby plan is about $5 a month. Clerk is free at this size.

---

## - [x] Step 5. Point the app at the server (2 minutes)

**Why:** `EXPO_PUBLIC_API_URL` is empty right now, so the app knows no server
exists and quietly stays local-only.

```
$ cd ~/Documents/autowish/autowish
$ open -a TextEdit .env
```

Set these two lines, save, close:

- `EXPO_PUBLIC_API_URL=https://YOUR-ADDRESS.up.railway.app` (no slash at the end)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=` your `pk_...` key from Step 1

These values are read once when the app starts, so restart with a clean cache:

```
$ npx expo start -c
```

**Checkpoint.**

```
$ grep EXPO_PUBLIC_API_URL .env
```

Done when the line shows your Railway address.

(`npx expo config` will NOT show it: `EXPO_PUBLIC_` values are baked into the
JavaScript bundle when it is built, not into the app config.)

---

## - [ ] Step 6. Build a development build (30-60 minutes, mostly waiting)

**Why:** Expo Go cannot run two things this app needs — the Kotlin auto-send
module and Clerk's native secure storage. You need your own build of the app.
This is a one-time thing; after it's installed you keep using `npx expo start`.

```
$ cd ~/Documents/autowish/autowish
$ npx eas-cli@latest build --profile development --platform android
```

Answer the prompts (log in with your Expo account, `saratweety`). When it
finishes it prints a link.

On your Android phone: open that link -> download the `.apk` -> install it
(allow "install from this source" if asked) -> open **AutoWish**.
Then on the Mac run `$ npx expo start -c` and scan the QR code **with the
AutoWish app you just installed**, not with Expo Go.

**Checkpoint.** The app opens on your phone and shows the splash gift animation,
and Settings -> auto-send row no longer says it is unsupported. Nothing in the
Terminal says `requires a development build`.

---

## - [ ] Step 7. The four backend tests (section 14.10 of the brief)

**Why:** this is the written definition of done for the backend. All four must
pass before the backend counts as finished.

Tick each one:

- [ ] **7a. Logout, then login.** Add 3 special days and 2 scheduled wishes.
  Settings -> **Log out**. Home should be empty and no reminders should fire.
  Log back in with the same email. *Done when all 5 records come back and the
  reminders are scheduled again (Settings -> "Test a notification" still works).*

- [ ] **7b. New phone.** Log in on a second phone — or delete and reinstall the
  app on this one. *Done when every special day and wish appears by itself,
  with the "Welcome back" toast.*

- [ ] **7c. Offline.** Turn on airplane mode. Add a special day. Turn airplane
  mode off. *Done when, within a few seconds, the Settings account card says
  "Saved to your account".*

- [ ] **7d. Delete account.** Use a test email. Settings -> bottom -> **Delete
  account** -> confirm. Log in again with that same email. *Done when it starts
  completely empty, and the rows are gone in Railway -> Postgres -> Data.*

**Checkpoint.** All four boxes above are ticked. If one fails, write down exactly
what you did and what you saw, and send it to me — don't carry on past a failure.

---

## - [ ] Step 8. Turn on photo sync (optional, 15 minutes)

**Why:** a photo picked on one phone only exists on that phone. The upload code
is already written; it switches itself off until the storage settings exist.
Until then, other phones show the letter avatar. Nothing is broken without it.

Click by click:

1. Railway project -> **+ Create** -> **Bucket**.
2. Open the bucket -> **Credentials** tab.
3. Copy those values into the **server** service's **Variables**:
   `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY`.
4. The server redeploys by itself.

**Checkpoint.** Add a photo to a person on phone 1, wait for "Saved to your
account", then open phone 2. Done when the photo appears there too.

---

## - [ ] Step 9. Release preparation

Tick each one:

- [ ] **9a. Remove the two permissions the app doesn't use.** `app.json` asks for
  `android.permission.RECORD_AUDIO` and `android.permission.WRITE_CONTACTS`. The
  code never records audio and never writes contacts, and Google Play will ask
  you to justify both. Delete those two lines from the `android.permissions`
  list, rebuild, and re-test contacts import. *Done when contacts import still
  works and the two lines are gone.*

- [ ] **9b. Write and host a privacy policy.** Google Play needs a public URL. A
  free GitHub Pages page is enough. It must say: the data stays on the phone
  unless you log in; contacts never leave the phone; the account and all its
  data can be deleted from inside the app (Settings -> Delete account).
  *Done when the URL opens in a browser on your phone.*

- [ ] **9c. Prepare the auto-send justification.** This is the single most likely
  reason for a rejection. In the Play Console you must declare the
  AccessibilityService and upload a short screen recording showing: the user
  switching auto-send on themselves, the warning screen, and the Android
  Accessibility toggle. Say plainly that the service only taps Send in WhatsApp
  for a message the user wrote and scheduled, and that it is off by default.
  *Done when the recording exists and the declaration text is written.*

- [ ] **9d. Switch Clerk to a production instance** and put the new `pk_live_...`
  key in `.env` and the matching `sk_live_...` in Railway. *Done when login still
  works on a fresh install built with the live keys.*

- [ ] **9e. Share with friends first, before the Play Store.**
  `$ npx eas-cli@latest build --profile preview --platform android` gives a plain
  APK you can send on WhatsApp. *Done when a friend installs it and can add a
  special day.*

- [ ] **9f. The Play listing itself:** app icon (the 1024 PNG in `assets/`),
  4 to 8 screenshots, short and full description, the content rating
  questionnaire, and the Data safety form (declare: contacts read on device,
  email collected for login, photos uploaded if the user adds them).

---

## Nice to have, not blocking

- No README in the repo — one page saying how to run the app and the server
  would help future-you.
- No automated tests anywhere. The riskiest code is the sync merge in
  `src/api/sync.ts` (last-write-wins) and the date maths in
  `src/services/dates.ts` (Feb 29, Mother's/Father's Day). A few tests there
  would catch a silent data-loss bug.
- `src/data/sample.ts` and the dev rows in Settings are already correctly hidden
  behind `__DEV__`, so they are safe to leave as they are.

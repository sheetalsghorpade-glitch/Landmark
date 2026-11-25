# Landmark EMR, interactive prototype

A working React build of the Landmark EMR Figma prototype: a clinical record for care in the patient's home.
Designed by Shital Ghorpade. All patient data is fictional.

## What you can do in it

- **Sign in to Home:** sign in with validation, one-time code (auto-advance, paste, resend timer), choose a role, welcome dialog and a three-step spotlight tour.
- **Home:** Today, This week and This month switch the figures in place; encounter filters, inline search and sort; the day plan opens the patient; export downloads a CSV.
- **Patient record:** AI summary with its nine sources, provider and carer action items that create real tasks, a worst-first problem list with working actions, message the care manager, and tabs for operational, demographics, encounters and documents.
- **Encounter:** 15 named steps with live progress, range checks on every vital (try a respiration of 320), calculated BMI and unit conversions, copy from last visit with undo, PHQ-9 scoring against validated bands with a safety prompt on question 9, autosave, discard and note preview.
- **Landmark Assist:** consent before listening, suggestions that appear as the visit goes on, a draft review where each section is ready or needs you, and sign-off that only unlocks once the medication conflict is resolved.
- **Coding review:** returned, with coders and completed queues; jump to the flagged section; reply and resubmit with undo.
- **Care gaps:** search, three filters, sortable columns, red, amber and green cells, CSV export.
- **Tasks:** board with drag and drop between columns, sortable list, new task with validation, task detail panel.
- **Calendar:** week and day views, the current-time line, visit details, route order and directions.
- **Metrics:** charts with hover detail, 30 and 90 day ranges.
- **Everywhere:** ⌘K search, notifications with unread badge, help, switch role or location, toasts.

The **Demo** button (bottom right) switches between the three brand variations, green, yellow and blue, from one set of design tokens, and restarts the demo.

## Run it locally

You need Node.js 18 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints, usually http://localhost:5173.

## Deploy the live demo on Vercel

**Option A, from GitHub (recommended)**

1. Create a new GitHub repository and push this folder to it.
2. Go to vercel.com, sign in with GitHub, and choose **Add New… > Project**.
3. Import the repository. Vercel detects Vite. Keep the defaults: build command `npm run build`, output directory `dist`.
4. Press **Deploy**. You get a live link like `landmark-emr.vercel.app` in about a minute.
5. Optional: under **Settings > Domains**, add a subdomain of your own site, for example `landmark.sghorpade.com`.

**Option B, from your computer**

```bash
npm install -g vercel
vercel        # first time: answer the prompts, accept the defaults
vercel --prod # publish to the production URL
```

The app uses hash routing (`/#/home`), so every link works on Vercel without extra rewrite rules.

## Single-file build

`npm run build:single` writes one self-contained `dist-single/index.html` that opens anywhere, useful for sharing or embedding.

## Stack

React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide icons, React Router. No backend: state lives in a small React store with realistic sample data, and resets from the Demo menu.

## Structure

```
src/
  index.css            design tokens (Roma), three brand themes
  data/mock.ts         sample patients, encounters, tasks, visits
  store.tsx            app state, toasts, overlays
  components/ui.tsx    buttons, status chips, segmented control, tabs, modal, drawer, dropdown, tooltip
  components/Shell.tsx sidebar, top bar, page frame
  components/Overlays.tsx  search, notifications, help, dialogs, visit brief, demo menu
  pages/               one file per screen
```

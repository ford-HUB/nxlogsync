<p align="center">
  <img src="https://res.cloudinary.com/dhkp7er6i/image/upload/w_64,h_64,c_fit,f_png/v1791474970/logo-nxlogsync_nkk0ry.png" width="64" height="64" alt="NXLogSync logo" />
</p>

<h1 align="center">NXLogSync</h1>

<p align="center">
  Log your work hours once, and let NXLogSync keep N-PAX in sync for you.
</p>

---

## About

NXLogSync is a desktop app with a companion server that takes the repetitive work out of timesheets. You record your day in a simple daily log, choosing the job and work activity for each entry, and NXLogSync fills N-PAX for you on a schedule. It handles allocations, overtime rows and endorsement.

NXLogSync is the single source of truth for the days it syncs. Each synced day is cleared and rewritten in full on N-PAX, so the timesheet always matches what you logged and is never left half-filled.

On top of syncing, it produces the monthly and yearly reports the team needs, reminds you when hours are missing, and includes a few mini-games for short breaks.

## Features

### Daily log
- **Day-by-day entry list.** Add, edit and reorder entries, and drag one onto another to swap tasks.
- **Job and work activity lookup.** Your own N-PAX job list is loaded for your account, and you pick the job and activity yourself.
- **Hours summary.** A running total for the day, with the lunch break left out of work hours automatically.
- **Calendar and day picker.** Move between days with Today/Yesterday shortcuts and a month calendar. Days that are already fulfilled are marked.
- **Activity heatmap.** See how many entries you logged each day at a glance.
- **Trash bin.** Drag entries out to set them aside and restore them later.
- **Locked endorsed days.** Days already endorsed can't be edited by mistake.

### N-PAX sync
- **Scheduled auto-sync.** Pick a schedule mode and NXLogSync syncs your entries to N-PAX in the background.
- **Full-day sync.** Each day is cleared and replaced in full, which covers allocations, overtime and CLEAR rows.
- **Resync days.** Push selected days again, with a resync count kept per day.
- **Endorse days.** Endorse individual days, or turn on monthly auto-endorse with an email report.
- **Run history.** A paginated log of every sync run and its status, and you can clear recent syncs.
- **Secure credentials.** Your N-PAX credentials are stored encrypted on the server.

### Reports
- **Monthly entries report.** Export to PDF or Excel, with a print preview.
- **Yearly FEM & FEP maintenance workbook.** Fills the maintenance workbook and exports it as a workbook-style PDF, with activity graph series and sign-off stamp fields. FEM and FEP follow their own rules.

### Reminders and notifications
- **Scheduled reminder emails.** Get a nudge to log your hours on the days you choose.
- **Desktop notifications** and a **system tray mode**, so the app keeps working in the background.

### App experience
- **Passcode lock** to protect the app, with passcode reset.
- **Light and dark themes.**
- **Automatic updates**, plus a **What's New** page with release notes from each version.
- **Fast loading** thanks to skeleton screens and live data updates over sockets.

### Break-time games
- **Typing test** with a live leaderboard and real-time **1v1 typing duels**, including invites and a duel leaderboard.
- **Tetris** with rebindable controls saved to your account.
- **Run Yourself.** Speed Run and Pass or Fall rooms, with synced key bindings and progress.
- **Aim Lab.** An aim trainer with sensitivity settings, an FPS readout and leaderboards.

## Benefits

- **Saves time every day.** You log once, and NXLogSync does the N-PAX data entry.
- **Accurate timesheets.** Syncing a full day at a time means there are no partial or mismatched records, and lunch is excluded automatically.
- **Nothing gets forgotten.** Reminders, a schedule and auto-endorse keep your timesheet complete without you having to check.
- **Reports in one click.** Monthly and yearly FEM/FEP reports come straight from the hours you already logged.
- **Transparent.** Run history and per-day resync counts show exactly what was synced and when.
- **Secure.** Credentials are encrypted and the app sits behind a passcode.
- **Built for the team.** Shared leaderboards and duels make breaks a bit more social.

## Built with

| Layer   | Stack |
|---------|-------|
| Desktop | Electron, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand |
| Server  | NestJS, Prisma, PostgreSQL, Socket.IO, Puppeteer |
| Reports | ExcelJS, PDFKit, jsPDF |

---

<p align="center">Made by Cris Dyford</p>

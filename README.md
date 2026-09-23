# SPMS house events

Live board: https://intrinzix.github.io/spms-house-events-visual/

- `index.html` — the board. Tap **Edit events** to add, edit, finish or delete events on the page itself.
- `Code.gs` — the backend (Google Apps Script web app, no spreadsheet). Events are stored in the script's Script Properties.
- `events.json` — read-only fallback, only used while `API` in index.html is empty.

## Backend setup
1. https://script.google.com → New project → paste `Code.gs` → Save.
2. Deploy → New deployment → Web app. Execute as **Me**, access **Anyone**. Copy the `/exec` URL.
3. Set `const API = "<that URL>";` near the top of the script in index.html.

Optional passcode: set `PASSCODE` in the Apps Script copy only — don't commit it here, this repo is public.

Undo the last change: in the Apps Script editor, run `restoreBackup`.

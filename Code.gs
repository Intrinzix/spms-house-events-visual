/**
 * SPMS house events — backend for https://intrinzix.github.io/spms-house-events-visual/
 * No Google Sheet needed: events are stored in this script's own Script Properties.
 *
 * Setup (once):
 * 1. Go to https://script.google.com → New project. Replace everything with this file. Save.
 * 2. Deploy → New deployment → ⚙ → Web app.
 *      Execute as: Me      Who has access: Anyone
 *    Authorise when asked, then copy the Web app URL (ends in /exec).
 * 3. Put that URL in API = "..." near the top of the <script> in index.html.
 *
 * After editing this file later: Deploy → Manage deployments → ✏️ → Version: New version → Deploy
 * (keeps the same URL).
 */

const PASSCODE = '';   // '' = anyone with the link can edit. Set e.g. 'spms2026' to require a passcode.
const KEY = 'events';
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DIM = [31,29,31,30,31,30,31,31,30,31,30,31];
const VALID = ['so','pe','me','sa','so+pe','so+me','so+sa','pe+me','pe+sa','me+sa','all','hh'];

const SEED = [
  ['BYOG', 21, 'Oct', 'so+pe'],
  ['TNT', 23, 'Mar', 'so+me'],
  ['Movie Night', 16, 'Mar', 'so+sa'],
  ['D&D', 1, 'Apr', 'so+sa'],
  ['Sing & Sing & Sing', 28, 'Jan', 'pe+me'],
  ['Beyblade', 15, 'Feb', 'pe+me'],
  ['Paint your number', 12, 'Jan', 'pe+sa'],
  ['Homie Haven 2.0', 21, 'Jan', 'me+sa'],
  ['TSPMO', 8, 'Oct', 'all'],
  ['Valentines', 2, 'Feb', 'all'],
];

function doGet() {
  return json({ ok: true, events: load(), locked: !!PASSCODE });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'Bad request' }); }
  if (PASSCODE && String(req.passcode || '') !== PASSCODE) return json({ ok: false, error: 'passcode' });
  if (req.action === 'check') return json({ ok: true });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const events = load();
    if (req.action === 'save') {
      const ev = clean(req.event);
      if (!ev) return json({ ok: false, error: 'Check the name, date and houses.' });
      const i = events.findIndex(x => x.id === ev.id);
      if (i >= 0) events[i] = ev; else { ev.id = newId(); events.push(ev); }
    } else if (req.action === 'delete') {
      const i = events.findIndex(x => x.id === String(req.id || ''));
      if (i >= 0) events.splice(i, 1);
    } else {
      return json({ ok: false, error: 'Unknown action' });
    }
    save(events);
    return json({ ok: true, events: events });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */

function load() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(KEY);
  if (raw) { try { return JSON.parse(raw); } catch (err) {} }
  const seeded = SEED.map(s => ({ id: newId(), name: s[0], day: s[1], month: s[2], category: s[3], done: false }));
  props.setProperty(KEY, JSON.stringify(seeded));
  return seeded;
}

function save(events) {
  const props = PropertiesService.getScriptProperties();
  const prev = props.getProperty(KEY);
  if (prev) props.setProperty(KEY + '_backup', prev);   // one-step undo if something gets wiped
  props.setProperty(KEY, JSON.stringify(events));
}

/** Run this from the editor (select it → Run) to undo the most recent change. */
function restoreBackup() {
  const props = PropertiesService.getScriptProperties();
  const b = props.getProperty(KEY + '_backup');
  if (b) props.setProperty(KEY, b);
}

function clean(ev) {
  if (!ev) return null;
  const name = String(ev.name || '').trim().slice(0, 80);
  const day = Number(ev.day);
  const m = MON.indexOf(ev.month);
  const cat = String(ev.category || '');
  if (!name || m < 0 || !(day >= 1 && day <= DIM[m]) || VALID.indexOf(cat) < 0) return null;
  return { id: String(ev.id || ''), name: name, day: day, month: MON[m], category: cat, done: !!ev.done };
}

function newId() { return Utilities.getUuid().slice(0, 8); }

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

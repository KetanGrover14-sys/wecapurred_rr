import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Column layout for each sheet tab
const SCHEMA = {
  projects: ['id', 'name', 'client_name', 'description', 'photo_count', 'created_at'],
  photos:   ['id', 'project_id', 'image_url', 's3_key', 'location', 'length', 'breadth', 'height', 'material', 'notes', 'created_at'],
};

// ── Auth & client ─────────────────────────────────────────────────────────────

let _client;
async function getClient() {
  if (_client) return _client;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _client = google.sheets({ version: 'v4', auth });
  return _client;
}

// Cache numeric sheetIds so we don't re-fetch on every delete
let _tabIds = {};
async function getTabId(tabName) {
  if (_tabIds[tabName] != null) return _tabIds[tabName];
  const client = await getClient();
  const res = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  for (const s of res.data.sheets) {
    _tabIds[s.properties.title] = s.properties.sheetId;
  }
  return _tabIds[tabName];
}

// ── Header auto-init ──────────────────────────────────────────────────────────

const _ready = {};
async function ensureReady(tab) {
  if (_ready[tab]) return;
  const cols   = SCHEMA[tab];
  const client = await getClient();
  const res    = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1:1`,
  });
  if (!res.data.values?.[0]) {
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      resource: { values: [cols] },
    });
  }
  _ready[tab] = true;
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function rowToObj(cols, row) {
  const obj = {};
  cols.forEach((c, i) => { obj[c] = row[i] != null ? String(row[i]) : ''; });
  return obj;
}

async function readAll(tab) {
  await ensureReady(tab);
  const cols     = SCHEMA[tab];
  const lastCol  = String.fromCharCode(64 + cols.length);
  const client   = await getClient();
  const res      = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A2:${lastCol}`,
  });
  return (res.data.values || [])
    .map((row, i) => ({ ...rowToObj(cols, row), _row: i + 2 }))
    .filter(r => r.id);
}

async function appendRow(tab, obj) {
  await ensureReady(tab);
  const cols   = SCHEMA[tab];
  const client = await getClient();
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    resource: { values: [cols.map(c => String(obj[c] ?? ''))] },
  });
}

async function deleteRow(tab, rowIndex) {
  const sheetId = await getTabId(tab);
  const client  = await getClient();
  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: rowIndex - 1, endIndex: rowIndex },
        },
      }],
    },
  });
  // Invalidate tab ID cache since sheet structure may have shifted
  delete _tabIds[tab];
}

async function updateCell(tab, rowIndex, colName, value) {
  const cols      = SCHEMA[tab];
  const colLetter = String.fromCharCode(65 + cols.indexOf(colName));
  const client    = await getClient();
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!${colLetter}${rowIndex}`,
    valueInputOption: 'RAW',
    resource: { values: [[String(value)]] },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getProjects() {
  const rows = await readAll('projects');
  return rows
    .map(({ _row, ...r }) => ({ ...r, photo_count: parseInt(r.photo_count) || 0 }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getProjectById(id) {
  const rows  = await readAll('projects');
  const found = rows.find(r => r.id === id);
  if (!found) return null;
  const { _row, ...r } = found;
  return { ...r, photo_count: parseInt(r.photo_count) || 0 };
}

export async function insertProject(project) {
  await appendRow('projects', project);
}

export async function deleteProjectById(id) {
  // Delete all photos for this project first (bottom-up to preserve row indices)
  const photoRows = (await readAll('photos'))
    .filter(r => r.project_id === id)
    .sort((a, b) => b._row - a._row);
  for (const p of photoRows) await deleteRow('photos', p._row);

  // Re-read projects (photos are on a different sheet so indices are unaffected)
  const projRows = await readAll('projects');
  const row = projRows.find(r => r.id === id);
  if (row) await deleteRow('projects', row._row);
}

export async function getPhotosByProject(projectId) {
  const rows = await readAll('photos');
  return rows
    .filter(r => r.project_id === projectId)
    .map(({ _row, ...r }) => r)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getPhotoRowById(photoId) {
  const rows = await readAll('photos');
  return rows.find(r => r.id === photoId) || null;
}

export async function insertPhoto(photo) {
  await appendRow('photos', photo);
}

export async function deletePhotoById(photoId) {
  const row = await getPhotoRowById(photoId);
  if (!row) return null;
  await deleteRow('photos', row._row);
  const { _row, ...rest } = row;
  return rest;
}

export async function incrementPhotoCount(projectId, delta) {
  const rows = await readAll('projects');
  const row  = rows.find(r => r.id === projectId);
  if (!row) return;
  const newCount = Math.max(0, (parseInt(row.photo_count) || 0) + delta);
  await updateCell('projects', row._row, 'photo_count', newCount);
}

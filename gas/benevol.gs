/**
 * Apps Script Web App for collecting volunteer submissions (Bénévoles)
 * - Appends to the "Benevoles" sheet (created with headers if missing)
 * - Sends a notification email to buv.inscription@gmail.com
 *
 * Deploy: Publish > Deploy as web app > Execute as Me, Access Anyone with the link
 *
 * To target a specific spreadsheet, set SPREADSHEET_ID below.
 * Otherwise, the script will write to the bound spreadsheet (SpreadsheetApp.getActive()).
 */

// Put your Google Spreadsheet ID here. Find it between /d/ and /edit in the Sheet URL.
// Example: https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlmNoPqRS_tUVwXyZ-1234567890/edit
const SPREADSHEET_ID = "";

const BENEVOLES_SHEET_NAME = "Benevoles";
const BUV_NOTIFY_EMAIL = "buv.inscription@gmail.com";

/**
 * Entry point for POST requests from the website.
 * Expects a JSON payload (sent as text/plain) with fields:
 * {
 *   form_type: 'benevole', prenom, nom, birthdate, email, phone,
 *   tshirt, comment, shifts: string[], submitted_at
 * }
 */
function doPost(e) {
  try {
    Logger.log(
      "Raw postData type=%s length=%s",
      e && e.postData && e.postData.type,
      e && e.postData && e.postData.length
    );
    const payload = parseJsonPayload_(e);
    Logger.log("Parsed payload: %s", JSON.stringify(payload));
    if (!payload)
      return jsonOutput_({ ok: false, error: "Invalid payload" }, 400);

    // Basic spam check (honeypot not sent by our client, but keep for future)
    if (payload.website && String(payload.website).trim()) {
      return jsonOutput_({ ok: true, skipped: true });
    }

    const row = mapToRow_(payload);
    const sheet = getOrCreateSheet_(BENEVOLES_SHEET_NAME);
    ensureHeaders_(sheet);
    sheet.appendRow(row);

    notify_(payload);
    return jsonOutput_({ ok: true });
  } catch (err) {
    Logger.log("Error doPost: %s", err && err.stack ? err.stack : String(err));
    return jsonOutput_({ ok: false, error: String(err) }, 500);
  }
}

function parseJsonPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  const raw = e.postData.contents;
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Some clients may urlencode, try to decode then parse
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch (err2) {
      return null;
    }
  }
}

function getOrCreateSheet_(name) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getSpreadsheet_() {
  if (
    SPREADSHEET_ID &&
    typeof SPREADSHEET_ID === "string" &&
    SPREADSHEET_ID.trim()
  ) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActive();
}

function ensureHeaders_(sheet) {
  const headers = [
    "Timestamp",
    "Prenom",
    "Nom",
    "Birthdate",
    "Email",
    "Phone",
    "Tshirt",
    "Comment",
    "Raclette",
    "PhotoArrivee",
    "Shifts",
    "SubmittedAt",
    "FormType",
  ];
  const range = sheet.getRange(1, 1, 1, headers.length);
  const existing = range.getValues()[0];
  const isEmpty = existing.every((v) => !v);
  if (isEmpty) {
    range.setValues([headers]);
  }
}

function mapToRow_(p) {
  const shifts = Array.isArray(p.shifts) ? p.shifts.join(" | ") : "";
  return [
    new Date(),
    safe_(p.prenom),
    safe_(p.nom),
    safe_(p.birthdate),
    safe_(p.email),
    safe_(p.phone),
    safe_(p.tshirt),
    safe_(p.comment),
    safe_(p.raclette),
    safe_(p.photo_arrivee),
    shifts,
    safe_(p.submitted_at),
    safe_(p.form_type || "benevole"),
  ];
}

function notify_(p) {
  const subject = `Nouveau bénévole: ${safe_(p.prenom)} ${safe_(p.nom)}`;
  const lines = [
    "Un nouveau formulaire bénévole a été reçu:",
    "",
    `Nom: ${safe_(p.nom)}`,
    `Prénom: ${safe_(p.prenom)}`,
    `Date de naissance: ${safe_(p.birthdate)}`,
    `Email: ${safe_(p.email)}`,
    `Téléphone: ${safe_(p.phone)}`,
    `T-shirt: ${safe_(p.tshirt)}`,
    `Commentaire: ${safe_(p.comment)}`,
    `Raclette: ${safe_(p.raclette)}`,
    `Photo à l'arrivée (compétences/matériel): ${safe_(p.photo_arrivee)}`,
    "",
    "Shifts:",
    `${
      Array.isArray(p.shifts)
        ? p.shifts.map((s) => `- ${s}`).join("\n")
        : "(aucun)"
    }`,
    "",
    `Envoyé: ${safe_(p.submitted_at)}`,
  ];
  MailApp.sendEmail({
    to: BUV_NOTIFY_EMAIL,
    subject: subject,
    body: lines.join("\n"),
  });
}

function jsonOutput_(obj, status) {
  const output = ContentService.createTextOutput(
    JSON.stringify(obj)
  ).setMimeType(ContentService.MimeType.JSON);
  if (typeof status === "number" && output.setStatusCode) {
    try {
      output.setStatusCode(status);
    } catch (e) {}
  }
  return output;
}

function safe_(v) {
  return v === null || v === undefined ? "" : String(v);
}

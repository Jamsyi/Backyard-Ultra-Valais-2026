/**
 * Backyard Ultra Valais – Newsletter Subscriptions (Google Apps Script)
 *
 * What it does
 * - Receives newsletter subscribe requests from the website
 * - Stores emails in a dedicated Google Sheet tab
 *
 * Setup
 * 1) Create a Google Spreadsheet for newsletter emails
 * 2) Copy its ID below in NEWSLETTER_SHEET_ID
 * 3) Optionally change NEWSLETTER_SHEET_NAME (default 'Newsletter')
 * 4) This file is called from web_app.gs when action=subscribe
 */

// ====== CONFIGURE ME (Newsletter) ======
var NEWSLETTER_SHEET_ID = "1B_anNLLmTvwQ-y7_GITXvjYU4EJZaaG4mD7VvtKOstg"; // e.g. 1AbCdEf... from Sheet URL
var NEWSLETTER_SHEET_NAME = "Newsletter";
// =======================================

/**
 * Handler invoked from doPost in web_app.gs when fields.action === 'subscribe'
 * Returns a JSON ContentService output
 */
function handleNewsletterSubscribe_(fields) {
  try {
    var email = safe_(fields.email);
    var source = safe_(fields.source) || "home";

    if (!email || !isValidEmail_(email)) {
      return json_({ ok: false, error: "Invalid email" });
    }

    var sheet = getOrCreateSheet_(NEWSLETTER_SHEET_ID, NEWSLETTER_SHEET_NAME);
    ensureHeader_(sheet, ["Timestamp", "Email", "Source"]);
    sheet.appendRow([new Date(), email, source]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function isValidEmail_(email) {
  return /^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(String(email || "").trim());
}

/**
 * Standalone Web App entry point for newsletter-only deployment
 */
function doPost(e) {
  try {
    var fields = (e && e.parameter) ? e.parameter : {};
    // Also support JSON payloads (optional)
    if (e && e.postData && /application\/json/i.test(String(e.postData.type||''))) {
      try { fields = JSON.parse(String(e.postData.contents||'')||'{}'); } catch (_) {}
    }
    return handleNewsletterSubscribe_(fields);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// ---- Minimal helpers (duplicated for standalone deployment) ----
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function safe_(v) {
  if (v === void 0 || v === null) return "";
  if (Array.isArray(v)) return v.length ? String(v[0]) : "";
  return String(v);
}

function getOrCreateSheet_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function ensureHeader_(sheet, header) {
  var range = sheet.getRange(1, 1, 1, header.length);
  var values = range.getValues()[0];
  var needs = false;
  for (var i = 0; i < header.length; i++) {
    if (values[i] !== header[i]) { needs = true; break; }
  }
  if (needs) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

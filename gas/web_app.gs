/**
 * Backyard Ultra Valais – Registration Webhook (Google Apps Script)
 *
 * What it does
 * - Receives form submissions (multipart/form-data with optional file)
 * - Logs entries into a Google Sheet
 * - Sends an email to the organizers with details and the attachment
 *
 * How to use
 * 1) Create a Google Spreadsheet and copy its ID below (SHEET_ID)
 * 2) Optionally change SHEET_NAME (default 'Inscriptions') and DEST_EMAIL
 * 3) In Apps Script, paste this file into your project
 * 4) Deploy as Web App: Execute as Me, Anyone (even anonymous)
 * 5) Copy the Web App URL and set it into your site at js/main.js (GOOGLE_SHEETS_WEB_APP_URL)
 */

// ====== CONFIGURE ME ======
var SHEET_ID = "1J22hh3C9LCM4qPKiHWGGo9lS6cVH4uxsVY1eqviHO9E";
var SHEET_NAME = "Inscriptions";
var DEST_EMAIL = "buv.inscription@gmail.com";
var SUBJECT_PREFIX = "Inscription Backyard Ultra Valais";
// Save uploaded files to Google Drive (optional)
var DRIVE_FOLDER_ID = "1PpH5BnV9wmB_Z-Uv85sOsRjlfO_Ecaf1"; // e.g., 1AbCdEf... from the folder URL
var DRIVE_SHARE_PUBLIC = true; // set sharing to Anyone with the link (view)
// ===========================

/**
 * Entry point for form POSTs
 * Supports multipart/form-data (with file) and x-www-form-urlencoded (no file)
 */
function doPost(e) {
  try {
    if (!e || !e.postData) {
      return json_({ ok: false, error: "No postData" });
    }

    var contentType = String(e.postData.type || "");
    var fields, files;

    if (/multipart\/form-data/i.test(contentType)) {
      var parsed = parseMultipart_(e.postData.contents, contentType);
      fields = parsed.fields || {};
      files = parsed.files || [];
    } else if (/application\/json/i.test(contentType)) {
      try {
        var data = JSON.parse(e.postData.contents || "{}");
        fields = data && data.fields ? data.fields : data || {};
        files = [];
        // Support JSON-embedded file
        if (data && data.parental_doc && data.parental_doc.base64) {
          var jb = Utilities.base64Decode(data.parental_doc.base64);
          var jctype =
            data.parental_doc.contentType || "application/octet-stream";
          var jname = data.parental_doc.filename || "attachment";
          files.push({
            filename: jname,
            contentType: jctype,
            blob: Utilities.newBlob(jb, jctype, jname),
          });
        }
      } catch (jsonErr) {
        fields = {};
        files = [];
      }
    } else if (/text\/plain/i.test(contentType)) {
      // Some browsers send JSON as text/plain under no-cors; try to parse
      var txt = String(e.postData.contents || "");
      var parsedOk = false;
      try {
        if (txt && txt.trim().charAt(0) === "{") {
          var data2 = JSON.parse(txt);
          fields = data2 && data2.fields ? data2.fields : data2 || {};
          files = [];
          if (data2 && data2.parental_doc && data2.parental_doc.base64) {
            var jb2 = Utilities.base64Decode(data2.parental_doc.base64);
            var jctype2 =
              data2.parental_doc.contentType || "application/octet-stream";
            var jname2 = data2.parental_doc.filename || "attachment";
            files.push({
              filename: jname2,
              contentType: jctype2,
              blob: Utilities.newBlob(jb2, jctype2, jname2),
            });
          }
          parsedOk = true;
        }
      } catch (jsonErr2) {
        parsedOk = false;
      }
      if (!parsedOk) {
        fields = e.parameter || {};
        files = [];
      }
    } else if (/application\/x-www-form-urlencoded/i.test(contentType)) {
      fields = e.parameter || {};
      files = [];
    } else {
      // Default to parameters if unknown content type
      fields = e.parameter || {};
      files = [];
    }

    // Normalize + map
    var format = safe_(fields.format);
    var prenom = safe_(fields.prenom);
    var nom = safe_(fields.nom);
    var email = safe_(fields.email);
    var birthdate = safe_(fields.birthdate);
    var genre = safe_(fields.genre);
    var tshirt = safe_(fields.tshirt);

    var consentRaw = String(fields.agree_rules || "").toLowerCase();
    var consentFr = consentRaw === "yes" ? "Oui" : "Non";

    var attachment = null;
    var attachmentName = "";
    var driveFileUrl = "";
    var driveFileId = "";
    if (files && files.length) {
      attachment = files[0].blob;
      attachmentName =
        files[0].filename || (attachment ? attachment.getName() : "");
      // Save to Drive if configured
      try {
        if (
          attachment &&
          DRIVE_FOLDER_ID &&
          DRIVE_FOLDER_ID !== "PUT_YOUR_DRIVE_FOLDER_ID_HERE"
        ) {
          var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
          var saved = folder.createFile(attachment);
          if (attachmentName) {
            saved.setName(attachmentName);
          }
          if (DRIVE_SHARE_PUBLIC) {
            saved.setSharing(
              DriveApp.Access.ANYONE_WITH_LINK,
              DriveApp.Permission.VIEW
            );
          }
          driveFileUrl = saved.getUrl();
          driveFileId = saved.getId();
        }
      } catch (driveErr) {
        // ignore Drive errors but continue with email/Sheet
      }
    }

    // Append to Google Sheet
    var sheet = getOrCreateSheet_(SHEET_ID, SHEET_NAME);
    ensureHeader_(sheet, [
      "Timestamp",
      "Format",
      "Prénom",
      "Nom",
      "Email",
      "Date de naissance",
      "Genre",
      "T-shirt",
      "Règlement lu",
      "Pièce jointe",
      "Drive URL",
      "Drive File ID",
    ]);

    sheet.appendRow([
      new Date(),
      format,
      prenom,
      nom,
      email,
      birthdate,
      genre,
      tshirt,
      consentFr,
      attachmentName,
      driveFileUrl,
      driveFileId,
    ]);

    // Send email to organizer
    var subject = SUBJECT_PREFIX + " - " + (format || "Format");
    var bodyLines = [
      "Nouvelle inscription:",
      "",
      "Format: " + format,
      "Prénom: " + prenom,
      "Nom: " + nom,
      "Email: " + email,
      "Date de naissance: " + birthdate,
      "Genre: " + genre,
      "T-shirt: " + tshirt,
      "",
      "Règlement lu: " + consentFr,
      attachmentName
        ? "Pièce jointe: " + attachmentName
        : "Pièce jointe: (aucune)",
      driveFileUrl ? "Lien Drive: " + driveFileUrl : "Lien Drive: (aucun)",
    ];

    if (attachment) {
      MailApp.sendEmail({
        to: DEST_EMAIL,
        subject: subject,
        body: bodyLines.join("\n"),
        attachments: [attachment],
      });
    } else {
      MailApp.sendEmail(DEST_EMAIL, subject, bodyLines.join("\n"));
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
}

// ---------------- Helpers ----------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
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
    if (values[i] !== header[i]) {
      needs = true;
      break;
    }
  }
  if (needs) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

/**
 * Minimal multipart/form-data parser
 * Returns { fields: {name:value}, files: [{filename, contentType, blob}] }
 * Note: This parser works for common cases. Binary PDFs generally parse fine,
 * but if you see corrupted attachments, consider Base64 from client.
 */
function parseMultipart_(rawContents, contentTypeHeader) {
  var out = { fields: {}, files: [] };
  if (!rawContents || !contentTypeHeader) return out;

  var m = /boundary=([^;]+)/i.exec(contentTypeHeader);
  if (!m) return out;
  var boundary = "--" + m[1];

  var parts = String(rawContents).split(boundary);
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part || part === "--\r\n" || part === "--") continue;

    var sections = part.split("\r\n\r\n");
    if (sections.length < 2) continue;

    var rawHeaders = sections[0];
    var body = sections.slice(1).join("\r\n\r\n");

    // Trim trailing CRLF from body
    if (body.endsWith("\r\n")) body = body.substring(0, body.length - 2);

    var headers = parseHeaders_(rawHeaders);
    var disp = headers["content-disposition"] || "";

    var nameMatch = /name="([^"]+)"/i.exec(disp);
    var fileMatch = /filename="([^"]*)"/i.exec(disp);

    var fieldName = nameMatch ? nameMatch[1] : "";
    var filename = fileMatch ? fileMatch[1] : "";

    if (!fieldName) continue;

    if (filename) {
      var ctype = headers["content-type"] || "application/octet-stream";
      var blob = Utilities.newBlob(body, ctype, filename);
      out.files.push({ filename: filename, contentType: ctype, blob: blob });
    } else {
      out.fields[fieldName] = body;
    }
  }
  return out;
}

function parseHeaders_(raw) {
  var lines = String(raw).split("\r\n");
  var headers = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var idx = line.indexOf(":");
    if (idx === -1) continue;
    var key = line.substring(0, idx).toLowerCase().trim();
    var val = line.substring(idx + 1).trim();
    headers[key] = val;
  }
  return headers;
}

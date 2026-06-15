const REPORT_HEADERS = [
  "created_at",
  "date_label",
  "uf",
  "city",
  "category",
  "indicator_type",
  "indicator",
  "risk",
  "loss",
  "company",
  "profile",
  "age",
  "sex",
  "education",
  "channel",
  "growth",
  "report_text",
];

const LOOKUP_HEADERS = [
  "created_at",
  "date_label",
  "query_type",
  "query_hash",
  "query_domain",
  "score",
  "label",
  "suspicious",
  "high_risk",
  "signals",
  "known_match_count",
  "report_match_count",
];

function doGet(e) {
  const action = ((e && e.parameter && e.parameter.action) || "").trim();
  const sheetName = ((e && e.parameter && e.parameter.sheet) || "").trim();

  if (action === "listReports") {
    return jsonResponse({ ok: true, items: listRows_(sheetName || "denuncias", REPORT_HEADERS) });
  }
  if (action === "listLookups") {
    return jsonResponse({ ok: true, items: listRows_(sheetName || "consultas", LOOKUP_HEADERS) });
  }
  return jsonResponse({ ok: false, error: "unsupported_action" });
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const action = (params.action || "").trim();
  const sheetName = (params.sheet || "").trim();
  const payload = parsePayload_(params.payload);

  if (action === "createReport") {
    appendRow_(sheetName || "denuncias", REPORT_HEADERS, payload);
    return jsonResponse({ ok: true });
  }
  if (action === "createLookup") {
    appendRow_(sheetName || "consultas", LOOKUP_HEADERS, payload);
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: false, error: "unsupported_action" });
}

function parsePayload_(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch (error) {
    return {};
  }
}

function getSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const missing = headers.some((header, index) => existing[index] !== header);
  if (missing) {
    sheet.clearContents();
    sheet.appendRow(headers);
  }
}

function appendRow_(sheetName, headers, payload) {
  const sheet = getSheet_(sheetName);
  ensureHeaders_(sheet, headers);
  const row = headers.map((header) => {
    if (header === "created_at") {
      return new Date().toISOString();
    }
    const value = payload[header];
    if (Array.isArray(value)) {
      return value.join("|");
    }
    return value === undefined || value === null ? "" : value;
  });
  sheet.appendRow(row);
}

function listRows_(sheetName, headers) {
  const sheet = getSheet_(sheetName);
  ensureHeaders_(sheet, headers);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .map((row) => headers.reduce((acc, header, index) => {
      acc[header] = row[index];
      return acc;
    }, {}))
    .reverse();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

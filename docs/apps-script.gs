var REPORT_HEADERS = [
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
  "report_text"
];

var LOOKUP_HEADERS = [
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
  "report_match_count"
];

function doGet(e) {
  var action = ((e && e.parameter && e.parameter.action) || "").trim();
  var sheetName = ((e && e.parameter && e.parameter.sheet) || "").trim();

  if (action === "listReports") {
    return jsonResponse({
      ok: true,
      items: listRows_(sheetName || "denuncias", REPORT_HEADERS)
    });
  }

  if (action === "listLookups") {
    return jsonResponse({
      ok: true,
      items: listRows_(sheetName || "consultas", LOOKUP_HEADERS)
    });
  }

  return jsonResponse({ ok: false, error: "unsupported_action" });
}

function doPost(e) {
  var params = (e && e.parameter) || {};
  var action = (params.action || "").trim();
  var sheetName = (params.sheet || "").trim();
  var payload = parsePayload_(params.payload);

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
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);

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

  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var missing = false;
  var index;

  for (index = 0; index < headers.length; index += 1) {
    if (existing[index] !== headers[index]) {
      missing = true;
      break;
    }
  }

  if (missing) {
    sheet.clearContents();
    sheet.appendRow(headers);
  }
}

function appendRow_(sheetName, headers, payload) {
  var sheet = getSheet_(sheetName);
  var row = [];
  var index;
  var header;
  var value;

  ensureHeaders_(sheet, headers);

  for (index = 0; index < headers.length; index += 1) {
    header = headers[index];

    if (header === "created_at") {
      row.push(new Date().toISOString());
      continue;
    }

    value = payload[header];

    if (Array.isArray(value)) {
      row.push(value.join("|"));
    } else if (value === undefined || value === null) {
      row.push("");
    } else {
      row.push(value);
    }
  }

  sheet.appendRow(row);
}

function listRows_(sheetName, headers) {
  var sheet = getSheet_(sheetName);
  var lastRow;
  var values;
  var items = [];
  var rowIndex;
  var colIndex;
  var item;

  ensureHeaders_(sheet, headers);
  lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  for (rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
    item = {};

    for (colIndex = 0; colIndex < headers.length; colIndex += 1) {
      item[headers[colIndex]] = values[rowIndex][colIndex];
    }

    items.push(item);
  }

  items.reverse();
  return items;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

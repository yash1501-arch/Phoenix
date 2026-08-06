/**
 * Heuristic trek-brochure parser — no AI required.
 * Used when OpenAI is unavailable or returns an error.
 */

const PRICE_RE = /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi;
const DATE_RE = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
const DATE_WORD_RE = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/gi;

const MONTH_MAP = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function normalizeLines(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(y, m, d) {
  const year = y < 100 ? 2000 + y : y;
  if (!year || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = `${year}-${pad2(m)}-${pad2(d)}`;
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return iso;
}

function extractDates(text) {
  const seen = new Set();
  const out = [];

  const add = (iso) => {
    if (iso && !seen.has(iso)) {
      seen.add(iso);
      out.push(iso);
    }
  };

  let m;
  const copy1 = text;
  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(copy1)) !== null) {
    let d = Number(m[1]);
    let mo = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    // Heuristic: if first part > 12, treat as DD/MM/YYYY (India)
    if (d > 12 && mo <= 12) {
      add(toIsoDate(y, mo, d));
    } else if (mo > 12 && d <= 12) {
      add(toIsoDate(y, d, mo));
    } else {
      add(toIsoDate(y, mo, d));
    }
  }

  DATE_WORD_RE.lastIndex = 0;
  while ((m = DATE_WORD_RE.exec(text)) !== null) {
    const d = Number(m[1]);
    const mo = MONTH_MAP[m[2].toLowerCase()];
    const y = Number(m[3]);
    add(toIsoDate(y, mo, d));
  }

  return out.sort();
}

function extractPrice(text) {
  const amounts = [];
  let m;
  PRICE_RE.lastIndex = 0;
  while ((m = PRICE_RE.exec(text)) !== null) {
    const n = Number(String(m[1]).replace(/,/g, ''));
    if (Number.isFinite(n) && n >= 100) amounts.push(n);
  }
  if (amounts.length === 0) return null;
  // Prefer full trek price (usually largest, ignore small advance deposits)
  const sorted = [...amounts].sort((a, b) => b - a);
  const full = sorted.find((n) => n >= 500) || sorted[0];
  return full;
}

function extractSection(lines, startPatterns, stopPatterns) {
  const startIdx = lines.findIndex((line) =>
    startPatterns.some((re) => re.test(line))
  );
  if (startIdx === -1) return [];

  const items = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (stopPatterns.some((re) => re.test(line))) break;
    if (/^(page \d+|www\.|http|@)/i.test(line)) continue;

    const bullet = line.replace(/^[\-•*✓✔►▪●\d]+[\.\)\]]\s*/, '').trim();
    if (bullet.length >= 3 && bullet.length < 200) {
      items.push(bullet);
    }
    if (items.length >= 25) break;
  }
  return items;
}

function guessTitle(lines) {
  const skip = /^(phoenix|trek|adventure|www\.|http|page \d+)/i;
  for (const line of lines.slice(0, 12)) {
    if (line.length >= 4 && line.length <= 80 && !skip.test(line) && !PRICE_RE.test(line)) {
      return line.replace(/\s+/g, ' ');
    }
  }
  return lines[0] || null;
}

function guessDifficulty(text) {
  const t = text.toLowerCase();
  if (/\b(challenging|difficult|hard)\b/.test(t)) return 'Challenging';
  if (/\b(easy|beginner)\b/.test(t)) return 'Easy';
  if (/\b(moderate|medium)\b/.test(t)) return 'Moderate';
  return null;
}

function guessDuration(text) {
  const m = text.match(/\b(\d+)\s*(day|days|night|nights)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2].toLowerCase().startsWith('night')) {
    return n === 1 ? '1 Night' : `${n} Nights`;
  }
  return n === 1 ? '1 Day' : `${n} Days`;
}

/**
 * @param {string} text Raw PDF text
 * @returns {object} Partial adventure fields
 */
function parseBrochureText(text) {
  const lines = normalizeLines(text);
  const blob = lines.join('\n');

  const title = guessTitle(lines);
  const price = extractPrice(blob);
  const available_dates = extractDates(blob);

  const things_to_carry = extractSection(
    lines,
    [/things to carry|what to (bring|pack)|packing list/i],
    [/pickup|do'?s|don'?ts|itinerary|included|price|contact/i]
  );

  const pickup_mumbai = extractSection(
    lines,
    [/pickup.*mumbai|mumbai pickup|reporting.*mumbai/i],
    [/pickup.*pune|pune pickup|things to carry|do'?s/i]
  );

  const pickup_pune = extractSection(
    lines,
    [/pickup.*pune|pune pickup|reporting.*pune/i],
    [/things to carry|do'?s|don'?ts|included|price/i]
  );

  const dos = extractSection(
    lines,
    [/^do'?s\b/i, /do'?s and/i],
    [/don'?ts|things to carry|pickup|guidelines/i]
  );

  const donts = extractSection(
    lines,
    [/^don'?ts\b/i, /do'?s and don'?ts/i],
    [/things to carry|pickup|guidelines|included/i]
  );

  const trek_guidelines = extractSection(
    lines,
    [/guidelines|rules|important note/i],
    [/contact|price|pickup|included/i]
  );

  const included = extractSection(
    lines,
    [/what'?s included|included\b/i],
    [/excluded|not included|things to carry/i]
  );

  const excluded = extractSection(
    lines,
    [/excluded|not included/i],
    [/things to carry|pickup|price/i]
  );

  // Description: first few lines after title
  const titleIdx = title ? lines.indexOf(title) : 0;
  const descLines = lines.slice(titleIdx + 1, titleIdx + 5).filter((l) => l.length > 30);
  const description = descLines.length ? descLines.join(' ') : null;

  const elevationMatch = blob.match(/(\d[\d,]*)\s*(?:ft|feet|m)\b/i);
  const regionMatch = blob.match(/\b(Karjat|Alibaug|Bhandardara|Lonavala|Matheran|Igatpuri|Kalsubai|Rajmachi)\b/i);

  return {
    title,
    description,
    location: regionMatch ? regionMatch[1] : null,
    region: regionMatch ? regionMatch[1] : null,
    elevation: elevationMatch ? elevationMatch[0] : null,
    duration: guessDuration(blob),
    difficulty: guessDifficulty(blob),
    price,
    available_dates,
    included,
    excluded,
    things_to_carry,
    pickup_mumbai,
    pickup_pune,
    dos,
    donts,
    trek_guidelines,
    _parser: 'heuristic',
  };
}

module.exports = { parseBrochureText, normalizeLines };

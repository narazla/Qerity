import { OJK_LEGAL_LIST } from '../data/ojkLegalList';

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/^pt\.?\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      previous = current;
    }
  }
  return row[b.length];
}

export function checkLegality(inputName) {
  if (!inputName || !inputName.trim()) {
    return { status: 'skipped' };
  }

  const query = normalize(inputName);
  if (query.length < 3) {
    return { status: 'not_found', reason: 'input_too_short' };
  }

  const exactMatch = OJK_LEGAL_LIST.find((entry) => {
    const app = normalize(entry.app);
    const company = normalize(entry.company);
    return app === query || company === query;
  });
  if (exactMatch) return { status: 'legal', match: exactMatch };

  // Approximate 20% distance is a heuristic and should be calibrated with real names.
  const similarMatch = OJK_LEGAL_LIST
    .map((entry) => {
      const candidates = [normalize(entry.app), normalize(entry.company)];
      const distance = Math.min(...candidates.map((candidate) => levenshtein(query, candidate)));
      const maxLength = Math.max(query.length, ...candidates.map((candidate) => candidate.length));
      return { entry, distance, maxLength };
    })
    .filter(({ distance, maxLength }) => distance <= Math.max(1, Math.ceil(maxLength * 0.2)))
    .sort((a, b) => a.distance - b.distance)[0];

  if (similarMatch) {
    return {
      status: 'similar',
      match: similarMatch.entry,
      distance: similarMatch.distance,
    };
  }

  return { status: 'not_found' };
}
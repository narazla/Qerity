import { OJK_LEGAL_LIST } from '../data/ojkLegalList';

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/^pt\.?\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function distance(a, b) {
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

function similarityRatio(a, b) {
  const dist = distance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - dist / maxLen;
}

const SIMILARITY_RATIO_THRESHOLD = 0.8; // Heuristic; calibrate with real lender-name variations.
const MAX_SIMILAR_LENGTH_DIFFERENCE = 2; // Heuristic; prevents short unrelated names from matching.

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

  const similarMatch = OJK_LEGAL_LIST
    .flatMap((entry) => [entry.app, entry.company].map((name) => ({ entry, name: normalize(name) })))
    .map(({ entry, name }) => {
      const ratio = similarityRatio(query, name);
      const lengthDifference = Math.abs(query.length - name.length);
      const shorterLength = Math.min(query.length, name.length);
      const contains = shorterLength >= 5 && (query.includes(name) || name.includes(query));
      return {
        entry,
        distance: distance(query, name),
        ratio,
        qualifies: (ratio >= SIMILARITY_RATIO_THRESHOLD && lengthDifference <= MAX_SIMILAR_LENGTH_DIFFERENCE) || contains,
      };
    })
    .filter((candidate) => candidate.qualifies)
    .sort((a, b) => b.ratio - a.ratio || a.distance - b.distance)[0];

  if (similarMatch) {
    return {
      status: 'similar',
      match: similarMatch.entry,
      distance: similarMatch.distance,
      similarity: similarMatch.ratio,
    };
  }

  return { status: 'not_found' };
}

export function describeLegality(result, inputName) {
  if (result.status === 'legal') {
    return `"${result.match.app}" (${result.match.company}) appears in the OJK list.`;
  }
  if (result.status === 'similar') {
    return `"${inputName}" is similar to "${result.match.app}", but the names do not match exactly.`;
  }
  if (result.status === 'not_found' && result.reason === 'input_too_short') {
    return 'Please enter at least 3 characters.';
  }
  if (result.status === 'not_found') {
    return `"${inputName}" was not found in the limited OJK list.`;
  }
  return 'Please enter a lender or company name.';
}
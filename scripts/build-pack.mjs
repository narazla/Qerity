import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index].replace(/^--/, ''), process.argv[index + 1]);
const version = Number(args.get('version'));
const expiryDays = Number(args.get('expiry-days'));
const sourceName = args.get('source-name');
const snapshotDate = args.get('snapshot-date');
const sourceNote = args.get('source-note');
const usage = 'Usage: node scripts/build-pack.mjs --version 1 --expiry-days 30 --snapshot-date 2026-07-04 --source-name "OJK" --source-note "Reviewed snapshot"';

function fail(message) {
  console.error(`Error: ${message}`);
  console.error(usage);
  process.exit(1);
}

if (!Number.isInteger(version) || version < 1) fail('--version must be a positive integer.');
if (!Number.isFinite(expiryDays) || expiryDays <= 0) fail('--expiry-days must be a positive number.');
if (!sourceName || !sourceName.trim()) fail('--source-name is required and cannot be empty.');
if (!snapshotDate) fail('--snapshot-date is required and must use YYYY-MM-DD.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) fail('--snapshot-date must use YYYY-MM-DD.');
const parsedSnapshotDate = new Date(`${snapshotDate}T00:00:00.000Z`);
if (Number.isNaN(parsedSnapshotDate.getTime()) || parsedSnapshotDate.toISOString().slice(0, 10) !== snapshotDate) {
  fail('--snapshot-date must be a valid calendar date in YYYY-MM-DD format.');
}
if (sourceNote === undefined || !sourceNote.trim()) fail('--source-note is required and cannot be empty.');

function readExport(filePath, exportName) {
  const source = readFileSync(filePath, 'utf8');
  const match = source.match(new RegExp(`export const ${exportName} = ([\\s\\S]*?);`));
  if (!match) throw new Error(`Could not read ${exportName}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

const issuedAt = new Date().toISOString();
const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
const pack = {
  schemaVersion: 1,
  version,
  issuedAt,
  expiresAt,
  source: { name: sourceName, snapshotDate, note: sourceNote.trim() },
  ojk: readExport('data/ojkLegalList.js', 'OJK_LEGAL_LIST'),
  scamHashes: readExport('data/knownScamHashes.js', 'KNOWN_SCAM_HASHES'),
};
mkdirSync('publish', { recursive: true });
writeFileSync('publish/datapack.json', JSON.stringify(pack, null, 2));
console.log('Wrote publish/datapack.json');
console.log(`version: ${version}`);
console.log(`issuedAt: ${issuedAt}`);
console.log(`expiresAt: ${expiresAt}`);
console.log(`snapshotDate: ${snapshotDate}`);
console.log(`source name: ${sourceName}`);
console.log(`source note: ${sourceNote.trim()}`);
console.log(usage);

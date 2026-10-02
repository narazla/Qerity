import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index].replace(/^--/, ''), process.argv[index + 1]);
const version = Number(args.get('version'));
const expiryDays = Number(args.get('expiry-days'));
const sourceName = args.get('source-name');
const note = args.get('note') || '';
if (!Number.isInteger(version) || version < 1 || !Number.isFinite(expiryDays) || !sourceName) {
  throw new Error('Usage: node scripts/build-pack.mjs --version 1 --expiry-days 30 --source-name "OJK" --note "..."');
}

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
  source: { name: sourceName, snapshotDate: new Date().toISOString().slice(0, 10), note },
  ojk: readExport('data/ojkLegalList.js', 'OJK_LEGAL_LIST'),
  scamHashes: readExport('data/knownScamHashes.js', 'KNOWN_SCAM_HASHES'),
};
mkdirSync('publish', { recursive: true });
writeFileSync('publish/datapack.json', JSON.stringify(pack, null, 2));
console.log(`Wrote publish/datapack.json version ${version}`);

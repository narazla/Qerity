import assert from 'node:assert/strict';
import { generateKeyPairSync, sign as signWithKey } from 'node:crypto';
import test from 'node:test';
import { verifyPack } from '../utils/verifyPack.js';

const now = '2026-08-01T00:00:00.000Z';
const pack = {
  schemaVersion: 1,
  version: 2,
  issuedAt: '2026-07-01T00:00:00.000Z',
  expiresAt: '2026-09-01T00:00:00.000Z',
  source: { name: 'Test', snapshotDate: '2026-07-01', note: '' },
  ojk: [{ app: 'Test', company: 'PT Test' }],
  scamHashes: [],
};
const raw = JSON.stringify(pack);
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const { publicKey: otherPublicKey, privateKey: otherPrivateKey } = generateKeyPairSync('ed25519');
const publicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
const otherPublicKeyBase64 = otherPublicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
const signature = signWithKey(null, Buffer.from(raw), privateKey).toString('base64');
const otherSignature = signWithKey(null, Buffer.from(raw), otherPrivateKey).toString('base64');

test('accepts a valid pack', () => {
  assert.equal(verifyPack(raw, signature, publicKeyBase64, { now, currentVersion: 1 }).ok, true);
});

test('rejects a changed character', () => {
  const changed = `${raw.slice(0, -1)} }`;
  assert.equal(verifyPack(changed, signature, publicKeyBase64, { now }).reason, 'bad_signature');
});

test('rejects a signature from a different key', () => {
  assert.equal(verifyPack(raw, otherSignature, publicKeyBase64, { now }).reason, 'bad_signature');
  assert.equal(verifyPack(raw, signature, otherPublicKeyBase64, { now }).reason, 'bad_signature');
});

test('rejects an older or equal version during update', () => {
  assert.equal(verifyPack(raw, signature, publicKeyBase64, { now, currentVersion: 3 }).reason, 'version_not_newer');
  assert.equal(verifyPack(raw, signature, publicKeyBase64, { now, currentVersion: 2 }).reason, 'version_not_newer');
});

test('rejects an expired pack', () => {
  assert.equal(verifyPack(raw, signature, publicKeyBase64, { now: '2026-10-01T00:00:00.000Z' }).reason, 'expired');
});

test('rejects malformed JSON', () => {
  const malformed = '{"schemaVersion":1';
  const malformedSignature = signWithKey(null, Buffer.from(malformed), privateKey).toString('base64');
  assert.equal(verifyPack(malformed, malformedSignature, publicKeyBase64, { now }).reason, 'malformed_json');
});

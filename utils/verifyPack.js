import nacl from 'tweetnacl';

const EXPECTED_SCHEMA_VERSION = 1;

function fromBase64(value) {
  if (typeof value !== 'string' || !value) throw new Error('invalid_base64');
  if (typeof atob === 'function') {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

function isIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function verifyPack(rawJsonText, signatureBase64, publicKeyBase64, options = {}) {
  let signature;
  let publicKey;
  try {
    signature = fromBase64(signatureBase64);
    publicKey = fromBase64(publicKeyBase64);
  } catch {
    return { ok: false, reason: 'invalid_signature_encoding' };
  }

  if (signature.length !== nacl.sign.signatureLength || publicKey.length !== nacl.sign.publicKeyLength) {
    return { ok: false, reason: 'invalid_signature_encoding' };
  }

  const message = new TextEncoder().encode(rawJsonText);
  if (!nacl.sign.detached.verify(message, signature, publicKey)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let pack;
  try {
    pack = JSON.parse(rawJsonText);
  } catch {
    return { ok: false, reason: 'malformed_json' };
  }

  if (!pack || pack.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    return { ok: false, reason: 'schema_version_mismatch' };
  }
  if (!Number.isInteger(pack.version) || pack.version < 1) {
    return { ok: false, reason: 'invalid_version' };
  }
  if (!isIsoDate(pack.issuedAt) || !isIsoDate(pack.expiresAt) || !pack.source || !Array.isArray(pack.ojk) || !Array.isArray(pack.scamHashes)) {
    return { ok: false, reason: 'invalid_pack_shape' };
  }

  const now = options.now ? new Date(options.now) : new Date();
  if (Number.isNaN(now.getTime()) || now.getTime() >= Date.parse(pack.expiresAt)) {
    return { ok: false, reason: 'expired' };
  }
  if (options.currentVersion !== undefined && pack.version <= options.currentVersion) {
    return { ok: false, reason: 'version_not_newer' };
  }

  return { ok: true, reason: 'valid', pack };
}

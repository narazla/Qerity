import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const privateKeyPath = resolve(process.argv[2] || '../qerity-keys/data-pack-private.pem');
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

mkdirSync(dirname(privateKeyPath), { recursive: true });
writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
console.log(`Private key written to ${privateKeyPath}`);
console.log(`Public key (base64): ${publicKey.subarray(-32).toString('base64')}`);

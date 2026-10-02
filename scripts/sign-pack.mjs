import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const keyPath = process.env.QERITY_PRIVATE_KEY_PATH;
if (!keyPath) throw new Error('QERITY_PRIVATE_KEY_PATH is required');
const privateKey = createPrivateKey(readFileSync(keyPath));
const signature = sign(null, readFileSync('publish/datapack.json'), privateKey);
writeFileSync('publish/datapack.sig', signature.toString('base64'));
console.log('Wrote publish/datapack.sig');

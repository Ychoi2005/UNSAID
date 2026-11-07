import type { Envelope, VaultData } from "../../types/vault";
import {
  validateData,
  validateEnvelope,
  validatePassphrase,
} from "../validation/vault";
const encoder = new TextEncoder();
const aad = encoder.encode("UNSAID local vault / schema 1");
export function toBase64(bytes: Uint8Array): string {
  let value = "";
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function seal(
  data: VaultData,
  key: CryptoKey,
  salt: string,
  revision: number,
): Promise<Envelope> {
  const plain = encoder.encode(JSON.stringify(validateData(data)));
  if (plain.byteLength > 20_000_000)
    throw new Error(
      "This vault exceeds the 20 MB prototype limit. Export a backup before changing your collection.",
    );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    key,
    plain,
  );
  plain.fill(0);
  return {
    format: "unsaid-vault",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: 600000,
    salt,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    revision,
  };
}
export async function createEnvelope(data: VaultData, passphrase: string) {
  validatePassphrase(passphrase);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  return { key, envelope: await seal(data, key, toBase64(salt), 1) };
}
export async function openEnvelope(input: unknown, passphrase: string) {
  const envelope = validateEnvelope(input);
  const key = await deriveKey(passphrase, fromBase64(envelope.salt));
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(envelope.iv),
        additionalData: aad,
        tagLength: 128,
      },
      key,
      fromBase64(envelope.ciphertext),
    );
  } catch {
    throw new Error(
      "Could not unlock. Check the passphrase, or the backup may be damaged.",
    );
  }
  try {
    return {
      key,
      data: validateData(JSON.parse(new TextDecoder().decode(plain))),
      envelope,
    };
  } finally {
    new Uint8Array(plain).fill(0);
  }
}

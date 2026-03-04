// vaultCrypto.js — Local vault encryption utilities
// Uses only the native Web Crypto API. No dependencies, no keys stored anywhere.
// AES-GCM 256-bit with PBKDF2 key derivation (100k iterations, SHA-256).

const PBKDF2_ITERATIONS = 100_000;

function uint8ToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToUint8(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Generate a random 16-byte salt, returned as a base64 string.
 * Call once at vault creation time; store in vault registry alongside encrypted data.
 */
export function generateSalt() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return uint8ToBase64(bytes);
}

/**
 * Derive an AES-GCM-256 CryptoKey from a password + base64-encoded salt using PBKDF2.
 * The derived key is not extractable — it cannot be read out of memory.
 *
 * @param {string} password  — user-provided passphrase
 * @param {string} saltB64   — base64 salt stored in vault registry
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(password, saltB64) {
  const enc = new TextEncoder();
  const salt = base64ToUint8(saltB64);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a notes array with AES-GCM-256.
 * A fresh 12-byte (96-bit) IV is generated on every call — never reuse an IV.
 *
 * @param {Array}     notes — plaintext notes array
 * @param {CryptoKey} key   — derived key from deriveKey()
 * @returns {Promise<{ iv: string, data: string }>} — both values are base64
 */
export async function encryptNotes(notes, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(notes));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  return {
    iv: uint8ToBase64(iv),
    data: uint8ToBase64(new Uint8Array(ciphertext)),
  };
}

/**
 * Decrypt a vault payload back to a notes array.
 * AES-GCM authentication guarantees integrity — throws DOMException if the password
 * is wrong or data is tampered with. The caller should surface this as "wrong password".
 *
 * @param {string}    ivB64   — base64 IV from vault data
 * @param {string}    dataB64 — base64 ciphertext from vault data
 * @param {CryptoKey} key     — derived key from deriveKey()
 * @returns {Promise<Array>}  — plaintext notes array
 */
export async function decryptNotes(ivB64, dataB64, key) {
  const iv = base64ToUint8(ivB64);
  const ciphertext = base64ToUint8(dataB64);

  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plaintext));
}

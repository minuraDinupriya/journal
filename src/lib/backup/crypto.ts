import crypto from "crypto";

const MAGIC_HEADER = Buffer.from("TJBACKUP"); // 8 bytes
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;
const DIGEST = "sha256";

/**
 * Check if the given buffer is an encrypted Trade Journal backup.
 */
export function isEncryptedBackup(buffer: Buffer): boolean {
  if (buffer.length < MAGIC_HEADER.length + SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    return false;
  }
  return buffer.subarray(0, MAGIC_HEADER.length).equals(MAGIC_HEADER);
}

/**
 * Encrypts a raw zip buffer using AES-256-GCM and PBKDF2 key derivation.
 */
export function encryptBackup(plainBuffer: Buffer, password: string): Buffer {
  if (!password || password.trim() === "") {
    throw new Error("Password cannot be empty for encryption");
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // File structure: MAGIC_HEADER (8) | SALT (32) | IV (16) | AUTH_TAG (16) | CIPHERTEXT (...)
  return Buffer.concat([MAGIC_HEADER, salt, iv, authTag, ciphertext]);
}

/**
 * Decrypts an encrypted backup buffer using AES-256-GCM.
 */
export function decryptBackup(encryptedBuffer: Buffer, password: string): Buffer {
  if (!isEncryptedBackup(encryptedBuffer)) {
    throw new Error("Invalid backup format: missing encryption signature");
  }

  if (!password || password.trim() === "") {
    throw new Error("This backup is password-protected. Please enter your backup password.");
  }

  let offset = MAGIC_HEADER.length;

  const salt = encryptedBuffer.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = encryptedBuffer.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const authTag = encryptedBuffer.subarray(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;

  const ciphertext = encryptedBuffer.subarray(offset);

  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch {
    throw new Error("Incorrect backup password or corrupted file.");
  }
}

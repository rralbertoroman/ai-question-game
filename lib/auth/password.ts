import { hash, verify } from '@node-rs/argon2';

// Argon2 configuration
const hashOptions = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, hashOptions);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return await verify(hash, password);
}

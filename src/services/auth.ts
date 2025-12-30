import crypto from "crypto";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { refreshTokens } from "../db/schema";
import { ACCESS_TOKEN_TTL, JWT_SECRET, REFRESH_TOKEN_TTL_DAYS } from "../config/env";

type JwtPayload = { sub?: string };

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function makeRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = makeRefreshToken();
  const now = Date.now();
  const expiresAt = new Date(now + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return token;
}

export async function revokeRefreshToken(tokenHash: string, revokedAt: Date): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllRefreshTokensForUser(
  userId: string,
  revokedAt: Date
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt })
    .where(eq(refreshTokens.userId, userId));
}

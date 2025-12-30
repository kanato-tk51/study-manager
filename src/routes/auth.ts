import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { refreshTokens, users } from "../db/schema";
import {
  hashToken,
  issueRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  signAccessToken,
} from "../services/auth";
import { isNonEmptyString } from "../utils/validation";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "email_taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, displayName: displayName?.trim() || null })
    .returning({ id: users.id, email: users.email, displayName: users.displayName });

  const user = inserted[0];
  const accessToken = signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id);

  res.status(201).json({ user, accessToken, refreshToken });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const found = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = found[0];
  if (!user) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id);

  res.status(200).json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
    accessToken,
    refreshToken,
  });
});

router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!isNonEmptyString(refreshToken)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const tokenHash = hashToken(refreshToken);
  const rows = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  const record = rows[0];
  if (!record) {
    res.status(401).json({ error: "invalid_refresh_token" });
    return;
  }

  if (record.revokedAt) {
    await revokeAllRefreshTokensForUser(record.userId, new Date());
    res.status(401).json({ error: "refresh_token_reuse_detected" });
    return;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await revokeRefreshToken(tokenHash, new Date());
    res.status(401).json({ error: "refresh_token_expired" });
    return;
  }

  await revokeRefreshToken(tokenHash, new Date());
  const newAccessToken = signAccessToken(record.userId);
  const newRefreshToken = await issueRefreshToken(record.userId);

  res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

router.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!isNonEmptyString(refreshToken)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const tokenHash = hashToken(refreshToken);
  await revokeRefreshToken(tokenHash, new Date());
  res.status(204).send();
});

export default router;

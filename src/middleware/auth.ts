import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth";

export type AuthUser = { id: string };
export type AuthedRequest = Request & { user: AuthUser };

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = req.header("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const token = auth.slice("Bearer ".length);
  const userId = verifyAccessToken(token);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  (req as AuthedRequest).user = { id: userId };
  next();
}

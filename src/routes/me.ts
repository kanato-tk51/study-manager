import { Router, Request, Response } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { categories, dailyNotes, studyRanges, users } from "../db/schema";
import { authMiddleware, AuthedRequest } from "../middleware/auth";
import { isDateString, isNonEmptyString } from "../utils/validation";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const rows = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const user = rows[0];
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }

  res.status(200).json({ user });
});

router.get("/categories", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const rows = await db.select().from(categories).where(eq(categories.userId, id));
  res.status(200).json({ items: rows });
});

router.post("/categories", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { name, description, color } = req.body as {
    name?: string;
    description?: string;
    color?: string;
  };

  if (!isNonEmptyString(name) || !isNonEmptyString(color)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const inserted = await db
    .insert(categories)
    .values({ userId: id, name, description: description?.trim() || null, color })
    .returning();

  res.status(201).json({ item: inserted[0] });
});

router.get("/categories/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: categoryId } = req.params;
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, id)))
    .limit(1);

  const item = rows[0];
  if (!item) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ item });
});

router.patch("/categories/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: categoryId } = req.params;
  const { name, description, color } = req.body as {
    name?: string;
    description?: string;
    color?: string;
  };

  const updates: {
    name?: string;
    description?: string | null;
    color?: string;
    updatedAt?: Date;
  } = { updatedAt: new Date() };

  if (typeof name === "string") updates.name = name.trim();
  if (typeof description === "string") updates.description = description.trim();
  if (description === null) updates.description = null;
  if (typeof color === "string") updates.color = color.trim();

  const updated = await db
    .update(categories)
    .set(updates)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, id)))
    .returning();

  const item = updated[0];
  if (!item) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ item });
});

router.delete("/categories/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: categoryId } = req.params;
  const deleted = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, id)))
    .returning({ id: categories.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(204).send();
});

router.get("/study-ranges", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { start, end, categoryId } = req.query as {
    start?: string;
    end?: string;
    categoryId?: string;
  };

  const conditions = [eq(studyRanges.userId, id)];
  if (isDateString(start)) {
    conditions.push(gte(studyRanges.startDate, start));
  }
  if (isDateString(end)) {
    conditions.push(lte(studyRanges.endDate, end));
  }
  if (isNonEmptyString(categoryId)) {
    conditions.push(eq(studyRanges.categoryId, categoryId));
  }

  const rows = await db.select().from(studyRanges).where(and(...conditions));
  res.status(200).json({ items: rows });
});

router.post("/study-ranges", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { categoryId, startDate, endDate } = req.body as {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  };

  if (!isNonEmptyString(categoryId) || !isDateString(startDate) || !isDateString(endDate)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const inserted = await db
    .insert(studyRanges)
    .values({ userId: id, categoryId, startDate, endDate })
    .returning();

  res.status(201).json({ item: inserted[0] });
});

router.get("/study-ranges/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: rangeId } = req.params;
  const rows = await db
    .select()
    .from(studyRanges)
    .where(and(eq(studyRanges.id, rangeId), eq(studyRanges.userId, id)))
    .limit(1);

  const item = rows[0];
  if (!item) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ item });
});

router.patch("/study-ranges/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: rangeId } = req.params;
  const { categoryId, startDate, endDate } = req.body as {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  };

  const updates: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    updatedAt?: Date;
  } = { updatedAt: new Date() };

  if (isNonEmptyString(categoryId)) updates.categoryId = categoryId;
  if (isDateString(startDate)) updates.startDate = startDate;
  if (isDateString(endDate)) updates.endDate = endDate;

  const updated = await db
    .update(studyRanges)
    .set(updates)
    .where(and(eq(studyRanges.id, rangeId), eq(studyRanges.userId, id)))
    .returning();

  const item = updated[0];
  if (!item) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ item });
});

router.delete("/study-ranges/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: rangeId } = req.params;
  const deleted = await db
    .delete(studyRanges)
    .where(and(eq(studyRanges.id, rangeId), eq(studyRanges.userId, id)))
    .returning({ id: studyRanges.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(204).send();
});

router.get("/daily-notes", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { date, from, to } = req.query as {
    date?: string;
    from?: string;
    to?: string;
  };

  const conditions = [eq(dailyNotes.userId, id)];
  if (isDateString(date)) {
    conditions.push(eq(dailyNotes.noteDate, date));
  }
  if (isDateString(from)) {
    conditions.push(gte(dailyNotes.noteDate, from));
  }
  if (isDateString(to)) {
    conditions.push(lte(dailyNotes.noteDate, to));
  }

  const rows = await db.select().from(dailyNotes).where(and(...conditions));
  res.status(200).json({ items: rows });
});

router.post("/daily-notes", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { noteDate, body } = req.body as { noteDate?: string; body?: string };

  if (!isDateString(noteDate) || !isNonEmptyString(body)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const inserted = await db
    .insert(dailyNotes)
    .values({ userId: id, noteDate, body })
    .returning();

  res.status(201).json({ item: inserted[0] });
});

router.get("/daily-notes/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: noteId } = req.params;
  const rows = await db
    .select()
    .from(dailyNotes)
    .where(and(eq(dailyNotes.id, noteId), eq(dailyNotes.userId, id)))
    .limit(1);

  const item = rows[0];
  if (!item) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ item });
});

router.patch("/daily-notes/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: noteId } = req.params;
  const { noteDate, body } = req.body as { noteDate?: string; body?: string };

  const updates: { noteDate?: string; body?: string; updatedAt?: Date } = {
    updatedAt: new Date(),
  };
  if (isDateString(noteDate)) updates.noteDate = noteDate;
  if (isNonEmptyString(body)) updates.body = body;

  const updated = await db
    .update(dailyNotes)
    .set(updates)
    .where(and(eq(dailyNotes.id, noteId), eq(dailyNotes.userId, id)))
    .returning();

  const item = updated[0];
  if (!item) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ item });
});

router.put("/daily-notes/:date", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { date } = req.params;
  const { body } = req.body as { body?: string };

  if (!isDateString(date) || !isNonEmptyString(body)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const existing = await db
    .select({ id: dailyNotes.id })
    .from(dailyNotes)
    .where(and(eq(dailyNotes.userId, id), eq(dailyNotes.noteDate, date)))
    .limit(1);

  if (existing.length === 0) {
    const inserted = await db
      .insert(dailyNotes)
      .values({ userId: id, noteDate: date, body })
      .returning();
    res.status(201).json({ item: inserted[0] });
    return;
  }

  const updated = await db
    .update(dailyNotes)
    .set({ body, updatedAt: new Date() })
    .where(eq(dailyNotes.id, existing[0].id))
    .returning();

  res.status(200).json({ item: updated[0] });
});

router.delete("/daily-notes/:id", async (req: Request, res: Response) => {
  const { id } = (req as AuthedRequest).user;
  const { id: noteId } = req.params;
  const deleted = await db
    .delete(dailyNotes)
    .where(and(eq(dailyNotes.id, noteId), eq(dailyNotes.userId, id)))
    .returning({ id: dailyNotes.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(204).send();
});

export default router;

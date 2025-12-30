import "./config/env";
import express, { Request, Response, NextFunction } from "express";
import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.use("/auth", authRoutes);
app.use("/me", meRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const port = Number(process.env.PORT ?? "9999");
app.listen(port, () => {
  console.log(`API server listening on :${port}`);
});

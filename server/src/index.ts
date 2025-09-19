import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import l1Router from "./routes/l1.js";
import l2Router from "./routes/l2.js";
import l3Router from "./routes/l3.js";
import l4Router from "./routes/l4.js";
import companyRouter from "./routes/company.js";
import aiRouter from "./routes/ai.js";

const app = express();

// --- Middleware order matters ---
app.set("trust proxy", 1); // behind Railway/Render/NGINX

// CORS uses env
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// If running behind a proxy (Railway/Render/Fly/Heroku), trust it for accurate protocol
// app.set("trust proxy", true);



app.use(cookieParser());
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // form posts (optional)


// Debug: log body keys for login
if (process.env.NODE_ENV !== "production") {
    app.use((req, _res, next) => {
        if (req.path === "/api/auth/login") {
        console.log("Login body keys:", Object.keys((req as any).body ?? {}));
        }
        next();
    });
}
// --- Routes ---
app.use("/api", authRouter);
app.use("/api", l1Router);
app.use("/api", l2Router);
app.use("/api", l3Router);
app.use("/api", l4Router);
app.use("/api", companyRouter);
app.use("/api", aiRouter);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
});

// Global error guard
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Server error" });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
    console.log(`API on http://localhost:${port}`);
});


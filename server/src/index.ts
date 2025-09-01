import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";

const app = express();

// --- Middleware order matters ---
app.use(
    cors({
        origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
        credentials: true,
    })
);
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


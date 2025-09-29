import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";


const app = express();

// --- Middleware ---
app.use(cookieParser());
app.use(express.json());

// --- Healthcheck FIRST (so Railway sees container as healthy) ---
app.get("/api/health", (_req, res) => res.status(200).send("ok"));

app.use((req, res, next) => {
    const required = process.env.API_KEY;
    if (!required) return next();                     // no key set → allow (dev)
    const key = req.header("x-api-key");
    if (key !== required) return res.status(401).json({ error: "invalid api key" });
    next();
    });



import cors from "cors";

// OPEN CORS (any site can call you)
app.use(cors({
    origin: true,                    // reflect the Origin header
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","x-api-key"],
    credentials: false               // set true only if you plan cookie-based auth
}));


app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,                         // tune per your needs
    standardHeaders: true,
    legacyHeaders: false
}));

// --- Start server ---
const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 API listening on http://0.0.0.0:${port}`);
    });

    // --- Async bootstrap: Prisma + Routers ---
    (async () => {
    try {
        // Prisma
        const { prisma } = await import("./prisma.js");
        await prisma.$connect();
        console.log("✅ Prisma connected");
    } catch (e) {
        console.error("❌ Prisma connect failed:", e);
    }

    try {
        // Routers
        const { default: authRouter }    = await import("./routes/auth.js");
        const { default: l1Router }      = await import("./routes/l1.js");
        const { default: l2Router }      = await import("./routes/l2.js");
        const { default: l3Router }      = await import("./routes/l3.js");
        const { default: l4Router }      = await import("./routes/l4.js");
        const { default: companyRouter } = await import("./routes/company.js");
        const { default: aiRouter }      = await import("./routes/ai.js");

        app.use("/api", authRouter);
        app.use("/api", l1Router);
        app.use("/api", l2Router);
        app.use("/api", l3Router);
        app.use("/api", l4Router);
        app.use("/api", companyRouter);
        app.use("/api", aiRouter);

        console.log("✅ Routers mounted");
    } catch (e) {
        console.error("❌ Router load failed:", e);
    }
    })();

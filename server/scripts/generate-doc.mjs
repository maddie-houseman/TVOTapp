// Minimal generator: serve client/dist, screenshot pages, build Word doc
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';
import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, HeadingLevel, ImageRun, TextRun } from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

function buildFrontendPagesList() {
  return [
    { route: '/', title: 'Home', description: 'Landing page introducing the TVOT framework with quick links to the L1-L4 layers. Provides entry points into data entry and dashboard views and shows demo mode state from context.' },
    { route: '/framework', title: 'Framework Entry', description: 'Primary data entry workspace for framework layers. Supports structured inputs for operational metrics, tower allocation, and benefit categories that feed ROI calculations downstream.' },
    { route: '/dashboard', title: 'Dashboard', description: 'Visualization and results view summarizing ROI snapshots and performance metrics. Aggregates inputs across layers to present actionable insights.' },
    { route: '/account', title: 'Account', description: 'User account and profile area. Surfaces company context and settings relevant to role-based access and demo mode.' },
    { route: '/login', title: 'Login', description: 'Authentication entry; in demo mode this redirects or bypasses full auth, indicating DB-backed auth when connected.' },
  ];
}

function buildBackendSections() {
  return [
    { title: 'Server Entry (`server/src/index.ts`)', description: 'Bootstraps the Express app, sets JSON and cookie middleware, and mounts feature routers under /api. It attempts to connect Prisma on startup and logs status, providing a central integration point.' },
    { title: 'Auth Middleware (`server/src/middleware/auth.ts`)', description: 'Parses JWT from cookies or Authorization header and attaches a typed user to the request. Enforces authentication when required and returns 401 on invalid or missing tokens.' },
    { title: 'RBAC Middleware (`server/src/middleware/rbac.ts`)', description: 'Guards endpoints with role checks (e.g., ADMIN) to ensure least-privilege access to company and framework resources.' },
    { title: 'Company Routes (`server/src/routes/company.ts`)', description: 'Provides endpoints to list and manage companies. Protected by auth and admin checks; backed by Prisma queries with ordering and basic shapes.' },
    { title: 'L1-L4 Routes (`server/src/routes/l1.ts`…`l4.ts`)', description: 'Layered endpoints accept validated payloads (zod) and transform periods into canonical dates. They persist and retrieve framework data, enabling the ROI pipeline.' },
    { title: 'AI Routes (`server/src/routes/ai.ts`)', description: 'Holds AI-related endpoints (e.g., summarization or scoring) to complement framework analysis. Mounted under /api and integrated with auth as needed.' },
    { title: 'Prisma Client (`server/src/prisma.ts`, `schema.prisma`)', description: 'Initializes and exports a Prisma client used across routers. The schema defines entities like Company and framework records, providing type-safe DB access.' },
    { title: 'ROI Utilities (`server/src/utils/roi.ts`)', description: 'Calculations and helpers to convert inputs into ROI metrics and summaries. Centralizes math and domain logic to keep routes lean and testable.' },
    { title: 'Validators (`server/src/utils/validators.ts`)', description: 'Shared zod schemas and helpers to standardize input validation across layers. Improves reliability and user feedback for malformed requests.' },
  ];
}

async function startStaticServer(staticDir) {
  const app = express();
  app.use(express.static(staticDir, { extensions: ['html'] }));
  app.get('*', (req, res) => {
    // Fallback to index.html for SPA routes
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;
  return { server, baseUrl };
}

async function captureScreenshots(baseUrl, pages, outDir) {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    const results = [];
    for (const p of pages) {
      const url = `${baseUrl}${p.route}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      // Ensure consistent viewport for readability in docx
      await page.setViewport({ width: 1366, height: 900 });
      // Small wait for SPA transitions/animations
      await page.waitForTimeout(500);
      const fileName = `${p.title.replace(/\W+/g, '_')}.png`;
      const filePath = path.join(outDir, fileName);
      await page.screenshot({ path: filePath, fullPage: true });
      results.push({ ...p, screenshotPath: filePath });
    }
    return results;
  } finally {
    await browser.close();
  }
}

function docParagraph(text, heading = false) {
  if (heading) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
  }
  return new Paragraph({ children: [new TextRun({ text })] });
}

async function buildDocx(frontendShots, backendSections, outputPath) {
  const children = [];
  children.push(new Paragraph({ text: 'TVOTapp — Codebase Overview', heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ text: 'Generated document with key components, functions, and parts of the codebase. Each frontend page includes a screenshot and a ~3-sentence description.' }));

  children.push(new Paragraph({ text: 'Frontend', heading: HeadingLevel.HEADING_1 }));
  for (const shot of frontendShots) {
    children.push(docParagraph(`${shot.title} (${shot.route})`, true));
    children.push(docParagraph(shot.description));
    try {
      const img = fs.readFileSync(shot.screenshotPath);
      children.push(new Paragraph({ children: [new ImageRun({ data: img, transformation: { width: 1100, height: 0 } })] }));
    } catch {
      children.push(docParagraph('[screenshot unavailable]'));
    }
  }

  children.push(new Paragraph({ text: 'Backend', heading: HeadingLevel.HEADING_1 }));
  for (const s of backendSections) {
    children.push(docParagraph(s.title, true));
    children.push(docParagraph(s.description));
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  await fs.promises.writeFile(outputPath, buffer);
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const staticDir = path.join(repoRoot, 'client', 'dist');
  const outDir = path.join(repoRoot, 'server', 'docs', 'screens');
  const docDir = path.join(repoRoot, 'server', 'docs');
  const docPath = path.join(docDir, 'TVOTapp-Overview.docx');

  if (!fs.existsSync(path.join(staticDir, 'index.html'))) {
    throw new Error(`Built client not found at ${staticDir}. Build the client first (e.g., npm run build in client).`);
  }

  await ensureDir(outDir);
  await ensureDir(docDir);

  const { server, baseUrl } = await startStaticServer(staticDir);
  try {
    const pages = buildFrontendPagesList();
    const shots = await captureScreenshots(baseUrl, pages, outDir);
    const backend = buildBackendSections();
    await buildDocx(shots, backend, docPath);
    console.log(`✅ Word document created at: ${docPath}`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('❌ Generator failed:', err);
  process.exit(1);
});

















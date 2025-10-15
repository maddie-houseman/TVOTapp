import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load ../.env relative to compiled JS (or ts-node). From src/, ../.env = server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = (name: string, v: string | undefined) => {
    if (!v) throw new Error(`Missing env var ${name}`);
    return v;
};

export const ENV = {
    PORT: Number(process.env.PORT || 8080),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || (() => {
        console.error('DATABASE_URL environment variable is not set!');
        console.error('This will cause database connection failures.');
        // For local development, use a fallback that doesn't require SSL
        return 'postgresql://postgres:password@localhost:5432/tvotapp?sslmode=disable';
    })(),
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE || 'none') as 'lax' | 'strict' | 'none',
    COOKIE_SECURE: (process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true',
};


import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = (name: string, v: string | undefined) => {
    if (!v) throw new Error(`Missing env var ${name}`);
    return v;
};

export const ENV = {
    PORT: Number(process.env.PORT || 8080),
    NODE_ENV: process.env.NODE_ENV || 'production',
    DATABASE_URL: process.env.DATABASE_URL || (() => {
        throw new Error('DATABASE_URL environment variable is required');
    })(),
    JWT_SECRET: process.env.JWT_SECRET || (() => {
        throw new Error('JWT_SECRET environment variable is required');
    })(),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE || 'none') as 'lax' | 'strict' | 'none',
    COOKIE_SECURE: (process.env.COOKIE_SECURE || 'true').toLowerCase() === 'true',
};


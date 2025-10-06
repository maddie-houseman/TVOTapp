import path from 'path';
import dotenv from 'dotenv';

// Load ../.env relative to compiled JS (or ts-node). From src/, ../.env = server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = (name: string, v: string | undefined) => {
    if (!v) throw new Error(`Missing env var ${name}`);
    return v;
};

export const ENV = {
    PORT: Number(process.env.PORT || 8080),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: required('DATABASE_URL', process.env.DATABASE_URL),
    JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE || 'none') as 'lax' | 'strict' | 'none',
    COOKIE_SECURE: (process.env.COOKIE_SECURE || 'true').toLowerCase() === 'true',
};


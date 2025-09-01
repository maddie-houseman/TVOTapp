import 'dotenv/config';

const required = (name: string, v: string | undefined) => {
    if (!v) throw new Error(`Missing env var ${name}`);
    return v;
};

    export const ENV = {
    PORT: Number(process.env.PORT || 8080),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: required('DATABASE_URL', process.env.DATABASE_URL),
    JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};
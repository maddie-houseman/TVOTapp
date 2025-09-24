import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'AdminPass123!';

    const hash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
        email,
        name: 'Admin',
        role: 'ADMIN',
        passwordHash: hash,
        },
    });

    console.log(`Seeded ${email} / ${password}`);
    }

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
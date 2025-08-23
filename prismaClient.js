import { PrismaClient } from '@prisma/client';

let prisma;
console.log("DATABASE_URL =", process.env.DATABASE_URL);
if (!global.prisma) {
  global.prisma = new PrismaClient();
}

prisma = global.prisma;
export default prisma;
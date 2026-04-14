import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
}

export async function createUser(
  prisma: PrismaService,
  email: string,
  password: string,
  role: UserRole = UserRole.USER,
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, passwordHash, role },
  });
}

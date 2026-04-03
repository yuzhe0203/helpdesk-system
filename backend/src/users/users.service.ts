import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(userId: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

    async createUser(email: string, passwordHash: string): Promise<User> {
        return this.prisma.user.create({
            data: {
                email,  
                passwordHash,
                role: UserRole.USER,
            },
        });
    }

    async getAllAgents() {
        return this.prisma.user.findMany({
            where: { role: UserRole.AGENT },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
    }

    async updateRefreshToken(userId: string, refreshTokenHash: string | null){
        return this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash },
        });
    }

}

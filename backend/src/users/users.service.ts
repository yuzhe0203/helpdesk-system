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

    async createUser(email: string, passwordHash: string): Promise<User> {
        return this.prisma.user.create({
            data: {
                email,  
                passwordHash,
                role: UserRole.USER,
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

import { ConflictException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from 'jsonwebtoken';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password } = registerDto;

        // 檢查是否已存在相同 email 的使用者
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email is already registered');
        }

        // 密碼加密
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 創建新使用者
        const newUser = await this.usersService.createUser(email, passwordHash);

        return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // 根據 email 查找使用者
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 驗證密碼
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role as any,
            jti: randomUUID(),
        };

        // 生成 access token
        const accessToken = await this.jwtService.signAsync(payload);

        // 生成 refresh token
        const refreshSecret =
            this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        const refreshExpiresIn = this.configService.getOrThrow<string>(
            'JWT_REFRESH_EXPIRES_IN',
        );
        const refreshOptions: JwtSignOptions = {
            secret: refreshSecret,
            expiresIn: refreshExpiresIn as any,
        };

        const refreshToken = await this.jwtService.signAsync(
            payload,
            refreshOptions,
        );

        // 將 refresh token 的 hash 存儲在資料庫中
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

        return { accessToken, refreshToken };
    }

    async refresh(refreshToken: string) {
        const refreshSecret =
            this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        const refreshExpiresIn = this.configService.getOrThrow<string>(
            'JWT_REFRESH_EXPIRES_IN',
        );

        // 驗證 refresh token的有效性
        let payload: JwtPayload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: refreshSecret,
            });
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 從 payload 中獲取 userId
        const userId = (payload?.sub as string) || undefined;
        if (!userId) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        //
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const isRefreshTokenValid = await bcrypt.compare(
            refreshToken,
            user.refreshTokenHash,
        );
        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const newPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role as any,
            jti: randomUUID(),
        };

        // 生成新的 access token
        const accessToken = await this.jwtService.signAsync(newPayload);

        // 生成新的 refresh token
        const newRefreshToken = await this.jwtService.signAsync({ newPayload, jti: randomUUID() }, {
            secret: refreshSecret,
            expiresIn: refreshExpiresIn as any,
        });

        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
        await this.usersService.updateRefreshToken(user.id, newRefreshTokenHash);

        return { accessToken, refreshToken: newRefreshToken };
    }
}

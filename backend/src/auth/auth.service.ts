import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

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
        const newUser = await this.usersService.createUser(
            email,
            passwordHash,
        );


        return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
        };
    }
}

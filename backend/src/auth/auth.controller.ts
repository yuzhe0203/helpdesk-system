import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards, Get } from '@nestjs/common';
import { AccessTokenGuard } from './guards/access-token.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    async refresh(@Body() refreshDto: RefreshDto) {
        return this.authService.refresh(refreshDto.refreshToken);
    }

    @UseGuards(AccessTokenGuard)
    @Post('logout')
    async logout(@CurrentUser() user: any) {
        return this.authService.logout(user.userId);
    }

    @UseGuards(AccessTokenGuard)
    @Get('profile')
    async getProfile(@CurrentUser() user: any) {
        console.log("DEBUG - Backend getProfile called, user object:", user);
        // Fetch full user data to include email
        const fullUser = await this.authService.getUserProfile(user.userId);
        console.log("DEBUG - Backend returning user profile:", fullUser);
        return fullUser;
    }
}
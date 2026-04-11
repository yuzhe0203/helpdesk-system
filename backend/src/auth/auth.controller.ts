import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards, Get } from '@nestjs/common';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CurrentUserPayload } from '../common/types/user.types';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @ApiOperation({ summary: 'Login a user' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    @Post('refresh')
    async refresh(@Body() refreshDto: RefreshDto) {
        return this.authService.refresh(refreshDto.refreshToken);
    }

    @ApiOperation({ summary: 'Logout a user' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    @ApiResponse({ status: 401, description: 'Invalid access token' })
    @ApiBearerAuth()
    @UseGuards(AccessTokenGuard)
    @Post('logout')
    async logout(@CurrentUser() user: CurrentUserPayload) {
        return this.authService.logout(user.userId);
    }

    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Invalid access token' })
    @ApiBearerAuth()
    @UseGuards(AccessTokenGuard)
    @Get('profile')
    async getProfile(@CurrentUser() user: CurrentUserPayload) {
        // Fetch full user data to include email
        const fullUser = await this.authService.getUserProfile(user.userId);
        return fullUser;
    }
}
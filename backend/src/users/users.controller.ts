import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get all agents for ticket assignment
  @ApiOperation({ summary: 'Get all agents (for assignment dropdown)' })
  @ApiResponse({ status: 200, description: 'List of users with AGENT role' })
  @UseGuards(AccessTokenGuard)
  @Get('agents')
  getAgents() {
    return this.usersService.getAllAgents();
  }
}

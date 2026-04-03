import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get all agents for ticket assignment
  @UseGuards(AccessTokenGuard)
  @Get('agents')
  getAgents() {
    return this.usersService.getAllAgents();
  }
}

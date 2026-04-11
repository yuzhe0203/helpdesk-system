import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is running', schema: { example: { status: 'ok', timestamp: '2026-04-11T00:00:00.000Z' } } })
  @Get('health')
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

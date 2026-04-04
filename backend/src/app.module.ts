import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TicketsModule } from './tickets/tickets.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLoggerService } from './common/services/logger.service';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, ConfigModule.forRoot({ isGlobal: true }), TicketsModule],
  controllers: [AppController],
  providers: [
    AppLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';
import { OwnerAuthGuard } from './owner.guard.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, OwnerAuthGuard, LoginRateLimitGuard],
  exports: [AuthService, OwnerAuthGuard],
})
export class AuthModule {}

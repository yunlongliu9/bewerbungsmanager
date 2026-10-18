import { Body, Controller, Get, Headers, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { validationPipeFor } from '../common/validation-pipes.js';
import { AuthService, SESSION_COOKIE } from './auth.service.js';
import { BootstrapOwnerDto } from './dto/bootstrap-owner.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';
import { OwnerAuthGuard } from './owner.guard.js';

type RequestWithOwner = Request & {
  owner?: {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('bootstrap')
  bootstrap(
    @Body(validationPipeFor(BootstrapOwnerDto)) bootstrapOwnerDto: BootstrapOwnerDto,
    @Headers('x-bootstrap-secret') bootstrapSecret: string | undefined,
  ) {
    return this.authService.bootstrapOwner(
      bootstrapOwnerDto.email,
      bootstrapOwnerDto.password,
      bootstrapSecret ?? '',
    );
  }

  @Post('login')
  @UseGuards(LoginRateLimitGuard)
  async login(
    @Body(validationPipeFor(LoginDto)) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    response.cookie(SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { owner: result.owner };
  }

  @Get('session')
  @UseGuards(OwnerAuthGuard)
  session(@Req() request: RequestWithOwner) {
    return { owner: request.owner };
  }

  @Post('logout')
  @UseGuards(OwnerAuthGuard)
  async logout(@Req() request: RequestWithOwner, @Res({ passthrough: true }) response: Response) {
    const cookieHeader = request.headers.cookie;
    const sessionToken = this.readCookie(cookieHeader, SESSION_COOKIE);

    await this.authService.revokeToken(sessionToken);
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { status: 'ok' };
  }

  private readCookie(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) {
      return undefined;
    }

    for (const part of cookieHeader.split(';')) {
      const [key, ...value] = part.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value.join('='));
      }
    }

    return undefined;
  }
}

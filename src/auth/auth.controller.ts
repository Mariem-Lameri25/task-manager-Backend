import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ✅ NEW: Get current user endpoint
 // @Get('me')
  //@UseGuards(AuthGuard('jwt'))
  //getCurrentUser(@Request() req) {
   // return this.authService.getCurrentUser(req.user.id);
 // }
  // Test endpoint to verify JWT authentication
  @Get('test')
  @UseGuards(AuthGuard('jwt'))
  testAuth(@Request() req) {
    console.log('Auth test - User object:', req.user);
    return {
      message: 'JWT authentication working!',
      user: req.user,
    };
  }

  @Get('ping')
  ping() {
    console.log('✅ Ping route hit');
    return { message: 'pong' };
  }

  @Public()
@Post('forgot-password')
requestPasswordReset(@Body() dto: ForgotPasswordDto) {
  return this.authService.requestPasswordReset(dto.email);
}

@Public()
@Post('reset-password')
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}

}

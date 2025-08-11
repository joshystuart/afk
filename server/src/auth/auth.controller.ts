import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, LoginCredentials, AuthPayload } from './auth.service';
import { Public } from './auth.guard';
import { LoginRequestDto } from './login-request.dto';

export class LoginResponseDto {
  token!: string;
  user!: AuthPayload;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() credentials: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.debug('Logging in with', credentials);
    return this.authService.login(credentials);
  }
}

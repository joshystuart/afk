import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, AuthPayload } from './auth.service';
import { Public } from './auth.guard';
import { LoginRequestDto } from './login-request.dto';

export class LoginResponseDto {
  token!: string;
  user!: AuthPayload;
}

class SetupRequestDto {
  username!: string;
  password!: string;
}

class UpdatePasswordRequestDto {
  currentPassword!: string;
  newPassword!: string;
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

  @Public()
  @Get('setup-status')
  @ApiOperation({ summary: 'Check if initial setup is required' })
  @ApiResponse({ status: 200, description: 'Setup status' })
  async getSetupStatus(): Promise<{ setupRequired: boolean }> {
    const setupRequired = await this.authService.isSetupRequired();
    return { setupRequired };
  }

  @Public()
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create initial admin account' })
  @ApiResponse({ status: 201, description: 'Admin account created' })
  @ApiResponse({ status: 400, description: 'Admin user already exists' })
  async setup(@Body() body: SetupRequestDto): Promise<LoginResponseDto> {
    return this.authService.setup(body.username, body.password);
  }

  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update admin password' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async updatePassword(
    @Body() body: UpdatePasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.updatePassword(body.currentPassword, body.newPassword);
    return { message: 'Password updated successfully' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Request() req: any): Promise<{ message: string }> {
    const user = req.user;
    this.logger.log(`User logged out: ${user?.username || 'unknown'}`);
    return { message: 'Logout successful' };
  }
}

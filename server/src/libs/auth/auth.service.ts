import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../config/app.config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
  ) {}

  async login(
    credentials: LoginCredentials,
  ): Promise<{ token: string; user: AuthPayload }> {
    const { username, password } = credentials;
    const { adminUser } = this.appConfig;

    this.logger.log(`Login attempt for username: ${username}`);

    // Validate credentials against configured admin user
    if (username !== adminUser.username || password !== adminUser.password) {
      this.logger.warn(`Failed login attempt for username: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AuthPayload = {
      userId: 'admin',
      username: adminUser.username,
      isAdmin: true,
    };

    const token = this.jwtService.sign(payload);

    this.logger.log(`Successful login for username: ${username}`);

    return {
      token,
      user: payload,
    };
  }

  async validateToken(token: string): Promise<AuthPayload> {
    try {
      const payload = this.jwtService.verify(token);
      this.logger.debug(
        `Token validated successfully for user: ${payload.username}`,
      );
      return payload;
    } catch (error) {
      this.logger.warn(`Invalid token validation attempt`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}

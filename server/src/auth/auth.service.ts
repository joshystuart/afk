import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../libs/config/app.config';

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
  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
  ) {}

  async login(credentials: LoginCredentials): Promise<{ token: string; user: AuthPayload }> {
    const { username, password } = credentials;
    const { adminUser } = this.appConfig;

    // Validate credentials against configured admin user
    if (username !== adminUser.username || password !== adminUser.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AuthPayload = {
      userId: 'admin',
      username: adminUser.username,
      isAdmin: true,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: payload,
    };
  }

  async validateToken(token: string): Promise<AuthPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
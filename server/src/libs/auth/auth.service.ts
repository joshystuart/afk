import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../domain/admin-user/admin-user.entity';
import { AdminUserRepository } from '../../domain/admin-user/admin-user.repository';
import { ADMIN_USER_REPOSITORY } from '../../domain/admin-user/admin-user.tokens';

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
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  async login(
    credentials: LoginCredentials,
  ): Promise<{ token: string; user: AuthPayload }> {
    const { username, password } = credentials;

    this.logger.log(`Login attempt for username: ${username}`);

    const adminUser = await this.adminUserRepository.get();
    if (!adminUser) {
      this.logger.warn('Login attempt but no admin user has been set up');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      username !== adminUser.username ||
      !(await bcrypt.compare(password, adminUser.passwordHash))
    ) {
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

  async setup(
    username: string,
    password: string,
  ): Promise<{ token: string; user: AuthPayload }> {
    const exists = await this.adminUserRepository.exists();
    if (exists) {
      throw new BadRequestException('Admin user already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const adminUser = new AdminUser();
    adminUser.username = username;
    adminUser.passwordHash = passwordHash;
    await this.adminUserRepository.save(adminUser);

    this.logger.log(`Admin user created: ${username}`);

    const payload: AuthPayload = {
      userId: 'admin',
      username,
      isAdmin: true,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: payload,
    };
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const adminUser = await this.adminUserRepository.get();
    if (!adminUser) {
      throw new BadRequestException('No admin user exists');
    }

    const isValid = await bcrypt.compare(
      currentPassword,
      adminUser.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    adminUser.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.adminUserRepository.save(adminUser);

    this.logger.log('Admin user password updated');
  }

  async isSetupRequired(): Promise<boolean> {
    const exists = await this.adminUserRepository.exists();
    return !exists;
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

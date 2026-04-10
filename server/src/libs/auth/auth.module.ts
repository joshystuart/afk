import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthConfig } from './auth.config';
import { AdminUser } from '../../domain/admin-user/admin-user.entity';
import { AdminUserRepositoryImpl } from '../admin-user/admin-user.repository';
import { ADMIN_USER_REPOSITORY } from '../../domain/admin-user/admin-user.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    JwtModule.registerAsync({
      useFactory: (config: AuthConfig) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: '24h' },
      }),
      inject: [AuthConfig],
    }),
  ],
  providers: [
    AuthService,
    AuthGuard,
    {
      provide: ADMIN_USER_REPOSITORY,
      useClass: AdminUserRepositoryImpl,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}

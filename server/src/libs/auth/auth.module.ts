import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthConfig } from './auth.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: AuthConfig) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: '24h' },
      }),
      inject: [AuthConfig],
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}

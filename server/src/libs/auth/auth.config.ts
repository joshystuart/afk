import { IsString } from 'class-validator';

export class AuthConfig {
  @IsString()
  public readonly jwtSecret!: string;
}

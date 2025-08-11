import { IsString, MinLength } from 'class-validator';

export class AdminUserConfig {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  public readonly username!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  public readonly password!: string;
}

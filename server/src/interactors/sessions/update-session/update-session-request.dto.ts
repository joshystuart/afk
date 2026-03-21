import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  SESSION_PERMISSION_MODES,
  type SessionPermissionMode,
} from '../../../domain/sessions/permission-mode';

export class UpdateSessionRequest {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  model?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @IsIn(SESSION_PERMISSION_MODES)
  permissionMode?: SessionPermissionMode;
}

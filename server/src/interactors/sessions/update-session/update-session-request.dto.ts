import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

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
  @IsIn(['plan', 'agent'])
  agentMode?: string | null;
}

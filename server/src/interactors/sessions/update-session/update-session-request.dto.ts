import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

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
  agentMode?: string | null;
}

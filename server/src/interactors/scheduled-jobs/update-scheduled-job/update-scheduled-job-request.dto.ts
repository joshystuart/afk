import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ScheduleType } from '../../../domain/scheduled-jobs/schedule-type.enum';

export class UpdateScheduledJobRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  repoUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  branch?: string;

  @IsOptional()
  @IsBoolean()
  createNewBranch?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  newBranchPrefix?: string;

  @IsOptional()
  @IsString()
  @IsUUID('4')
  imageId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  prompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string | null;

  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @ValidateIf(
    (o: UpdateScheduledJobRequest) => o.scheduleType === ScheduleType.CRON,
  )
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ValidateIf(
    (o: UpdateScheduledJobRequest) => o.scheduleType === ScheduleType.INTERVAL,
  )
  @IsOptional()
  @IsNumber()
  intervalMs?: number;

  @IsOptional()
  @IsBoolean()
  commitAndPush?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

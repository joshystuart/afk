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

export class CreateScheduledJobRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  repoUrl!: string;

  @IsString()
  @MinLength(1)
  branch!: string;

  @IsOptional()
  @IsBoolean()
  createNewBranch?: boolean;

  @ValidateIf((o) => o.createNewBranch === true)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  newBranchPrefix?: string;

  @IsString()
  @IsUUID('4')
  imageId!: string;

  @IsString()
  @MinLength(1)
  prompt!: string;

  @IsEnum(ScheduleType)
  scheduleType!: ScheduleType;

  @ValidateIf((o) => o.scheduleType === ScheduleType.CRON)
  @IsString()
  cronExpression?: string;

  @ValidateIf((o) => o.scheduleType === ScheduleType.INTERVAL)
  @IsNumber()
  intervalMs?: number;

  @IsOptional()
  @IsBoolean()
  commitAndPush?: boolean;
}
